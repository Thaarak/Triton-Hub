import os

from flask import Flask
from dotenv import load_dotenv

from flask_cors import CORS
from routes.google_auth import google_auth
from routes.emails import emails
from routes.user import user

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for frontend communication
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

app.register_blueprint(google_auth)
app.register_blueprint(emails)
app.register_blueprint(user)


@app.route("/")
def index():
    return "<h1>Triton-Hub Backend</h1>"


if __name__ == "__main__":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    app.run(debug=True, port=8080)
