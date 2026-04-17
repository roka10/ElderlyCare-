# -*- coding: utf-8 -*-
"""
Elderly Care Monitoring Backend
================================
Persistence layer  : Supabase (PostgreSQL + Storage)
Detection pipeline : MediaPipe Pose (landmark-based motion & fall)
                   + ONNX FER (simultaneous emotion detection)
                   + YuNet (face detection) + SFace (face recognition)

Flow:
  ADD VISITOR  → Upload photo to Supabase Storage
               → Insert row in `known_persons` table
               → Retrain SFace embeddings (synchronous, with result check)
  SERVER START → Fetch all known persons from Supabase
               → Download photos locally
               → Extract SFace embeddings (faces ready before first camera frame)
  LIVE FEED    → MediaPipe Pose landmarks (33 keypoints) for motion & fall
               → FER emotion detection on face ROI (every frame)
               → YuNet face detection + SFace recognition (throttled)
"""

from flask import Flask, jsonify, Response, request
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS, cross_origin
from models import db
from config import Config
from routes.auth import auth_bp
from routes.main import main_bp

import os, cv2, threading, time, shutil, urllib.request, math
import numpy as np

# ── MediaPipe ──────────────────────────────────────────────────────────────────
import mediapipe as mp
mp_pose      = mp.solutions.pose
mp_drawing   = mp.solutions.drawing_utils
mp_styles    = mp.solutions.drawing_styles
mp_face_mesh = mp.solutions.face_mesh

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, origins="*")
db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=app.config.get("MESSAGE_QUEUE"))
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(main_bp, url_prefix="/api")

# ─── Supabase Client ───────────────────────────────────────────────────────────
supabase_client = None
SUPABASE_BUCKET = app.config.get("SUPABASE_BUCKET", "known-faces")

def _init_supabase():
    global supabase_client
    url = app.config.get("SUPABASE_URL", "")
    key = app.config.get("SUPABASE_KEY", "")
    if url and key and not url.startswith("https://your-"):
        try:
            from supabase import create_client
            supabase_client = create_client(url, key)
            print(f"[Supabase] Connected to {url}")
        except Exception as e:
            print(f"[Supabase] Connection failed: {e}")
    else:
        print("[Supabase] No credentials set — running in local-only mode.")

_init_supabase()

# ─── Directories ──────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(__file__)
KNOWN_FACES_DIR = os.path.join(BASE_DIR, "known_faces")
MODEL_DIR       = os.path.join(BASE_DIR, "models")
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── Shared Detection State ───────────────────────────────────────────────────
detection_state = {
    "face_name": "No Face",
    "emotion": "N/A",
    "emotion_confidence": 0.0,
    "motion": "No Motion",
    "fall": "No Fall",
    "faces_count": 0,
    "pose_status": "No Person",     # Standing / Sitting / Lying / Walking / …
    "activity": "Idle",             # Idle / Walking / Waving / Bending / …
    "landmark_count": 0,            # number of visible pose landmarks
}
state_lock  = threading.Lock()
latest_frame = None
frame_lock  = threading.Lock()

# ─── Camera (lazy — only opened when user clicks Start Camera) ────────────────
camera = None
camera_active = False
camera_lock = threading.Lock()
camera_generation = 0          # bumped on every stop → lets old generators exit fast

def open_camera():
    global camera, camera_active
    with camera_lock:
        if camera is not None and camera.isOpened():
            camera_active = True
            return True
        cam = cv2.VideoCapture(0)
        if cam.isOpened():
            cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cam.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            camera = cam
            camera_active = True
            print("[Camera] Opened (640×480)")
            return True
        camera = None
        camera_active = False
        print("[Camera] Failed to open")
        return False

def close_camera():
    global camera, camera_active, camera_generation
    camera_active = False
    camera_generation += 1     # signal old generators to exit
    time.sleep(0.3)            # give the generator loop time to see the flag
    with camera_lock:
        if camera is not None:
            try:
                camera.release()
            except Exception:
                pass
            camera = None
            print("[Camera] Released")

# ─── Deep Learning Face Detection & Recognition (YuNet + SFace) ───────────
YUNET_MODEL_PATH = os.path.join(MODEL_DIR, "face_detection_yunet.onnx")
SFACE_MODEL_PATH = os.path.join(MODEL_DIR, "face_recognition_sface.onnx")
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

def _download_model(url, path, label):
    if not os.path.exists(path):
        print(f"[{label}] Downloading model…")
        try:
            urllib.request.urlretrieve(url, path)
            print(f"[{label}] Model downloaded to {path}")
        except Exception as e:
            print(f"[{label}] Download failed: {e}")

_download_model(YUNET_URL, YUNET_MODEL_PATH, "YuNet")
_download_model(SFACE_URL, SFACE_MODEL_PATH, "SFace")

yunet = None
sface = None
try:
    yunet = cv2.FaceDetectorYN_create(YUNET_MODEL_PATH, "", (320, 320))
    sface = cv2.FaceRecognizerSF_create(SFACE_MODEL_PATH, "")
    print("[Face] YuNet + SFace models loaded successfully.")
except Exception as e:
    print(f"[Face] YuNet/SFace init failed: {e}")

