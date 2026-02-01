import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Import blueprints
from routes.google_auth import google_auth
from routes.canvas_auth import canvas_auth
from routes.emails import emails

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

# Enable CORS
CORS(app, supports_credentials=True)

# Allow OAuthlib to use HTTP for local testing
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# REGISTER BLUEPRINTS
# These match the Next.js rewrite: /api/flask/:path* -> localhost:80/api/:path*
app.register_blueprint(google_auth, url_prefix="/api/auth/google")
app.register_blueprint(canvas_auth, url_prefix="/api/auth/canvas")
app.register_blueprint(emails, url_prefix="/api/emails")

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