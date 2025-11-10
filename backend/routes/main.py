from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, DetectionEvent

main_bp = Blueprint('main', __name__)

@main_bp.route('/events', methods=['POST'])
@jwt_required()
def receive_event():
    from app import socketio  # ✅ moved import inside the function to break circular dependency
    
    data = request.get_json()
    
    # Validate incoming data
    required_fields = ['event_type', 'timestamp']
    if not all(field in data for field in required_fields):
        return jsonify({"msg": "Missing required event data"}), 400

    new_event = DetectionEvent(
        event_type=data['event_type'],
        timestamp=data['timestamp'],
        face_name=data.get('face_name'),
        emotion=data.get('emotion'),
        confidence=data.get('confidence'),
        frame_path=data.get('frame_path')
    )
    db.session.add(new_event)
    db.session.commit()

    # Emit event via WebSocket to connected clients
    socketio.emit('new_detection_event', data)

    return jsonify({"msg": "Event received successfully"}), 201


@main_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    events = DetectionEvent.query.order_by(DetectionEvent.timestamp.desc()).limit(100).all()
    output = []
    for event in events:
        output.append({
            'id': event.id,
            'timestamp': event.timestamp.isoformat(),
            'event_type': event.event_type,
            'face_name': event.face_name,
            'emotion': event.emotion,
            'confidence': event.confidence,
            'frame_path': event.frame_path
        })
    return jsonify(output), 200


# Endpoint to stream live frames (if you choose to send processed frames back)
# This is an alternative to sending only events, more bandwidth intensive
# @main_bp.route('/video_feed')
# def video_feed():
#     # This would stream frames from the detection module
#     # You'd need a separate mechanism for the detection module to push frames
#     # and for Flask to serve them. Flask-SocketIO is better for this.
#     pass