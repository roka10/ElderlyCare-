import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

class Config:
    SECRET_KEY     = os.environ.get("SECRET_KEY")     or "a_very_secret_key_that_should_be_random"
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "super_secret_jwt_key"

    # SQLite fallback (only used for Flask-JWT session store, not for visitor data)
    SQLALCHEMY_DATABASE_URI      = os.environ.get("DATABASE_URL") or "sqlite:///site.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Supabase
    SUPABASE_URL    = os.environ.get("SUPABASE_URL", "")
    SUPABASE_KEY    = os.environ.get("SUPABASE_KEY", "")
    SUPABASE_BUCKET = "known-faces"