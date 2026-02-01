import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_session import Session
from dotenv import load_dotenv

# Import blueprints
from routes.google_auth import google_auth
from routes.canvas_auth import canvas_auth
from routes.emails import emails
from routes.canvas_setup import canvas_setup
from routes.canvas_data import canvas_data

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

# Configure server-side session storage
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_FILE_DIR'] = './.flask_session/'
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_USE_SIGNER'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_HTTPONLY'] = True

# Initialize Flask-Session
Session(app)

# Enable CORS with specific origins
CORS(app, 
     supports_credentials=True,
     origins=["http://127.0.0.1:3000", "http://127.0.0.1:5328"],
     allow_headers=["Content-Type"],
     expose_headers=["Set-Cookie"]
)

# Allow OAuthlib to use HTTP for local testing
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# REGISTER BLUEPRINTS
# These match the Next.js rewrite: /api/flask/:path* -> localhost:3000/api/:path*
app.register_blueprint(google_auth, url_prefix="/api/auth/google")
app.register_blueprint(canvas_auth, url_prefix="/api/auth/canvas")
app.register_blueprint(emails, url_prefix="/api/emails")
app.register_blueprint(canvas_setup, url_prefix="/api/canvas")
app.register_blueprint(canvas_data, url_prefix="/api/canvas")

@app.route("/")
def index():
    return "<h1>Triton-Hub Backend Running</h1><p>Routes available at /api/...</p>"

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask!"})

@app.route("/api/test-post", methods=["POST"])
def test_post():
    data = request.get_json()
    return jsonify({
        "message": "Received successfully",
        "data_received": data
    })

if __name__ == "__main__":
    # Run on port 5328
    app.run(debug=True, port=5328, host='127.0.0.1')