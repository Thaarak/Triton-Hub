import os
import sys
from flask import Blueprint, redirect, request, session, url_for
import google_auth_oauthlib.flow

# Add parent directory to path to import sync modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sync_service import perform_full_sync

google_auth = Blueprint("google_auth", __name__, url_prefix="/auth/google")

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")],
    }
}

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly", 
    "https://www.googleapis.com/auth/userinfo.email", 
    "openid"
]

@google_auth.route("/")
def authorize():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES
    )
    # Force the redirect URI to match exactly what is in the console/env
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")
    flow.redirect_uri = redirect_uri
    
    print(f"DEBUG: Redirecting to Google with URI: {redirect_uri}")

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
    )

    session["state"] = state
    return redirect(authorization_url)

@google_auth.route("/callback")
def callback():
    state = session.get("state")
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES, state=state
    )
    # Match the redirect_uri exactly
    flow.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")

    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    creds_dict = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes),
    }
    session["google_credentials"] = creds_dict

    # TRIGGER THE SYNC
    perform_full_sync(creds_dict)

    # Redirect home
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000/home")
    return redirect(frontend_url)
