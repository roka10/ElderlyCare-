"""
Elderly Care Monitoring Backend
================================
Persistence layer  : Supabase (PostgreSQL + Storage)
Detection pipeline : Pure OpenCV (LBPH face recognition + ONNX FER emotion)

Flow:
  ADD VISITOR  → Upload photo to Supabase Storage
               → Insert row in `known_persons` table
               → Retrain LBPH in background
  SERVER START → Fetch all known persons from Supabase
               → Download photos locally
               → Train LBPH (faces ready before first camera frame)
  LIVE FEED    → LBPH model already in memory → instant recognition
"""

from flask import Flask, jsonify, Response, request
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_cors import CORS
from models import db
from config import Config
from routes.auth import auth_bp
from routes.main import main_bp

import os, cv2, threading, time, shutil, urllib.request
import numpy as np

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
}
state_lock  = threading.Lock()
latest_frame = None
frame_lock  = threading.Lock()

# ─── Camera (lazy — only opened when user clicks Start Camera) ────────────────
camera = None
camera_active = False
camera_lock = threading.Lock()

def open_camera():
    global camera, camera_active
    with camera_lock:
        if camera is not None and camera.isOpened():
            camera_active = True
            return True
        camera = cv2.VideoCapture(0)
        if camera.isOpened():
            camera_active = True
            print("[Camera] Opened")
            return True
        camera = None
        camera_active = False
        print("[Camera] Failed to open")
        return False

def close_camera():
    global camera, camera_active
    with camera_lock:
        camera_active = False
        if camera is not None:
            camera.release()
            camera = None
            print("[Camera] Released")

# ─── Haar Cascade ─────────────────────────────────────────────────────────────
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

# ─── LBPH Face Recogniser ─────────────────────────────────────────────────────
lbph         = cv2.face.LBPHFaceRecognizer_create()
label_map    = {}        # int → name
lbph_trained = False
lbph_lock    = threading.Lock()

