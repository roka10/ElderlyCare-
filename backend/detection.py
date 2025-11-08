import cv2
import numpy as np
import os
from datetime import datetime
import urllib.request
import pickle
import time
import tensorflow as tf
from tensorflow.keras.applications import EfficientNetB0, VGG19
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
import warnings

warnings.filterwarnings('ignore')

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
    print("Face recognition library found and imported successfully!")
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Face recognition library not found. Install with: pip install face_recognition")
    print("Continuing without face identification capabilities...")

class FaceEmotionRecognizer:
    def __init__(self, model_type="efficientnet"):
        self.emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        self.emotion_model = None
        self.face_cascade = None
        self.model_loaded = False
        self.model_dir = os.path.join(os.getcwd(), 'models')
        self.faces_dir = os.path.join(os.getcwd(), 'known_faces')
        self.known_face_encodings = []
        self.known_face_names = []
        self.face_recognition_available = FACE_RECOGNITION_AVAILABLE
        self.model_type = model_type.lower()

        os.makedirs(self.model_dir, exist_ok=True)
        os.makedirs(self.faces_dir, exist_ok=True)

        # Motion detection variables
        self.prev_frame = None
        self.motion_threshold = 500  # Adjust as needed

        # Fall detection variables
        self.fall_frames_threshold = 15  # Number of consecutive frames indicating a fall
        self.fall_detection_active = False
        self.fall_frames_count = 0
        self.last_face_bbox = None
        self.fall_threshold_aspect_ratio = 1.8 # Ratio of width/height for horizontal bounding box

    def build_and_load_emotion_model(self):
        model_filename = f"{self.model_type}_emotion_model.h5"
        model_path = os.path.join(self.model_dir, model_filename)

        if os.path.exists(model_path):
            print(f"Loading existing {self.model_type.upper()} emotion model...")
            try:
                self.emotion_model = tf.keras.models.load_model(model_path)
                print(f"Successfully loaded {self.model_type.upper()} emotion model")
                return True
            except Exception as e:
                print(f"Error loading model: {e}")

        print(f"Building new {self.model_type.upper()} model for emotion recognition...")

        try:
            if self.model_type == "efficientnet":
                base_model = EfficientNetB0(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
            elif self.model_type == "vgg19":
                base_model = VGG19(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
            else:
                print(f"Unknown model type: {self.model_type}")
                return False

            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            x = Dense(1024, activation='relu')(x)
            predictions = Dense(len(self.emotions), activation='softmax')(x)
            self.emotion_model = Model(inputs=base_model.input, outputs=predictions)

            self.emotion_model.compile(optimizer='adam',
                             loss='categorical_crossentropy',
                             metrics=['accuracy'])

            print(f"{self.model_type.upper()} model built successfully")
            print("Note: This model needs to be trained or fine-tuned with emotion data")
            print("Using pre-initialized weights for transfer learning")

            self.emotion_model.save(model_path)
            print(f"Saved {self.model_type.upper()} model to {model_path}")

            return True
        except Exception as e:
            print(f"Error building {self.model_type.upper()} model: {e}")
            import traceback
            traceback.print_exc()
            return False

    def download_models(self):
        default_cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        alt_cascade_path = os.path.join(self.model_dir, 'haarcascade_frontalface_default.xml')

        if not os.path.exists(default_cascade_path):
            if not os.path.exists(alt_cascade_path):
                print("Downloading Haar cascade classifier...")
                try:
                    url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
                    urllib.request.urlretrieve(url, alt_cascade_path)
                    print(f"Downloaded Haar cascade to {alt_cascade_path}")
                except Exception as e:
                    print(f"Failed to download Haar cascade: {e}")
                    return False
            cascade_path = alt_cascade_path
        else:
            cascade_path = default_cascade_path

        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        if self.face_cascade.empty():
            print("Error: Failed to load Haar cascade classifier")
            return False

        if not self.build_and_load_emotion_model():
            print(f"Error with {self.model_type.upper()} emotion model.")
            return False

        if self.face_recognition_available:
            print("Face recognition is enabled and ready to use!")
            self.load_known_faces()
        else:
            print("Face recognition is disabled. Install the 'face_recognition' library to enable it.")

        self.model_loaded = True
        return True

    def load_known_faces(self):
        faces_db_path = os.path.join(self.model_dir, 'known_faces.pkl')

        if os.path.exists(faces_db_path):
            try:
                with open(faces_db_path, 'rb') as f:
                    data = pickle.load(f)
                    self.known_face_encodings = data['encodings']
                    self.known_face_names = data['names']
                print(f"Loaded {len(self.known_face_names)} known faces")
            except Exception as e:
                print(f"Error loading known faces: {e}")
                self.known_face_encodings = []
                self.known_face_names = []
        else:
            print("No known faces database found. You can add faces using the 'a' key.")
            self.known_face_encodings = []
            self.known_face_names = []

    def save_known_faces(self):
        faces_db_path = os.path.join(self.model_dir, 'known_faces.pkl')
        try:
            with open(faces_db_path, 'wb') as f:
                data = {
                    'encodings': self.known_face_encodings,
                    'names': self.known_face_names
                }
                pickle.dump(data, f)
            print(f"Saved {len(self.known_face_names)} known faces")
        except Exception as e:
            print(f"Error saving known faces: {e}")

    def add_face(self, frame, name=None):
        if not self.face_recognition_available:
            print("Face recognition is not available. Install face_recognition library.")
            return False

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_frame)

        if not face_locations:
            print("No face detected in the frame")
            return False

        if len(face_locations) > 1:
            print(f"Multiple faces detected, using the largest one")
            largest_area = 0
            largest_face_idx = 0
            for i, (top, right, bottom, left) in enumerate(face_locations):
                area = (bottom - top) * (right - left)
                if area > largest_area:
                    largest_area = area
                    largest_face_idx = i
            face_location = [face_locations[largest_face_idx]]
        else:
            face_location = face_locations

        face_encoding = face_recognition.face_encodings(rgb_frame, face_location)[0]

        if name is None:
            name = input("Enter the name for this face: ")

        if name in self.known_face_names:
            idx = self.known_face_names.index(name)
            self.known_face_encodings[idx] = face_encoding
            print(f"Updated encoding for {name}")
        else:
            self.known_face_encodings.append(face_encoding)
            self.known_face_names.append(name)
            print(f"Added new face: {name}")

        self.save_known_faces()

        return True

    def detect_emotion(self, face_img):
        if not self.model_loaded:
            return "Unknown", 0.0

        try:
            if face_img is None or face_img.size == 0:
                return "No valid face", 0.0

            if face_img.shape[0] < 10 or face_img.shape[1] < 10:
                return "Face too small", 0.0

            resized_face = cv2.resize(face_img, (224, 224))
            rgb_face = cv2.cvtColor(resized_face, cv2.COLOR_BGR2RGB)
            normalized_face = rgb_face / 255.0
            input_face = np.expand_dims(normalized_face, axis=0)

            emotion_prediction = self.emotion_model.predict(input_face, verbose=0)

            if emotion_prediction.shape[1] != len(self.emotions):
                print(f"Warning: Model output shape {emotion_prediction.shape} doesn't match emotions list length {len(self.emotions)}")
                return "Model error", 0.0

            emotion_probability = np.max(emotion_prediction)
            emotion_label = self.emotions[np.argmax(emotion_prediction)]

            return emotion_label, emotion_probability
        except Exception as e:
            print(f"Error in emotion detection: {e}")
            import traceback
            traceback.print_exc()
            return "Error", 0.0

    def recognize_face(self, frame, face_location):
        if not self.face_recognition_available:
            return "Unknown"

        if len(self.known_face_encodings) == 0:
            return "Unknown"

        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            top, right, bottom, left = face_location
            face_encoding = face_recognition.face_encodings(rgb_frame, [(top, right, bottom, left)])[0]

            matches = face_recognition.compare_faces(self.known_face_encodings, face_encoding, tolerance=0.6)
            face_distances = face_recognition.face_distance(self.known_face_encodings, face_encoding)

            if len(matches) > 0 and True in matches:
                best_match_index = np.argmin(face_distances)
                if matches[best_match_index]:
                    name = self.known_face_names[best_match_index]
                    return name

            return "Unknown"
        except Exception as e:
            print(f"Error in face recognition: {e}")
            return "Error"

    def detect_motion(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)

        motion_detected = False
        if self.prev_frame is not None:
            frame_delta = cv2.absdiff(self.prev_frame, gray)
            thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
            thresh = cv2.dilate(thresh, None, iterations=2)
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            total_motion_area = 0
            for contour in contours:
                if cv2.contourArea(contour) < self.motion_threshold:
                    continue
                total_motion_area += cv2.contourArea(contour)
                motion_detected = True

            if motion_detected:
                return True, total_motion_area
            else:
                return False, 0
        else:
            self.prev_frame = gray
            return False, 0

    def detect_fall(self, face_bbox):
        # Fall detection logic based on bounding box aspect ratio and previous position
        if face_bbox is None:
            self.fall_detection_active = False
            self.fall_frames_count = 0
            return False

        x, y, w, h = face_bbox
        current_aspect_ratio = w / float(h)

        # Check for a sudden change in aspect ratio (person falling horizontally)
        if current_aspect_ratio > self.fall_threshold_aspect_ratio:
            self.fall_frames_count += 1
            if self.fall_frames_count >= self.fall_frames_threshold:
                if not self.fall_detection_active:
                    self.fall_detection_active = True
                    print("Fall detected!")
                    return True
        else:
            self.fall_frames_count = 0
            self.fall_detection_active = False # Reset if no fall posture

        return False


    def run_detection(self):
        if not self.download_models():
            print("Failed to initialize models. Using fallback face detection only.")
            self.run_basic_detection()
            return

        print(f"Starting face recognition with {self.model_type.upper()} emotion, motion, and fall detection.")
        print("Controls:")
        print("  - Press 'q' to quit")
        print("  - Press 'a' to add current face to database")
        print("  - Press 's' to save a screenshot")

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open webcam")
            return

        frame_count = 0
        start_time = datetime.now()
        last_emotion_time = time.time() - 10  # Initialize with a past time
        emotion_text = "Unknown"
        emotion_prob = 0.0
        motion_status = "No Motion"
        fall_status = "No Fall"

        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame from camera")
                break

            display_frame = frame.copy()

            # Motion Detection
            is_motion, motion_area = self.detect_motion(frame)
            if is_motion:
                motion_status = f"Motion Detected (Area: {motion_area})"
            else:
                motion_status = "No Motion"
            self.prev_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) # Update prev_frame after motion detection

            # Face and Fall Detection
            face_locations = []
            face_bbox_for_fall = None

            if self.face_recognition_available:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_locations = face_recognition.face_locations(rgb_frame)

                if face_locations:
                    # For fall detection, let's consider the largest face
                    largest_area = 0
                    largest_face_loc = None
                    for loc in face_locations:
                        top, right, bottom, left = loc
                        area = (bottom - top) * (right - left)
                        if area > largest_area:
                            largest_area = area
                            largest_face_loc = loc
                    
                    if largest_face_loc:
                        top, right, bottom, left = largest_face_loc
                        face_bbox_for_fall = (left, top, right - left, bottom - top) # (x,y,w,h)

                if self.detect_fall(face_bbox_for_fall):
                    fall_status = "FALL DETECTED!"
                else:
                    if self.fall_detection_active: # If still in the fall sequence but not confirmed
                         fall_status = "Possible Fall"
                    else:
                        fall_status = "No Fall"

                for (top, right, bottom, left) in face_locations:
                    face_roi = frame[top:bottom, left:right]

                    current_time = time.time()
                    if current_time - last_emotion_time > 2.0:
                        emotion_text, emotion_prob = self.detect_emotion(face_roi)
                        last_emotion_time = current_time

                    face_name = self.recognize_face(frame, (top, right, bottom, left))
                    color = self.get_emotion_color(emotion_text)

                    cv2.rectangle(display_frame, (left, top), (right, bottom), color, 2)

                    name_bg_height = 40
                    name_bg_start_y = max(0, top - name_bg_height)
                    cv2.rectangle(display_frame,
                                 (left, name_bg_start_y),
                                 (right, top),
                                 (0, 0, 0),
                                 cv2.FILLED)

                    name_text = face_name
                    font_scale = 0.8
                    font_thickness = 2
                    font = cv2.FONT_HERSHEY_DUPLEX
                    (text_width, text_height), baseline = cv2.getTextSize(name_text, font, font_scale, font_thickness)
                    text_x = left + (right - left - text_width) // 2
                    text_y = name_bg_start_y + (name_bg_height + text_height) // 2
                    cv2.putText(display_frame, name_text, (text_x, text_y),
                               font, font_scale, (255, 255, 255), font_thickness)

                    emotion_display = f"{emotion_text}: {emotion_prob:.2f}"
                    cv2.rectangle(display_frame, (left, bottom), (right, bottom + 30), (0, 0, 0), cv2.FILLED)
                    (text_width, text_height), baseline = cv2.getTextSize(emotion_display, font, 0.6, 1)
                    text_x = left + (right - left - text_width) // 2
                    cv2.putText(display_frame, emotion_display, (text_x, bottom + 20),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

            else:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(30, 30),
                    flags=cv2.CASCADE_SCALE_IMAGE
                )
                if faces:
                    x_fall, y_fall, w_fall, h_fall = faces[0] # Consider first face for fall detection
                    face_bbox_for_fall = (x_fall, y_fall, w_fall, h_fall)

                if self.detect_fall(face_bbox_for_fall):
                    fall_status = "FALL DETECTED!"
                else:
                    if self.fall_detection_active:
                         fall_status = "Possible Fall"
                    else:
                        fall_status = "No Fall"

                for (x, y, w, h) in faces:
                    face_roi = frame[y:y+h, x:x+w]

                    current_time = time.time()
                    if current_time - last_emotion_time > 2.0:
                        emotion_text, emotion_prob = self.detect_emotion(face_roi)
                        last_emotion_time = current_time

                    color = self.get_emotion_color(emotion_text)

                    cv2.rectangle(display_frame, (x, y), (x+w, y+h), color, 2)

                    name_bg_height = 40
                    name_bg_start_y = max(0, y - name_bg_height)
                    cv2.rectangle(display_frame,
                                 (x, name_bg_start_y),
                                 (x+w, y),
                                 (0, 0, 0),
                                 cv2.FILLED)

                    name_text = "Unknown"
                    font_scale = 0.8
                    font_thickness = 2
                    font = cv2.FONT_HERSHEY_DUPLEX
                    (text_width, text_height), baseline = cv2.getTextSize(name_text, font, font_scale, font_thickness)
                    text_x = x + (w - text_width) // 2
                    text_y = name_bg_start_y + (name_bg_height + text_height) // 2
                    cv2.putText(display_frame, name_text, (text_x, text_y),
                               font, font_scale, (255, 255, 255), font_thickness)

                    emotion_display = f"{emotion_text}: {emotion_prob:.2f}"
                    cv2.rectangle(display_frame, (x, y+h), (x+w, y+h+30), (0, 0, 0), cv2.FILLED)
                    (text_width, text_height), baseline = cv2.getTextSize(emotion_display, font, 0.6, 1)
                    text_x = x + (w - text_width) // 2
                    cv2.putText(display_frame, emotion_display, (text_x, y+h+20),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)

                face_locations = [(y, x+w, y+h, x) for (x, y, w, h) in faces]

            # Display Motion and Fall Status
            cv2.putText(display_frame, f'Motion: {motion_status}', (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2) # Yellow
            
            fall_color = (0,0,255) if fall_status == "FALL DETECTED!" else (0,255,0)
            cv2.putText(display_frame, f'Fall: {fall_status}', (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, fall_color, 2)

            if self.face_recognition_available:
                cv2.putText(display_frame, f'Faces: {len(face_locations)} | Known: {len(self.known_face_names)} | Face Recognition: Enabled', (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                cv2.putText(display_frame, f'Faces: {len(face_locations)} | Face Recognition: Disabled', (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

            cv2.putText(display_frame, "Press 'q' to quit, 'a' to add face, 's' to save screenshot",
                        (10, display_frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

            cv2.imshow(f'Live Monitoring with {self.model_type.upper()} Emotion Detection', display_frame)

            key = cv2.waitKey(1) & 0xFF

            if key == ord('q'):
                break
            elif key == ord('a') and self.face_recognition_available:
                if len(face_locations) > 0:
                    largest_area = 0
                    largest_idx = 0
                    for i, (top, right, bottom, left) in enumerate(face_locations):
                        area = (bottom - top) * (right - left)
                        if area > largest_area:
                            largest_area = area
                            largest_idx = i

                    top, right, bottom, left = face_locations[largest_idx]
                    face_img = frame[top:bottom, left:right]

                    marked_frame = display_frame.copy()
                    cv2.rectangle(marked_frame, (left, top), (right, bottom), (0, 255, 255), 3)

                    prompt_text = "Adding this face - enter name in console"
                    cv2.putText(marked_frame, prompt_text, (10, display_frame.shape[0] - 40),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

                    cv2.imshow(f'Live Monitoring with {self.model_type.upper()} Emotion Detection', marked_frame)
                    cv2.waitKey(500)

                    name = input("Enter name for this face: ")
                    if name.strip():
                        self.add_face(frame, name)
                        print(f"Added face for {name}")
                else:
                    print("No faces detected to add")
            elif key == ord('s'):
                timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                filename = f"detection_{timestamp}.jpg"
                cv2.imwrite(filename, display_frame)
                print(f"Screenshot saved as {filename}")

            frame_count += 1
            if frame_count % 30 == 0:
                elapsed_time = (datetime.now() - start_time).total_seconds()
                fps = frame_count / elapsed_time
                print(f"FPS: {fps:.2f}, Faces: {len(face_locations)}, Motion: {motion_status}, Fall: {fall_status}")

        cap.release()
        cv2.destroyAllWindows()

    def get_emotion_color(self, emotion_text):
        if emotion_text == 'Happy':
            return (0, 255, 255)
        elif emotion_text == 'Sad':
            return (255, 0, 0)
        elif emotion_text == 'Angry':
            return (0, 0, 255)
        elif emotion_text == 'Fear':
            return (255, 0, 255)
        elif emotion_text == 'Surprise':
            return (0, 165, 255)
        elif emotion_text == 'Disgust':
            return (0, 128, 128)
        elif emotion_text == 'Neutral':
            return (0, 255, 0)
        else:
            return (200, 200, 200)

    def run_basic_detection(self):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if not os.path.exists(cascade_path):
            cascade_path = os.path.join(self.model_dir, 'haarcascade_frontalface_default.xml')

        face_cascade = cv2.CascadeClassifier(cascade_path)
        if face_cascade.empty():
            print("Error: Could not load face cascade classifier")
            return

        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open webcam")
            return

        print("Starting basic face detection with name display. Press 'q' to quit.")

        self.prev_frame = None # Initialize for motion detection in basic mode

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            display_frame = frame.copy() # Use a copy for drawing
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

            # Motion Detection
            is_motion, motion_area = self.detect_motion(frame)
            if is_motion:
                motion_status = f"Motion Detected (Area: {motion_area})"
            else:
                motion_status = "No Motion"
            self.prev_frame = gray # Update prev_frame

            # Fall Detection (using first detected face for simplicity in basic mode)
            face_bbox_for_fall = None
            if len(faces) > 0:
                x, y, w, h = faces[0]
                face_bbox_for_fall = (x, y, w, h)

            if self.detect_fall(face_bbox_for_fall):
                fall_status = "FALL DETECTED!"
            else:
                if self.fall_detection_active:
                    fall_status = "Possible Fall"
                else:
                    fall_status = "No Fall"


            for (x, y, w, h) in faces:
                cv2.rectangle(display_frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

                name_bg_height = 40
                name_bg_start_y = max(0, y - name_bg_height)
                cv2.rectangle(display_frame,
                             (x, name_bg_start_y),
                             (x+w, y),
                             (0, 0, 0),
                             cv2.FILLED)

                name_text = "Unknown"
                font_scale = 0.8
                font_thickness = 2
                font = cv2.FONT_HERSHEY_DUPLEX
                (text_width, text_height), baseline = cv2.getTextSize(name_text, font, font_scale, font_thickness)
                text_x = x + (w - text_width) // 2
                text_y = name_bg_start_y + (name_bg_height + text_height) // 2
                cv2.putText(display_frame, name_text, (text_x, text_y),
                           font, font_scale, (255, 255, 255), font_thickness)

            cv2.putText(display_frame, f'Faces: {len(faces)}', (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.putText(display_frame, f'Motion: {motion_status}', (10, 60),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            fall_color = (0,0,255) if fall_status == "FALL DETECTED!" else (0,255,0)
            cv2.putText(display_frame, f'Fall: {fall_status}', (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, fall_color, 2)


            cv2.imshow('Basic Face Detection with Name Display', display_frame)

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

def main():
    print("Face Recognition with Advanced Emotion, Motion, and Fall Detection")
    print("-----------------------------------------------")
    print("1: Use EfficientNet for emotion detection (default)")
    print("2: Use VGG19 for emotion detection")
    choice = input("Enter your choice (1 or 2): ")

    model_type = "efficientnet"
    if choice == "2":
        model_type = "vgg19"

    print(f"\nSelected {model_type.upper()} for emotion detection")
    print("This program will detect faces, identify people, and detect emotions in real-time, along with motion and fall detection.")
    print("Required libraries:")
    print("  - OpenCV (cv2)")
    print("  - NumPy")
    print("  - TensorFlow (for emotion detection)")
    print("  - face_recognition (for face identification)")

    if not FACE_RECOGNITION_AVAILABLE:
        print("\nWARNING: face_recognition library is not installed!")
        print("Face identification will be disabled.")
        print("To enable it, install with: pip install face_recognition")
        install = input("Would you like to try installing face_recognition now? (y/n): ")
        if install.lower() == 'y':
            try:
                import subprocess
                print("Attempting to install face_recognition...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "face_recognition"])
                print("Installation successful! Please restart the program.")
                return
            except Exception as e:
                print(f"Installation failed: {e}")
                print("Please install face_recognition manually and restart the program.")

    recognizer = FaceEmotionRecognizer(model_type=model_type)
    recognizer.run_detection()

if __name__ == "__main__":
    import sys
    main()