known_face_embeddings = {}
face_lock  = threading.Lock()

def train_faces():
    """Extract deep CNN features for all users using SFace."""
    global known_face_embeddings
    if yunet is None or sface is None:
        return
        
    new_embeddings = {}
    print("[SFace] Training deep features...")
    for person_name in sorted(os.listdir(KNOWN_FACES_DIR)):
        person_dir = os.path.join(KNOWN_FACES_DIR, person_name)
        if not os.path.isdir(person_dir):
            continue
        
        person_features = []
        for fname in os.listdir(person_dir):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            img = cv2.imread(os.path.join(person_dir, fname))
            if img is None: continue
            
            # Sub-scale massive uploaded photos
            h, w = img.shape[:2]
            if h > 1000 or w > 1000:
                scale = 1000.0 / max(h, w)
                img = cv2.resize(img, (0, 0), fx=scale, fy=scale)
                h, w = img.shape[:2]
                
            yunet.setInputSize((w, h))
            _, faces = yunet.detect(img)
            
            if faces is not None and len(faces) > 0:
                # SFace alignCrop expects the face array output from YuNet
                try:
                    aligned = sface.alignCrop(img, faces[0])
                    feature = sface.feature(aligned)
                    person_features.append(feature)
                except Exception as e:
                    print(f"[SFace] Align error on {fname}: {e}")
                
        if person_features:
            # Average features if the user uploaded multiple photos
            avg_feature = np.mean(person_features, axis=0)
            new_embeddings[person_name] = avg_feature
            
    with face_lock:
        known_face_embeddings = new_embeddings
        print(f"[SFace] Deep features loaded for {len(known_face_embeddings)} persons: {list(known_face_embeddings.keys())}")


def recognize_face(frame, face_data):
    """Recognize a detected YuNet face against known SFace embeddings."""
    with face_lock:
        if not known_face_embeddings:
            return "Unknown", 0.0
            
        try:
            aligned = sface.alignCrop(frame, face_data)
            feature = sface.feature(aligned)
        except Exception:
            return "Unknown", 0.0
        
        best_match = "Unknown"
        best_score = 0.0
        
        for name, emb in known_face_embeddings.items():
            # cv2.FaceRecognizerSF_FR_COSINE = 0
            score = sface.match(feature, emb, cv2.FaceRecognizerSF_FR_COSINE)
            if score > best_score:
                best_score = score
                best_match = name
                
        # SFace Cosine distance threshold: >0.363 means same person
        if best_score >= 0.363:
            # Scale score for UI (0.363 -> 0%, 1.0 -> 100%)
            conf_ui = min(1.0, (best_score - 0.363) / (1.0 - 0.363))
            return best_match, round(conf_ui, 2)
            
        return "Unknown", 0.0

# ─── Supabase Sync ────────────────────────────────────────────────────────────
def sync_from_supabase():
    if not supabase_client:
        print("[Supabase Sync] No client — training from local files only.")
        train_faces()
        return
    try:
        result = supabase_client.table("known_persons").select("*").execute()
        persons = result.data or []
        print(f"[Supabase Sync] Found {len(persons)} known persons in DB.")
        for p in persons:
            name      = p.get("name", "Unknown")
            photo_url = p.get("photo_url", "")
            if not photo_url:
                continue
            person_dir = os.path.join(KNOWN_FACES_DIR, name)
            os.makedirs(person_dir, exist_ok=True)
            img_path = os.path.join(person_dir, "photo.jpg")
            if not os.path.exists(img_path):
                try:
                    urllib.request.urlretrieve(photo_url, img_path)
                    print(f"[Supabase Sync] Downloaded photo for '{name}'")
                except Exception as dl_err:
                    print(f"[Supabase Sync] Failed to download photo for '{name}': {dl_err}")
        train_faces()
    except Exception as e:
        print(f"[Supabase Sync] Error: {e}")
        train_faces()  # still train on whatever is local

# ─── Emotion Model ────────────────────────────────────────────────────────────
EMOTION_LABELS     = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]
emotion_net        = None
EMOTION_MODEL_PATH = os.path.join(MODEL_DIR, "fer_emotion.onnx")
EMOTION_MODEL_URL  = (
    "https://github.com/opencv/opencv_zoo/raw/main/models/"
    "facial_expression_recognition/facial_expression_recognition_mobilefacenet_2022july.onnx"
)

def load_emotion_model():
    global emotion_net
    if not os.path.exists(EMOTION_MODEL_PATH):
        print("[Emotion] Downloading FER ONNX model (~20 MB)…")
        try:
            urllib.request.urlretrieve(EMOTION_MODEL_URL, EMOTION_MODEL_PATH)
            print("[Emotion] Model downloaded.")
        except Exception as e:
            print(f"[Emotion] Download failed: {e}")
            return
    try:
        emotion_net = cv2.dnn.readNetFromONNX(EMOTION_MODEL_PATH)
        print("[Emotion] FER ONNX model loaded.")
    except Exception as e:
        print(f"[Emotion] Load failed: {e}")

