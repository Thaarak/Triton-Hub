import os

from flask import Flask, redirect, request, session, jsonify, url_for
from dotenv import load_dotenv
import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build

from email_api import fetch_emails_with_creds

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost:5000/oauth2callback"],
    }
}

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


@app.route("/")
def index():
    if "credentials" in session:
        return (
            "<h1>Triton-Hub Backend</h1>"
            '<p>Authenticated. <a href="/emails">Fetch Emails</a></p>'
        )
    return (
        "<h1>Triton-Hub Backend</h1>"
        '<p><a href="/authorize">Sign in with Google</a></p>'
    )


@app.route("/authorize")
def authorize():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES
    )
    flow.redirect_uri = url_for("oauth2callback", _external=True)

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    session["state"] = state
    return redirect(authorization_url)


@app.route("/oauth2callback")
def oauth2callback():
    state = session.get("state")
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES, state=state
    )
    flow.redirect_uri = url_for("oauth2callback", _external=True)

    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    session["credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes),
    }

    return redirect(url_for("emails"))


@app.route("/emails")
def emails():
    if "credentials" not in session:
        return redirect(url_for("authorize"))

    creds = google.oauth2.credentials.Credentials(**session["credentials"])
    email_list = fetch_emails_with_creds(creds)

    for e in email_list:
        print(f"From: {e['from']}")
        print(f"Subject: {e['subject']}")
        print(f"Date: {e['date']}")
        print(f"Snippet: {e['snippet']}")
        print("-" * 40)

    return jsonify({"emails": email_list})


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


if __name__ == "__main__":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    app.run(debug=True, port=5000)
