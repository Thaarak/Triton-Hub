import os
import sys
from pathlib import Path

# Load .env from this folder before any route imports (so cwd does not matter).
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except OSError:
        pass

from flask import Flask

from flask_cors import CORS
from routes.google_auth import google_auth
from routes.emails import emails
from routes.user import user
from routes.profile import profile
from routes.canvas import canvas_bp

app = Flask(__name__)

_frontend = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _frontend).split(",") if o.strip()]
CORS(
    app,
    resources={r"/*": {"origins": _cors_origins, "supports_credentials": True}},
)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

app.register_blueprint(google_auth)
app.register_blueprint(emails, url_prefix="/api")
app.register_blueprint(user)
app.register_blueprint(profile, url_prefix="/api/profile")
app.register_blueprint(canvas_bp, url_prefix="/api")


@app.route("/")
def index():
    return "<h1>Triton-Hub Backend</h1>"


if __name__ == "__main__":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    app.run(debug=True, port=8080)