def detect_emotion_dnn(face_bgr):
    if emotion_net is None or face_bgr is None or face_bgr.size == 0:
        return "N/A", 0.0
    try:
        blob  = cv2.dnn.blobFromImage(face_bgr, 1.0/255.0, (112, 112), (0,0,0), swapRB=True)
        emotion_net.setInput(blob)
        preds = emotion_net.forward().flatten()
        idx   = int(np.argmax(preds))
        return EMOTION_LABELS[idx], round(float(preds[idx]), 2)
    except Exception:
        return "N/A", 0.0

# ─── MediaPipe Landmark-Based Motion Detection ───────────────────────────────
class LandmarkMotionDetector:
    """
    Uses MediaPipe Pose landmarks (33 body keypoints) to detect:
      • Motion   — by tracking frame-to-frame landmark displacement
      • Activity — walking, waving, bending, idle
      • Posture  — standing, sitting, lying down
      • Fall     — sudden postural collapse (shoulder-to-ankle ratio change)
    """
    def __init__(self):
        self.prev_landmarks = None
        self.prev_time = None
        # Fall detection state
        self.fall_active = False
        self.fall_cooldown_until = 0.0
        self.standing_height_history = []   # recent torso-to-ankle heights
        self.posture_history = []           # last N posture labels
        self.fall_frame_count = 0
        self.prev_nose_y = None             # for rapid nose drop detection
        self.prev_nose_time = None
        # Motion smoothing
        self.motion_history = []            # last N motion magnitudes

    def _landmark_to_px(self, lm, w, h):
        """Convert a normalised landmark to pixel coords."""
        return int(lm.x * w), int(lm.y * h)

    def _visible(self, lm, threshold=0.5):
        """Return True if the landmark visibility is above threshold."""
        return lm.visibility > threshold

    def _dist(self, p1, p2):
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    def analyse(self, landmarks, frame_w, frame_h):
        """
        Analyse a set of MediaPipe Pose landmarks.
        Returns dict with:  motion, activity, posture, is_fall, landmark_count
        """
        now = time.time()
        result = {
            "motion": False,
            "motion_magnitude": 0.0,
            "activity": "Idle",
            "posture": "Unknown",
            "is_fall": False,
            "landmark_count": 0,
        }

        if landmarks is None:
            self.prev_landmarks = None
            self.prev_time = None
            self.fall_frame_count = 0
            result["posture"] = "No Person"
            return result

        lms = landmarks.landmark
        result["landmark_count"] = sum(1 for lm in lms if lm.visibility > 0.5)

        # ── Key landmark pixel positions ──────────────────────────────────────
        PoseLM = mp_pose.PoseLandmark
        kp = {}
        key_indices = {
            "nose":           PoseLM.NOSE,
            "left_shoulder":  PoseLM.LEFT_SHOULDER,
            "right_shoulder": PoseLM.RIGHT_SHOULDER,
            "left_hip":       PoseLM.LEFT_HIP,
            "right_hip":      PoseLM.RIGHT_HIP,
            "left_knee":      PoseLM.LEFT_KNEE,
            "right_knee":     PoseLM.RIGHT_KNEE,
            "left_ankle":     PoseLM.LEFT_ANKLE,
            "right_ankle":    PoseLM.RIGHT_ANKLE,
            "left_wrist":     PoseLM.LEFT_WRIST,
            "right_wrist":    PoseLM.RIGHT_WRIST,
            "left_elbow":     PoseLM.LEFT_ELBOW,
            "right_elbow":    PoseLM.RIGHT_ELBOW,
        }
        for name, idx in key_indices.items():
            lm = lms[idx]
            if self._visible(lm, 0.4):
                kp[name] = self._landmark_to_px(lm, frame_w, frame_h)

        # ── Motion detection via landmark displacement ────────────────────────
        current_positions = []
        for lm in lms:
            if lm.visibility > 0.5:
                current_positions.append((lm.x, lm.y))
            else:
                current_positions.append(None)

        if self.prev_landmarks is not None and self.prev_time is not None:
            dt = max(now - self.prev_time, 0.001)
            total_disp = 0.0
            count = 0
            for cur, prev in zip(current_positions, self.prev_landmarks):
                if cur is not None and prev is not None:
                    dx = (cur[0] - prev[0]) * frame_w
                    dy = (cur[1] - prev[1]) * frame_h
                    total_disp += math.hypot(dx, dy)
                    count += 1
            if count > 0:
                avg_disp = total_disp / count
                velocity = avg_disp / dt   # pixels/sec
                self.motion_history.append(avg_disp)
                if len(self.motion_history) > 10:
                    self.motion_history.pop(0)
                smoothed = sum(self.motion_history) / len(self.motion_history)
                result["motion_magnitude"] = round(smoothed, 1)
                result["motion"] = smoothed > 2.0   # threshold in px

        self.prev_landmarks = current_positions
        self.prev_time = now

        # ── Posture classification using body geometry ────────────────────────
        posture = "Unknown"
        if "left_shoulder" in kp and "right_shoulder" in kp:
            mid_shoulder_y = (kp["left_shoulder"][1] + kp["right_shoulder"][1]) / 2.0
            mid_shoulder_x = (kp["left_shoulder"][0] + kp["right_shoulder"][0]) / 2.0
            shoulder_width = self._dist(kp["left_shoulder"], kp["right_shoulder"])

            if "left_hip" in kp and "right_hip" in kp:
                mid_hip_y = (kp["left_hip"][1] + kp["right_hip"][1]) / 2.0
                torso_height = abs(mid_hip_y - mid_shoulder_y)

                # Get ankle position if available
                ankle_y = None
                if "left_ankle" in kp and "right_ankle" in kp:
                    ankle_y = (kp["left_ankle"][1] + kp["right_ankle"][1]) / 2.0
                elif "left_ankle" in kp:
                    ankle_y = kp["left_ankle"][1]
                elif "right_ankle" in kp:
                    ankle_y = kp["right_ankle"][1]

                knee_y = None
                if "left_knee" in kp and "right_knee" in kp:
                    knee_y = (kp["left_knee"][1] + kp["right_knee"][1]) / 2.0
                elif "left_knee" in kp:
                    knee_y = kp["left_knee"][1]
                elif "right_knee" in kp:
                    knee_y = kp["right_knee"][1]

                # Body height = shoulder to ankle
                body_height = 0
                if ankle_y is not None:
                    body_height = abs(ankle_y - mid_shoulder_y)

                # Ratio of shoulder width to body height
                if body_height > 0:
                    width_to_height = shoulder_width / body_height
                else:
                    width_to_height = 0

                # Classify posture
                if torso_height < 30:
                    # Very short torso -- likely lying down (horizontal)
                    posture = "Lying Down"
                elif width_to_height > 0.7:
                    # Wide relative to tall -- horizontal
                    posture = "Lying Down"
                elif knee_y is not None and ankle_y is not None:
                    knee_to_hip = abs(knee_y - mid_hip_y)
                    ankle_to_knee = abs(ankle_y - knee_y) if ankle_y else 0
                    if knee_to_hip < torso_height * 0.5 and body_height < torso_height * 2.2:
                        posture = "Sitting"
                    else:
                        posture = "Standing"
                else:
                    posture = "Standing"

                # ── Fall Detection using geometry ─────────────────────────────
                # Multi-signal fall detection:
                #   Signal 1: Posture changed to Lying Down (body horizontal)
                #   Signal 2: Rapid nose drop (head drops fast)
                #   Signal 3: Body height collapsed quickly
                if now > self.fall_cooldown_until:
                    if body_height > 0:
                        self.standing_height_history.append((now, body_height, torso_height))
                        # Keep 3 seconds of history
                        self.standing_height_history = [
                            (t, bh, th) for t, bh, th in self.standing_height_history
                            if now - t < 3.0
                        ]

                    # -- Signal 1: Lying posture after being upright --
                    if posture == "Lying Down":
                        self.fall_frame_count += 1
                        was_tall = any(
                            bh > torso_height * 1.5
                            for t, bh, th in self.standing_height_history
                            if now - t < 2.0 and now - t > 0.1
                        )
                        # 5 frames in lying posture, or 2 if recently standing
                        if self.fall_frame_count >= 5 or (was_tall and self.fall_frame_count >= 2):
                            if not self.fall_active:
                                self.fall_active = True
                                result["is_fall"] = True
                                self.fall_cooldown_until = now + 5.0
                                print("[FALL] FALL DETECTED via lying posture!")
                    else:
                        self.fall_frame_count = max(self.fall_frame_count - 1, 0)
                        if self.fall_frame_count <= 0:
                            self.fall_active = False

                    # -- Signal 2: Rapid nose drop (head falls fast) --
                    if "nose" in kp and not self.fall_active:
                        nose_y = kp["nose"][1]
                        if self.prev_nose_y is not None and self.prev_nose_time is not None:
                            dt = now - self.prev_nose_time
                            if 0.05 < dt < 1.5:
                                drop = (nose_y - self.prev_nose_y) / frame_h
                                # Head dropped > 30% of frame height rapidly
                                if drop > 0.30:
                                    if not self.fall_active:
                                        self.fall_active = True
                                        result["is_fall"] = True
                                        self.fall_cooldown_until = now + 5.0
                                        print("[FALL] FALL DETECTED via rapid nose drop!")
                        self.prev_nose_y = nose_y
                        self.prev_nose_time = now

                    # -- Signal 3: Body height collapsed > 40% in < 2s --
                    if len(self.standing_height_history) >= 2 and not self.fall_active:
                        oldest_t, oldest_bh, _ = self.standing_height_history[0]
                        newest_t, newest_bh, _ = self.standing_height_history[-1]
                        dt = newest_t - oldest_t
                        if 0.2 < dt < 2.0 and oldest_bh > 50:
                            height_drop = (oldest_bh - newest_bh) / oldest_bh
                            if height_drop > 0.40:
                                self.fall_active = True
                                result["is_fall"] = True
                                self.fall_cooldown_until = now + 5.0
                                print("[FALL] FALL DETECTED via body height collapse!")
                else:
                    self.fall_active = False
                    self.fall_frame_count = 0

        result["posture"] = posture

        # ── Activity classification ───────────────────────────────────────────
        activity = "Idle"
        mag = result["motion_magnitude"]
        if mag > 15:
            activity = "Walking"
        elif mag > 5:
            activity = "Moving"
        elif mag > 2:
            activity = "Slight Movement"

        # Detect waving (wrist above shoulder)
        for side in ["left", "right"]:
            if f"{side}_wrist" in kp and f"{side}_shoulder" in kp:
                wrist_y = kp[f"{side}_wrist"][1]
                shoulder_y = kp[f"{side}_shoulder"][1]
                if wrist_y < shoulder_y - 40:   # wrist is above shoulder
                    if mag > 3:
                        activity = "Waving"
                    else:
                        activity = "Hand Raised"

        # Detect bending (nose close to hip level)
        if "nose" in kp and "left_hip" in kp and "right_hip" in kp:
            nose_y = kp["nose"][1]
            hip_y = (kp["left_hip"][1] + kp["right_hip"][1]) / 2.0
            if nose_y > hip_y - 30 and posture != "Sitting" and posture != "Lying Down":
                activity = "Bending"

        result["activity"] = activity
        result["is_fall"] = result["is_fall"] or self.fall_active
        return result


