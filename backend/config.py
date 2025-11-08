import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'a_very_secret_key_that_should_be_random'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///site.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'super_secret_jwt_key'
    # For SocketIO
    # MESSAGE_QUEUE = os.environ.get('MESSAGE_QUEUE') or 'redis://localhost:6379/0' # Use Redis for production