import cv2
import numpy as np
import os
import pickle
import time
import warnings
import sys
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Fix encoding issues on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

warnings.filterwarnings('ignore')

# Import DeepFace after fixing encoding
from deepface import DeepFace

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
    print("Face recognition library found and imported successfully!")
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Face recognition library not found. Install with: pip install face_recognition")
    print("Continuing without face identification capabilities...")

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    role = db.Column(db.String(20), default='user') # 'admin', 'user'

    def __repr__(self):
        return f"User('{self.username}', '{self.role}')"

class DetectionEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    event_type = db.Column(db.String(50), nullable=False) # e.g., 'fall', 'motion', 'emotion_happy', 'unknown_face'
    face_name = db.Column(db.String(100), nullable=True)
    emotion = db.Column(db.String(50), nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    frame_path = db.Column(db.String(255), nullable=True) # Path to saved frame image

    def __repr__(self):
        return f"DetectionEvent('{self.event_type}', '{self.timestamp}', '{self.face_name}')"

# Configuration and initialization
MODELS_DIR = os.path.join(os.getcwd(), 'models')
FACES_DIR = os.path.join(os.getcwd(), 'known_faces')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(FACES_DIR, exist_ok=True)

# Load known faces database
def load_known_faces():
    faces_db_path = os.path.join(MODELS_DIR, 'known_faces.pkl')
    if os.path.exists(faces_db_path):
        try:
            with open(faces_db_path, 'rb') as f:
                data = pickle.load(f)
                return data['encodings'], data['names']
        except Exception as e:
            print(f"Error loading known faces: {e}")
    return [], []

# Save known faces database
def save_known_faces(encodings, names):
    faces_db_path = os.path.join(MODELS_DIR, 'known_faces.pkl')
    try:
        with open(faces_db_path, 'wb') as f:
            data = {'encodings': encodings, 'names': names}
            pickle.dump(data, f)
        print(f"Saved {len(names)} known faces")
    except Exception as e:
        print(f"Error saving known faces: {e}")

# Recognize face function
def recognize_face(frame, face_location, known_encodings, known_names):
    if not FACE_RECOGNITION_AVAILABLE or len(known_encodings) == 0:
        return "Unknown"
    
    try:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        top, right, bottom, left = face_location
        face_encoding = face_recognition.face_encodings(rgb_frame, [(top, right, bottom, left)])[0]
        
        matches = face_recognition.compare_faces(known_encodings, face_encoding, tolerance=0.6)
        face_distances = face_recognition.face_distance(known_encodings, face_encoding)
        
        if len(matches) > 0 and True in matches:
            best_match_index = np.argmin(face_distances)
            if matches[best_match_index]:
                return known_names[best_match_index]
        return "Unknown"
    except Exception as e:
        print(f"Error in face recognition: {e}")
        return "Error"

# Fall detection function
def detect_fall(face_bbox, fall_state, fall_threshold_ratio=1.8, fall_frames_threshold=15):
    """Detect falls based on face bounding box aspect ratio"""
    if face_bbox is None:
        fall_state['active'] = False
        fall_state['count'] = 0
        return False, fall_state
    
    x, y, w, h = face_bbox
    aspect_ratio = w / float(h) if h > 0 else 0
    
    # Check for horizontal orientation (potential fall)
    if aspect_ratio > fall_threshold_ratio:
        fall_state['count'] += 1
        if fall_state['count'] >= fall_frames_threshold:
            if not fall_state['active']:
                fall_state['active'] = True
                print("[ALERT] FALL DETECTED!")
                return True, fall_state
    else:
        fall_state['count'] = 0
        fall_state['active'] = False
    
    return fall_state['active'], fall_state

# Get color based on emotion
def get_emotion_color(emotion):
    emotion_colors = {
        'happy': (0, 255, 255),      # Yellow
        'sad': (255, 0, 0),           # Blue
        'angry': (0, 0, 255),         # Red
        'fear': (255, 0, 255),        # Magenta
        'surprise': (0, 165, 255),    # Orange
        'disgust': (0, 128, 128),     # Olive
        'neutral': (0, 255, 0)        # Green
    }
    return emotion_colors.get(emotion.lower(), (200, 200, 200))

# Pre-load DeepFace models to avoid first-time download issues
print("\n[INIT] Loading emotion detection models...")
try:
    # Create a dummy image to initialize DeepFace models
    dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
    dummy_img[100:150, 100:150] = 255  # Add some white to make it valid
    DeepFace.analyze(dummy_img, actions=['emotion'], enforce_detection=False, silent=True)
    print("[SUCCESS] Emotion detection models loaded successfully!")
except Exception as e:
    print(f"[WARNING] Could not pre-load models: {str(e).replace(chr(0x1f517), '').replace(chr(0x26d3), '')[:150]}")
    print("[INFO] Models will be downloaded on first detection...")

# Initialize video capture (0 = default webcam, or pass video path)
cap = cv2.VideoCapture(0)

# Load Haar Cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Load known faces if face_recognition is available
known_face_encodings, known_face_names = load_known_faces()
if FACE_RECOGNITION_AVAILABLE and len(known_face_names) > 0:
    print(f"Loaded {len(known_face_names)} known faces: {', '.join(known_face_names)}")

# Read the first frame
ret, frame1 = cap.read()
frame1_gray = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
frame1_gray = cv2.GaussianBlur(frame1_gray, (21, 21), 0)

frame_count = 0
fall_state = {'active': False, 'count': 0}
motion_threshold = 500
last_emotion_time = time.time() - 10
emotion_cache = {}

print("\n[VIDEO] Starting Advanced Detection System")
print("=" * 50)
print("Controls:")
print("  - Press 'q' to quit")
if FACE_RECOGNITION_AVAILABLE:
    print("  - Press 'a' to add current face to database")
print("  - Press 's' to save screenshot")
print("=" * 50)

while cap.isOpened():
    ret, frame2 = cap.read()
    if not ret:
        break

    frame_count += 1
    display_frame = frame2.copy()
    frame2_gray = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    frame2_gray_blurred = cv2.GaussianBlur(frame2_gray, (21, 21), 0)

    # ===== MOTION DETECTION =====
    frame_diff = cv2.absdiff(frame1_gray, frame2_gray_blurred)
    _, thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
    thresh = cv2.dilate(thresh, None, iterations=2)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    motion_detected = False
    total_motion_area = 0
    
    for contour in contours:
        if cv2.contourArea(contour) < motion_threshold:
            continue
        total_motion_area += cv2.contourArea(contour)
        motion_detected = True
        (x, y, w, h) = cv2.boundingRect(contour)
        cv2.rectangle(display_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    motion_status = f"Motion: Area {total_motion_area:.0f}" if motion_detected else "No Motion"

    # ===== FACE DETECTION AND RECOGNITION =====
    face_locations = []
    face_bbox_for_fall = None
    
    if FACE_RECOGNITION_AVAILABLE:
        # Use face_recognition library for better accuracy
        rgb_frame = cv2.cvtColor(frame2, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)
        
        if face_locations:
            # Get largest face for fall detection
            largest_area = 0
            for loc in face_locations:
                top, right, bottom, left = loc
                area = (bottom - top) * (right - left)
                if area > largest_area:
                    largest_area = area
                    face_bbox_for_fall = (left, top, right - left, bottom - top)
    else:
        # Fallback to Haar Cascade
        faces = face_cascade.detectMultiScale(frame2_gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        if len(faces) > 0:
            x, y, w, h = faces[0]
            face_bbox_for_fall = (x, y, w, h)
        face_locations = [(y, x+w, y+h, x) for (x, y, w, h) in faces]

    # ===== FALL DETECTION =====
    is_fall, fall_state = detect_fall(face_bbox_for_fall, fall_state)
    fall_status = "[WARNING] FALL DETECTED!" if is_fall else ("Possible Fall" if fall_state['active'] else "No Fall")
    fall_color = (0, 0, 255) if is_fall else ((0, 165, 255) if fall_state['active'] else (0, 255, 0))

    # ===== EMOTION DETECTION AND FACE LABELING =====
    current_time = time.time()
    
    for idx, face_loc in enumerate(face_locations):
        if FACE_RECOGNITION_AVAILABLE:
            top, right, bottom, left = face_loc
        else:
            # Convert from Haar cascade format
            y, right, bottom, x = face_loc
            top, left = y, x
        
        face_roi = frame2[top:bottom, left:right]
        
        # Emotion detection (every 10 frames instead of time-based for more frequent updates)
        face_key = f"{idx}"  # Use index instead of position for better tracking
        should_detect_emotion = (face_key not in emotion_cache) or (frame_count % 10 == 0)
        
        if should_detect_emotion:
            try:
                if face_roi.size > 0 and face_roi.shape[0] > 30 and face_roi.shape[1] > 30:
                    # Resize face for better emotion detection
                    face_resized = cv2.resize(face_roi, (224, 224))
                    
                    # Use DeepFace with specific backend and suppress warnings
                    result = DeepFace.analyze(
                        face_resized, 
                        actions=['emotion'], 
                        enforce_detection=False,
                        silent=True
                    )
                    
                    if isinstance(result, list):
                        emotion = result[0]['dominant_emotion']
                        all_emotions = result[0]['emotion']
                    else:
                        emotion = result['dominant_emotion']
                        all_emotions = result['emotion']
                    
                    confidence = all_emotions[emotion]
                    
                    # Print for debugging
                    if frame_count % 30 == 0:
                        print(f"[EMOTION] Detected: {emotion} ({confidence:.1f}%)")
                    
                    emotion_cache[face_key] = {
                        'emotion': emotion, 
                        'confidence': confidence, 
                        'time': current_time,
                        'all_emotions': all_emotions
                    }
                else:
                    if face_key not in emotion_cache:
                        emotion_cache[face_key] = {'emotion': 'unknown', 'confidence': 0, 'time': current_time}
            except Exception as e:
                if frame_count % 30 == 0:
                    # Clean error message to avoid encoding issues
                    error_msg = str(e).encode('ascii', 'ignore').decode('ascii')[:100]
                    print(f"[ERROR] Emotion detection failed: {error_msg}")
                if face_key not in emotion_cache:
                    emotion_cache[face_key] = {'emotion': 'error', 'confidence': 0, 'time': current_time}
        
        emotion_info = emotion_cache.get(face_key, {'emotion': 'unknown', 'confidence': 0})
        emotion = emotion_info['emotion']
        confidence = emotion_info.get('confidence', 0)
        
        # Face recognition
        face_name = "Unknown"
        if FACE_RECOGNITION_AVAILABLE and len(known_face_encodings) > 0:
            face_name = recognize_face(frame2, (top, right, bottom, left), known_face_encodings, known_face_names)
        
        # Draw face rectangle with emotion-based color
        color = get_emotion_color(emotion)
        cv2.rectangle(display_frame, (left, top), (right, bottom), color, 2)
        
        # Name label (black background)
        name_bg_height = 40
        name_bg_start_y = max(0, top - name_bg_height)
        cv2.rectangle(display_frame, (left, name_bg_start_y), (right, top), (0, 0, 0), cv2.FILLED)
        
        # Draw name text
        font = cv2.FONT_HERSHEY_DUPLEX
        (text_width, text_height), _ = cv2.getTextSize(face_name, font, 0.8, 2)
        text_x = left + (right - left - text_width) // 2
        text_y = name_bg_start_y + (name_bg_height + text_height) // 2
        cv2.putText(display_frame, face_name, (text_x, text_y), font, 0.8, (255, 255, 255), 2)
        
        # Emotion label (black background)
        if confidence > 0:
            emotion_text = f"{emotion.title()}: {confidence:.1f}%"
        else:
            emotion_text = "Analyzing..."
        
        cv2.rectangle(display_frame, (left, bottom), (right, bottom + 30), (0, 0, 0), cv2.FILLED)
        (text_width, text_height), _ = cv2.getTextSize(emotion_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        text_x = left + (right - left - text_width) // 2
        cv2.putText(display_frame, emotion_text, (text_x, bottom + 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

    # ===== STATUS DISPLAY =====
    status_y = 30
    # Face count and recognition status
    face_status = f"Faces: {len(face_locations)} | Known: {len(known_face_names)}"
    if FACE_RECOGNITION_AVAILABLE:
        face_status += " | Face Recognition: ON"
        status_color = (0, 255, 0)
    else:
        face_status += " | Face Recognition: OFF"
        status_color = (0, 0, 255)
    cv2.putText(display_frame, face_status, (10, status_y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
    
    # Motion status
    cv2.putText(display_frame, motion_status, (10, status_y + 35), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
    
    # Fall detection status
    cv2.putText(display_frame, f"Fall: {fall_status}", (10, status_y + 70), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, fall_color, 2)
    
    # FPS counter (every 30 frames)
    if frame_count % 30 == 0:
        fps = 30 / (time.time() - last_emotion_time) if (time.time() - last_emotion_time) > 0 else 0
        print(f"[STATS] FPS: {fps:.1f} | Faces: {len(face_locations)} | {motion_status} | {fall_status}")
    
    # Instructions
    cv2.putText(display_frame, "Press 'q' to quit | 'a' to add face | 's' to save", 
               (10, display_frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    cv2.imshow("Advanced Detection System - Motion | Face | Emotion | Fall", display_frame)
    
    # Update reference frame
    frame1_gray = frame2_gray_blurred

    # ===== KEYBOARD CONTROLS =====
    key = cv2.waitKey(30) & 0xFF
    
    if key == ord('q'):
        print("\n[EXIT] Shutting down...")
        break
    elif key == ord('a') and FACE_RECOGNITION_AVAILABLE:
        if len(face_locations) > 0:
            # Add the largest face
            largest_area = 0
            largest_idx = 0
            for i, loc in enumerate(face_locations):
                top, right, bottom, left = loc
                area = (bottom - top) * (right - left)
                if area > largest_area:
                    largest_area = area
                    largest_idx = i
            
            top, right, bottom, left = face_locations[largest_idx]
            cv2.rectangle(display_frame, (left, top), (right, bottom), (0, 255, 255), 3)
            cv2.imshow("Advanced Detection System - Motion | Face | Emotion | Fall", display_frame)
            cv2.waitKey(500)
            
            name = input("\n[FACE] Enter name for this face: ")
            if name.strip():
                try:
                    rgb_frame = cv2.cvtColor(frame2, cv2.COLOR_BGR2RGB)
                    face_encoding = face_recognition.face_encodings(rgb_frame, [(top, right, bottom, left)])[0]
                    
                    if name in known_face_names:
                        idx = known_face_names.index(name)
                        known_face_encodings[idx] = face_encoding
                        print(f"[SUCCESS] Updated encoding for {name}")
                    else:
                        known_face_encodings.append(face_encoding)
                        known_face_names.append(name)
                        print(f"[SUCCESS] Added new face: {name}")
                    
                    save_known_faces(known_face_encodings, known_face_names)
                except Exception as e:
                    print(f"[ERROR] Error adding face: {e}")
        else:
            print("[ERROR] No faces detected to add")
    elif key == ord('s'):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"detection_{timestamp}.jpg"
        cv2.imwrite(filename, display_frame)
        print(f"[SAVED] Screenshot saved as {filename}")

cap.release()
cv2.destroyAllWindows()
print("\n[COMPLETE] System shutdown complete")