# ─── Background Initialization ────────────────────────────────────────────────
def init_all():
    load_emotion_model()
    sync_from_supabase()   # fetches DB + extracts SFace embeddings

threading.Thread(target=init_all, daemon=True).start()

# ─── Supabase Storage Helpers ──────────────────────────────────────────────────
def upload_to_supabase_storage(local_path: str, storage_path: str):
    """Upload a local file to Supabase Storage. Returns public URL or None."""
    if not supabase_client:
        return None
    try:
        with open(local_path, "rb") as f:
            data = f.read()
        supabase_client.storage.from_(SUPABASE_BUCKET).upload(
            storage_path, data,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        public_url = supabase_client.storage.from_(SUPABASE_BUCKET).get_public_url(storage_path)
        return public_url
    except Exception as e:
        print(f"[Supabase Storage] Upload failed: {e}")
        return None

def delete_from_supabase_storage(storage_path: str):
    if not supabase_client:
        return
    try:
        supabase_client.storage.from_(SUPABASE_BUCKET).remove([storage_path])
    except Exception as e:
        print(f"[Supabase Storage] Delete failed: {e}")

# ─── Frame Generator (MediaPipe Pose + Simultaneous Emotion) ──────────────────
EMOTION_COLORS = {
    "Happy":    (0, 255, 255),  "Sad":      (255, 80, 80),
    "Angry":    (0, 0, 255),    "Fear":     (200, 0, 200),
    "Surprise": (0, 165, 255),  "Disgust":  (0, 128, 128),
    "Neutral":  (0, 255, 0),    "N/A":      (180, 180, 180),
}

# Skeleton drawing spec – vibrant cyan lines with thicker strokes
LANDMARK_STYLE = mp_drawing.DrawingSpec(color=(0, 255, 255), thickness=2, circle_radius=3)
CONNECTION_STYLE = mp_drawing.DrawingSpec(color=(0, 200, 200), thickness=2)

TARGET_FPS           = 24
FACE_DETECT_INTERVAL = 3     # run HaarCascade every Nth frame
EMIT_INTERVAL        = 0.5   # seconds between socket.io emissions
EMOTION_INTERVAL     = 0.3   # emotion detection frequency (seconds) — near-simultaneous

def generate_frames():
    my_gen = camera_generation   # snapshot — if this changes, we must exit
    last_emotion_time = 0.0
    last_emit_time    = 0.0
    last_recog_time   = 0.0
    frame_count       = 0
    cached_faces      = []

    # Per-generator MediaPipe Pose instance (not threadsafe across generators)
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    motion_detector = LandmarkMotionDetector()

    while camera_active and camera_generation == my_gen:
        t_start = time.time()

        with camera_lock:
            if camera is None or not camera.isOpened():
                break
            success, frame = camera.read()
        if not success or camera_generation != my_gen:
            time.sleep(0.02); continue

        display = frame.copy()
        h_frame, w_frame = display.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # ══════════════════════════════════════════════════════════════════════
        # 1. MediaPipe Pose – landmark-based motion & fall detection
        # ══════════════════════════════════════════════════════════════════════
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pose_results = pose.process(rgb_frame)

        pose_analysis = motion_detector.analyse(
            pose_results.pose_landmarks, w_frame, h_frame
        )

        # Draw custom skeleton with highlighted fingertips and motion points
        if pose_results.pose_landmarks:
            lms = pose_results.pose_landmarks.landmark
            PL = mp_pose.PoseLandmark

            # First draw all connections as thin lines
            mp_drawing.draw_landmarks(
                display,
                pose_results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing.DrawingSpec(color=(40, 40, 40), thickness=1, circle_radius=0),
                connection_drawing_spec=mp_drawing.DrawingSpec(color=(0, 200, 200), thickness=2),
            )

            # -- Color map by body region --
            # Fingertips (red, large)  |  Wrists/Ankles (yellow)
            # Elbows/Knees (green)     |  Shoulders/Hips (cyan)
            # Face/Nose (white)        |  Feet (orange)
            landmark_styles = {
                # Fingertips & thumbs -- RED, big circles
                PL.LEFT_INDEX:   {"color": (0, 0, 255),   "radius": 7, "label": ""},
                PL.RIGHT_INDEX:  {"color": (0, 0, 255),   "radius": 7, "label": ""},
                PL.LEFT_PINKY:   {"color": (200, 0, 255), "radius": 6, "label": ""},
                PL.RIGHT_PINKY:  {"color": (200, 0, 255), "radius": 6, "label": ""},
                PL.LEFT_THUMB:   {"color": (0, 100, 255), "radius": 6, "label": ""},
                PL.RIGHT_THUMB:  {"color": (0, 100, 255), "radius": 6, "label": ""},
                # Wrists -- YELLOW
                PL.LEFT_WRIST:   {"color": (0, 255, 255), "radius": 6, "label": "W"},
                PL.RIGHT_WRIST:  {"color": (0, 255, 255), "radius": 6, "label": "W"},
                # Elbows -- GREEN
                PL.LEFT_ELBOW:   {"color": (0, 255, 0),   "radius": 5, "label": ""},
                PL.RIGHT_ELBOW:  {"color": (0, 255, 0),   "radius": 5, "label": ""},
                # Shoulders -- CYAN
                PL.LEFT_SHOULDER:  {"color": (255, 255, 0), "radius": 6, "label": "S"},
                PL.RIGHT_SHOULDER: {"color": (255, 255, 0), "radius": 6, "label": "S"},
                # Hips -- CYAN
                PL.LEFT_HIP:     {"color": (255, 200, 0), "radius": 6, "label": "H"},
                PL.RIGHT_HIP:    {"color": (255, 200, 0), "radius": 6, "label": "H"},
                # Knees -- GREEN
                PL.LEFT_KNEE:    {"color": (0, 255, 100), "radius": 5, "label": "K"},
                PL.RIGHT_KNEE:   {"color": (0, 255, 100), "radius": 5, "label": "K"},
                # Ankles -- YELLOW
                PL.LEFT_ANKLE:   {"color": (0, 220, 255), "radius": 6, "label": "A"},
                PL.RIGHT_ANKLE:  {"color": (0, 220, 255), "radius": 6, "label": "A"},
                # Feet -- ORANGE
                PL.LEFT_HEEL:    {"color": (0, 140, 255), "radius": 4, "label": ""},
                PL.RIGHT_HEEL:   {"color": (0, 140, 255), "radius": 4, "label": ""},
                PL.LEFT_FOOT_INDEX:  {"color": (0, 165, 255), "radius": 5, "label": ""},
                PL.RIGHT_FOOT_INDEX: {"color": (0, 165, 255), "radius": 5, "label": ""},
                # Nose -- WHITE
                PL.NOSE:         {"color": (255, 255, 255), "radius": 5, "label": ""},
            }

            # Draw each landmark with its custom style
            for lm_id, style in landmark_styles.items():
                lm = lms[lm_id]
                if lm.visibility > 0.4:
                    px = int(lm.x * w_frame)
                    py = int(lm.y * h_frame)
                    # Filled circle
                    cv2.circle(display, (px, py), style["radius"], style["color"], -1)
                    # Thin border for contrast
                    cv2.circle(display, (px, py), style["radius"], (0, 0, 0), 1)
                    # Optional label
                    if style["label"]:
                        cv2.putText(display, style["label"], (px + style["radius"] + 2, py + 4),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)

        is_motion = pose_analysis["motion"]
        is_fall   = pose_analysis["is_fall"]
        motion_status = "Motion Detected" if is_motion else "No Motion"
        fall_status = "FALL DETECTED!" if is_fall else "No Fall"
        if not is_fall and motion_detector.fall_frame_count > 3:
            fall_status = "Possible Fall"

        # ══════════════════════════════════════════════════════════════════════
        # 2. Face detection (YuNet DNN, every Nth frame for speed)
        # ══════════════════════════════════════════════════════════════════════
        frame_count += 1
        if frame_count % FACE_DETECT_INTERVAL == 0 and yunet is not None:
            yunet.setInputSize((w_frame, h_frame))
            _, _cached_faces = yunet.detect(frame)
            if _cached_faces is not None:
                cached_faces = _cached_faces
            else:
                cached_faces = []

        faces       = cached_faces
        faces_count = len(faces)

        now = time.time()
        with state_lock:
            current_emotion  = detection_state["emotion"]
            current_emo_conf = detection_state["emotion_confidence"]
            current_name     = detection_state["face_name"]

        # ══════════════════════════════════════════════════════════════════════
        # 3. SIMULTANEOUS Emotion Detection (every EMOTION_INTERVAL seconds)
        # ══════════════════════════════════════════════════════════════════════
        if faces_count > 0 and (now - last_emotion_time) > EMOTION_INTERVAL:
            face_data = faces[0]
            fx, fy, fw, fh = map(lambda x: max(0, int(x)), face_data[:4])
            emo, emo_conf  = detect_emotion_dnn(frame[fy:fy+fh, fx:fx+fw])
            current_emotion, current_emo_conf = emo, emo_conf
            with state_lock:
                detection_state["emotion"]            = emo
                detection_state["emotion_confidence"] = emo_conf
            last_emotion_time = now

        # Face recognition (throttled — every 2s, heavier compute)
        if faces_count > 0 and (now - last_recog_time) > 2.0:
            face_data = faces[0]
            name, _ = recognize_face(frame, face_data)
            with state_lock:
                detection_state["face_name"] = name
            current_name = name
            last_recog_time = now

        if faces_count == 0:
            with state_lock:
                detection_state["emotion"]   = "N/A"
                detection_state["face_name"] = "No Face"
            current_emotion, current_name = "N/A", "No Face"

        # ── Draw face boxes ──
        box_color = EMOTION_COLORS.get(current_emotion, (0, 255, 0))
        for face_data in faces:
            fx, fy, fw, fh = map(int, face_data[:4])
            cv2.rectangle(display, (fx, fy), (fx+fw, fy+fh), box_color, 2)
            label_y = max(fy - 10, 20)
            name_text = current_name
            (tw, th), _ = cv2.getTextSize(name_text, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.rectangle(display, (fx, label_y-th-6), (fx+tw+8, label_y+4), (0,0,0), -1)
            cv2.putText(display, name_text, (fx+4, label_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, box_color, 2)
            emo_text = f"{current_emotion} {int(current_emo_conf*100)}%"
            cv2.rectangle(display, (fx, fy+fh), (fx+fw, fy+fh+28), (0,0,0), -1)
            cv2.putText(display, emo_text, (fx+4, fy+fh+20),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,255,255), 1)

        # ── Update shared state ──
        with state_lock:
            detection_state["motion"]         = motion_status
            detection_state["fall"]           = fall_status
            detection_state["faces_count"]    = faces_count
            detection_state["pose_status"]    = pose_analysis["posture"]
            detection_state["activity"]       = pose_analysis["activity"]
            detection_state["landmark_count"] = pose_analysis["landmark_count"]

        # ── HUD overlay ──
        overlay = display.copy()
        cv2.rectangle(overlay, (0, 0), (380, 160), (20,20,20), -1)
        cv2.addWeighted(overlay, 0.55, display, 0.45, 0, display)

        m_color = (0,210,255) if is_motion else (100,255,100)
        cv2.putText(display, f"Motion  : {motion_status}", (10,24),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, m_color, 2)
        f_color = (0,0,255) if "FALL" in fall_status else (100,255,100)
        cv2.putText(display, f"Fall    : {fall_status}", (10,50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, f_color, 2)
        cv2.putText(display, f"Posture : {pose_analysis['posture']}", (10,76),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,200,0), 2)
        cv2.putText(display, f"Activity: {pose_analysis['activity']}", (10,102),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200,180,255), 2)
        cv2.putText(display, f"Faces   : {faces_count}", (10,128),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255,220,0), 2)
        cv2.putText(display, f"Landmarks: {pose_analysis['landmark_count']}/33", (10,154),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0,255,200), 2)

        if "FALL" in fall_status:
            banner = "!! FALL DETECTED - CHECK IMMEDIATELY !!"
            (bw, bh), _ = cv2.getTextSize(banner, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            bx = max((w_frame-bw)//2, 0)
            cv2.rectangle(display, (bx-10, 8), (bx+bw+10, bh+24), (0,0,200), -1)
            cv2.putText(display, banner, (bx, bh+16), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)

        # ── Throttle socket.io emissions ──
        if (now - last_emit_time) > EMIT_INTERVAL:
            socketio.emit("detection_update", {**detection_state})
            last_emit_time = now

        # ── Encode + yield the frame ──
        ret, buf = cv2.imencode(".jpg", display, [cv2.IMWRITE_JPEG_QUALITY, 65])
        if ret:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")

        # ── FPS cap — prevent spinning at 100% CPU ──
        elapsed = time.time() - t_start
        sleep_time = max(0, (1.0 / TARGET_FPS) - elapsed)
        if sleep_time > 0:
            time.sleep(sleep_time)

    # Cleanup MediaPipe resources when generator exits
    pose.close()


# ─── API Routes ────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return "Human Activity Monitoring Backend is Running!"

@app.route("/video_feed")
@cross_origin()
def video_feed():
    if not camera_active:
        open_camera()
    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/camera_start", methods=["POST", "OPTIONS"])
@cross_origin()
def camera_start():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    # Full restart: close old → open new
    close_camera()
    ok = open_camera()
    return jsonify({"active": ok, "error": None if ok else "Camera failed to open"}), 200

@app.route("/camera_stop", methods=["POST", "OPTIONS"])
@cross_origin()
def camera_stop():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    close_camera()
    return jsonify({"active": False}), 200

@app.route("/detection_status")
def detection_status():
    with state_lock:
        return jsonify(dict(detection_state))


@app.route("/register_face_upload", methods=["POST"])
def register_face_upload():
    """Upload a face photo + metadata → Supabase Storage + DB → retrain SFace embeddings."""
    name         = request.form.get("name", "").strip()
    relationship = request.form.get("relationship", "").strip()
    notes        = request.form.get("notes", "").strip()

    if not name:
        return jsonify({"error": "Name is required"}), 400
    if "photo" not in request.files or request.files["photo"].filename == "":
        return jsonify({"error": "Photo file is required"}), 400

    file       = request.files["photo"]
    file_bytes = np.frombuffer(file.read(), np.uint8)
    img        = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
    if img is None:
        return jsonify({"error": "Could not decode image — upload a valid JPG/PNG."}), 400

    # ── Save locally ──────────────────────────────────────────────────────────
    person_dir = os.path.join(KNOWN_FACES_DIR, name)
    os.makedirs(person_dir, exist_ok=True)
    local_path    = os.path.join(person_dir, "photo.jpg")
    storage_path  = f"{name}/photo.jpg"
    cv2.imwrite(local_path, img)

    # ── Upload to Supabase Storage ────────────────────────────────────────────
    photo_url = upload_to_supabase_storage(local_path, storage_path) or ""

    # ── Upsert metadata into Supabase DB ─────────────────────────────────────
    if supabase_client:
        try:
            supabase_client.table("known_persons").upsert({
                "name":         name,
                "relationship": relationship,
                "notes":        notes,
                "photo_url":    photo_url,
                "photo_path":   storage_path,
            }, on_conflict="name").execute()
            print(f"[Supabase DB] Upserted row for '{name}'")
        except Exception as e:
            print(f"[Supabase DB] Write failed: {e}")

    # ── Retrain SFace embeddings (synchronous so we can verify the result) ────
    # train_faces() is called on the request thread — it is fast enough (single
    # photo) and must complete before we can check whether YuNet detected a face.
    train_faces()

    # ── Verify that the photo produced a usable SFace embedding ───────────────
    with face_lock:
        embedding_ok = name in known_face_embeddings

    if embedding_ok:
        return jsonify({
            "message":          f"'{name}' registered and face recognised successfully.",
            "name":             name,
            "photo_url":        photo_url,
            "training_warning": None,
        }), 200
    else:
        # Person is saved to DB/Storage but YuNet couldn't detect a face in the
        # uploaded photo (bad angle, too dark, face too small, etc.).
        warning_msg = (
            f"'{name}' was saved, but no face could be detected in the uploaded "
            "photo. Recognition will NOT work for this person until a clearer "
            "photo is provided (good lighting, face centred, not too far away)."
        )
        print(f"[SFace] WARNING: {warning_msg}")
        return jsonify({
            "message":          f"'{name}' saved, but face training failed — see training_warning.",
            "name":             name,
            "photo_url":        photo_url,
            "training_warning": warning_msg,
        }), 200


@app.route("/register_face", methods=["POST"])
def register_face():
    """Capture current camera frame and register via Supabase."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400
    with camera_lock:
        if camera is None or not camera.isOpened():
            return jsonify({"error": "Camera not available — start it first"}), 500
        ok, frame = camera.read()
    if not ok:
        return jsonify({"error": "Camera read failed"}), 500

    person_dir   = os.path.join(KNOWN_FACES_DIR, name)
    os.makedirs(person_dir, exist_ok=True)
    local_path   = os.path.join(person_dir, "photo.jpg")
    storage_path = f"{name}/photo.jpg"
    cv2.imwrite(local_path, frame)

    photo_url = upload_to_supabase_storage(local_path, storage_path) or ""

    if supabase_client:
        try:
            supabase_client.table("known_persons").upsert({
                "name": name, "photo_url": photo_url, "photo_path": storage_path
            }, on_conflict="name").execute()
        except Exception as e:
            print(f"[Supabase DB] Write failed: {e}")

    threading.Thread(target=train_faces, daemon=True).start()
    return jsonify({"message": f"'{name}' registered.", "name": name}), 200


@app.route("/known_faces", methods=["GET"])
def get_known_faces():
    """Return list of known persons from Supabase DB (or local disk as fallback)."""
    if supabase_client:
        try:
            res  = supabase_client.table("known_persons").select("name,relationship,notes,photo_url,created_at").order("name").execute()
            return jsonify({"people": res.data or []}), 200
        except Exception as e:
            print(f"[Supabase DB] Read failed: {e}")

    # Local fallback
    people = [d for d in os.listdir(KNOWN_FACES_DIR) if os.path.isdir(os.path.join(KNOWN_FACES_DIR, d))]
    return jsonify({"people": [{"name": p} for p in sorted(people)]}), 200


@app.route("/delete_face/<name>", methods=["DELETE"])
def delete_face(name):
    """Remove person from Supabase DB + Storage + local disk, then retrain SFace embeddings."""
    if supabase_client:
        try:
            row = supabase_client.table("known_persons").select("photo_path").eq("name", name).maybe_single().execute()
            storage_path = (row.data or {}).get("photo_path", f"{name}/photo.jpg")
            delete_from_supabase_storage(storage_path)
            supabase_client.table("known_persons").delete().eq("name", name).execute()
            print(f"[Supabase DB] Deleted '{name}'")
        except Exception as e:
            print(f"[Supabase DB] Delete failed: {e}")

    local_dir = os.path.join(KNOWN_FACES_DIR, name)
    if os.path.exists(local_dir):
        shutil.rmtree(local_dir)

    threading.Thread(target=train_faces, daemon=True).start()
    return jsonify({"message": f"'{name}' removed."}), 200


# ─── WebSocket Events ──────────────────────────────────────────────────────────
@socketio.on("connect")
def on_connect():
    print("[WS] Client connected")

@socketio.on("disconnect")
def on_disconnect():
    print("[WS] Client disconnected")

# ─── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)