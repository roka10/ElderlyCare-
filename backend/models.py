from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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