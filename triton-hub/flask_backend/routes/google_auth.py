import os
import requests
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
    
    # Check if user has Canvas token in Supabase
    supabase_url = os.getenv("SUPABASE_URL", "https://eorcjtcaxonmrohyrxnt.supabase.co")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    try:
        # Query Supabase for user profile using service key
        headers = {
            "apikey": supabase_service_key,
            "Authorization": f"Bearer {supabase_service_key}"
        }
        response = requests.get(
            f"{supabase_url}/rest/v1/profiles?email=eq.{user_info['email']}&select=canvas_token",
            headers=headers
        )
        
        if response.status_code == 200:
            profiles = response.json()
            # If user has canvas_token, store it in session
            if profiles and profiles[0].get('canvas_token'):
                session["canvas_token"] = profiles[0]['canvas_token']
                session["canvas_url"] = "https://canvas.ucsd.edu"
    except Exception as e:
        print(f"Error checking Canvas token: {e}")
    
    # Always redirect to home
    return redirect(f"{FRONTEND_URL}/home")

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