def train_lbph():
    """Scan known_faces/<Name>/*.jpg and train LBPH."""
    global lbph_trained, label_map
    faces_pixels, labels, label_map_new = [], [], {}
    label_id = 0
    for person_name in sorted(os.listdir(KNOWN_FACES_DIR)):
        person_dir = os.path.join(KNOWN_FACES_DIR, person_name)
        if not os.path.isdir(person_dir):
            continue
        valid_faces = 0
        for fname in os.listdir(person_dir):
            if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            img = cv2.imread(os.path.join(person_dir, fname))
            if img is None:
                continue
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Sub-scale massive uploaded photos so HaarCascade doesn't fail
            h, w = gray.shape
            if h > 1000 or w > 1000:
                scale = 1000.0 / max(h, w)
                gray = cv2.resize(gray, (0, 0), fx=scale, fy=scale)
                
            found = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
            if len(found) == 0:
                # Fallback: force a center square crop if face detection misses
                ch, cw = gray.shape
                sz = min(ch, cw)
                try:
                    roi = gray[ch//2 - sz//2:ch//2 + sz//2, cw//2 - sz//2:cw//2 + sz//2]
                    roi = cv2.resize(roi, (100, 100))
                except:
                    roi = cv2.resize(gray, (100, 100))
            else:
                x, y, fw, fh = found[0]
                roi = cv2.resize(gray[y:y+fh, x:x+fw], (100, 100))
                
            faces_pixels.append(roi)
            labels.append(label_id)
            valid_faces += 1
            
        if valid_faces > 0:
            label_map_new[label_id] = person_name
            label_id += 1

    with lbph_lock:
        if len(faces_pixels) >= 1:
            lbph.train(faces_pixels, np.array(labels))
            label_map    = label_map_new
            lbph_trained = True
            print(f"[LBPH] Trained on {len(faces_pixels)} images — {list(label_map.values())}")
        else:
            lbph_trained = False
            print("[LBPH] No training images found.")

def recognize_face(face_gray_roi):
    with lbph_lock:
        if not lbph_trained:
            return "Unknown", 0.0
        roi = cv2.resize(face_gray_roi, (100, 100))
        label, confidence = lbph.predict(roi)
        
        # LBPH confidence: lower is better distance. <130 is reasonable for varying lighting
        if confidence < 130:
            conf_score = round(max(0, (130 - confidence) / 130.0), 2)
            return label_map.get(label, "Unknown"), conf_score
        return "Unknown", 0.0

# ─── Supabase Sync ────────────────────────────────────────────────────────────
def sync_from_supabase():
    """
    On server startup: fetch all known persons from Supabase,
    download their photos locally, then train LBPH.
    """
    if not supabase_client:
        print("[Supabase Sync] Skipped — no Supabase client.")
        train_lbph()
        return
    try:
        res  = supabase_client.table("known_persons").select("*").execute()
        rows = res.data or []
        print(f"[Supabase Sync] Found {len(rows)} known persons in DB.")
        for row in rows:
            name      = row.get("name", "").strip()
            photo_url = row.get("photo_url", "")
            if not name or not photo_url:
                continue
            person_dir = os.path.join(KNOWN_FACES_DIR, name)
            os.makedirs(person_dir, exist_ok=True)
            img_path   = os.path.join(person_dir, "photo.jpg")
            if not os.path.exists(img_path):
                try:
                    urllib.request.urlretrieve(photo_url, img_path)
                    print(f"[Supabase Sync] Downloaded photo for '{name}'")
                except Exception as dl_err:
                    print(f"[Supabase Sync] Failed to download photo for '{name}': {dl_err}")
        train_lbph()
    except Exception as e:
        print(f"[Supabase Sync] Error: {e}")
        train_lbph()  # still train on whatever is local

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

# ─── Motion Detection ──────────────────────────────────────────────────────────
prev_gray = None
def detect_motion(frame):
    global prev_gray
    gray = cv2.GaussianBlur(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY), (21,21), 0)
    if prev_gray is None:
        prev_gray = gray; return False
    diff      = cv2.absdiff(prev_gray, gray)
    _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
    thresh    = cv2.dilate(thresh, None, iterations=2)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    prev_gray = gray
    return any(cv2.contourArea(c) > 600 for c in contours)

# ─── Fall Detection ────────────────────────────────────────────────────────────
fall_frame_count = 0
fall_active      = False
def detect_fall(face_bbox):
    global fall_frame_count, fall_active
    if face_bbox is None:
        fall_frame_count = 0; fall_active = False; return False
    x, y, w, h = face_bbox
    ratio = w / float(h) if h > 0 else 0
    if ratio > 1.8:
        fall_frame_count += 1
        if fall_frame_count >= 15: fall_active = True
    else:
        fall_frame_count = 0; fall_active = False
    return fall_active

# ─── Background Initialization ────────────────────────────────────────────────
def init_all():
    load_emotion_model()
    sync_from_supabase()   # fetches DB + trains LBPH

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

# ─── Frame Generator ───────────────────────────────────────────────────────────
EMOTION_COLORS = {
    "Happy":    (0, 255, 255),  "Sad":      (255, 80, 80),
    "Angry":    (0, 0, 255),    "Fear":     (200, 0, 200),
    "Surprise": (0, 165, 255),  "Disgust":  (0, 128, 128),
    "Neutral":  (0, 255, 0),    "N/A":      (180, 180, 180),
}

