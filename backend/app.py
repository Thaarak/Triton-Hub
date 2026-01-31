import os

from flask import Flask
from dotenv import load_dotenv

from routes.google_auth import google_auth
from routes.canvas_auth import canvas_auth
from routes.emails import emails

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

app.register_blueprint(google_auth)
app.register_blueprint(canvas_auth)
app.register_blueprint(emails)


@app.route("/")
def index():
    return "<h1>Triton-Hub Backend</h1>"


if __name__ == "__main__":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    app.run(debug=True, port=5000)
