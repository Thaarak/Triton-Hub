"""Quick test: start the Flask app, open the browser, sign in,
and print the most recent email to the console."""

import os
import webbrowser

from flask import Flask, redirect, request, session, url_for
from dotenv import load_dotenv
import google.oauth2.credentials
import google_auth_oauthlib.flow

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
        "redirect_uris": ["http://localhost:5000/auth/google/callback"],
    }
}

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


@app.route("/")
def index():
    return redirect(url_for("auth_google"))


@app.route("/auth/google")
def auth_google():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES
    )
    flow.redirect_uri = url_for("auth_google_callback", _external=True)
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )
    session["state"] = state
    return redirect(authorization_url)


@app.route("/auth/google/callback")
def auth_google_callback():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES, state=session.get("state")
    )
    flow.redirect_uri = url_for("auth_google_callback", _external=True)
    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    creds = google.oauth2.credentials.Credentials(
        token=credentials.token,
        refresh_token=credentials.refresh_token,
        token_uri=credentials.token_uri,
        client_id=credentials.client_id,
        client_secret=credentials.client_secret,
        scopes=list(credentials.scopes),
    )

    emails = fetch_emails_with_creds(creds, max_results=1)

    if not emails:
        print("\nNo emails found.\n")
    else:
        e = emails[0]
        print("\n" + "=" * 50)
        print("MOST RECENT EMAIL")
        print("=" * 50)
        print(f"From:    {e['from']}")
        print(f"Subject: {e['subject']}")
        print(f"Date:    {e['date']}")
        print(f"Snippet: {e['snippet']}")
        print("=" * 50 + "\n")

    return "<h1>Check your terminal for the email output.</h1>"


if __name__ == "__main__":
    os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    print("Opening browser for Google sign-in...")
    webbrowser.open("http://localhost:5000")
    app.run(debug=False, port=5000)
