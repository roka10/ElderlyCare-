from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO, send
from models import db
from config import Config
from routes.auth import auth_bp
from routes.main import main_bp
import os

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
jwt = JWTManager(app)
socketio = SocketIO(app, cors_allowed_origins="*", message_queue=app.config.get('MESSAGE_QUEUE')) # Allow all origins for development, specify for production

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(main_bp, url_prefix='/api')

@app.route('/')
def index():
    return "Human Activity Monitoring Backend is Running!"

@socketio.on('connect')
def test_connect():
    print('Client connected to WebSocket!')

@socketio.on('disconnect')
def test_disconnect():
    print('Client disconnected from WebSocket!')

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Create database tables if they don't exist
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)