import os
from flask import Blueprint, redirect, request, session, url_for, jsonify
import google_auth_oauthlib.flow
from google.oauth2.credentials import Credentials

# Remove url_prefix here, handled in app.py
google_auth = Blueprint("google_auth", __name__)

PORT = 5328
# Base URL for the Flask backend itself (used for internal redirects)
# Using 127.0.0.1 instead of localhost for Google OAuth compatibility
BACKEND_URL = f"http://127.0.0.1:{PORT}"
# Base URL for the frontend (used for the redirect URI that the browser sees)
FRONTEND_URL = "http://127.0.0.1:3000"
# Callback URL that Google should redirect to. 
# This should match what's in the Google Cloud Console "Authorized redirect URIs"
REDIRECT_URI = f"{BACKEND_URL}/api/auth/google/callback"

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid"
]

def get_client_config():
    return {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI],
        }
    }

@google_auth.route("")
@google_auth.route("/")
@google_auth.route("/login") # Match button without trailing slash
def authorize():
    client_config = get_client_config()
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config, scopes=SCOPES
    )
    flow.redirect_uri = REDIRECT_URI
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
    client_config = get_client_config()
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        client_config, scopes=SCOPES, state=state
    )
    flow.redirect_uri = REDIRECT_URI
    authorization_response = request.url
    try:
        flow.fetch_token(authorization_response=authorization_response)
    except Exception as e:
        return f"Token fetch failed: {str(e)}", 500
    
    credentials = flow.credentials
    session["google_credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes),
    }
    from googleapiclient.discovery import build
    user_info_service = build('oauth2', 'v2', credentials=credentials)
    user_info = user_info_service.userinfo().get().execute()
    session["user_info"] = user_info
    return redirect(FRONTEND_URL)

@google_auth.route("/me")
@google_auth.route("/me/")
def me():
    if "user_info" not in session:
        return jsonify({"authenticated": False}), 401
    return jsonify({"authenticated": True, "user": session["user_info"]})

@google_auth.route("/logout")
@google_auth.route("/logout/")
def logout():
    """Clear the session and log out the user"""
    session.clear()
    return jsonify({"message": "Logged out successfully", "authenticated": False})