def generate_frames():
    last_emotion_time = 0.0
    while camera_active:
        with camera_lock:
            if camera is None or not camera.isOpened():
                break
            success, frame = camera.read()
        if not success:
            time.sleep(0.05); continue

        display = frame.copy()
        h_frame, w_frame = display.shape[:2]
        gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(60, 60))
        faces_count       = len(faces)
        face_bbox_for_fall = tuple(faces[0]) if faces_count > 0 else None

        now = time.time()
        with state_lock:
            current_emotion  = detection_state["emotion"]
            current_emo_conf = detection_state["emotion_confidence"]
            current_name     = detection_state["face_name"]

        if faces_count > 0 and (now - last_emotion_time) > 2.0:
            fx, fy, fw, fh = faces[0]
            emo, emo_conf  = detect_emotion_dnn(frame[fy:fy+fh, fx:fx+fw])
            name, _        = recognize_face(gray[fy:fy+fh, fx:fx+fw])
            with state_lock:
                detection_state["emotion"]            = emo
                detection_state["emotion_confidence"] = emo_conf
                detection_state["face_name"]          = name
            current_emotion, current_emo_conf, current_name = emo, emo_conf, name
            last_emotion_time = now
        elif faces_count == 0:
            with state_lock:
                detection_state["emotion"]   = "N/A"
                detection_state["face_name"] = "No Face"
            current_emotion, current_name = "N/A", "No Face"

        box_color = EMOTION_COLORS.get(current_emotion, (0, 255, 0))
        for (fx, fy, fw, fh) in faces:
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

        is_motion   = detect_motion(frame)
        is_fall     = detect_fall(face_bbox_for_fall)
        motion_status = "Motion Detected" if is_motion else "No Motion"
        fall_status   = ("FALL DETECTED!" if fall_active
                         else ("Possible Fall" if fall_frame_count > 5 else "No Fall"))

        with state_lock:
            detection_state["motion"]      = motion_status
            detection_state["fall"]        = fall_status
            detection_state["faces_count"] = faces_count

        # HUD overlay
        overlay = display.copy()
        cv2.rectangle(overlay, (0, 0), (360, 100), (20,20,20), -1)
        cv2.addWeighted(overlay, 0.5, display, 0.5, 0, display)
        m_color = (0,210,255) if is_motion else (100,255,100)
        cv2.putText(display, f"Motion : {motion_status}", (10,28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, m_color, 2)
        f_color = (0,0,255) if "FALL" in fall_status else (100,255,100)
        cv2.putText(display, f"Fall   : {fall_status}",   (10,58), cv2.FONT_HERSHEY_SIMPLEX, 0.65, f_color, 2)
        cv2.putText(display, f"Faces  : {faces_count}",   (10,88), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255,220,0), 2)

        if "FALL" in fall_status:
            banner = "!! FALL DETECTED - CHECK IMMEDIATELY !!"
            (bw, bh), _ = cv2.getTextSize(banner, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
            bx = max((w_frame-bw)//2, 0)
            cv2.rectangle(display, (bx-10, 8), (bx+bw+10, bh+24), (0,0,200), -1)
            cv2.putText(display, banner, (bx, bh+16), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,255), 2)

        socketio.emit("detection_update", {**detection_state})

        ret, buf = cv2.imencode(".jpg", display, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ret:
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")


# ─── API Routes ────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return "Human Activity Monitoring Backend is Running!"

@app.route("/video_feed")
def video_feed():
    open_camera()
    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/camera_start", methods=["POST"])
def camera_start():
    ok = open_camera()
    return jsonify({"active": ok}), (200 if ok else 500)

@app.route("/camera_stop", methods=["POST"])
def camera_stop():
    close_camera()
    return jsonify({"active": False}), 200

@app.route("/detection_status")
def detection_status():
    with state_lock:
        return jsonify(dict(detection_state))


@app.route("/register_face_upload", methods=["POST"])
def register_face_upload():
    """Upload a face photo + metadata → Supabase Storage + DB → retrain LBPH."""
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

    # ── Retrain LBPH ─────────────────────────────────────────────────────────
    threading.Thread(target=train_lbph, daemon=True).start()

    return jsonify({
        "message":   f"'{name}' registered. Recognition active in ~3 seconds.",
        "name":      name,
        "photo_url": photo_url,
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

    threading.Thread(target=train_lbph, daemon=True).start()
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
    """Remove person from Supabase DB + Storage + local disk, retrain LBPH."""
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

    threading.Thread(target=train_lbph, daemon=True).start()
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