import os

from flask import Blueprint, redirect, request, session, url_for, jsonify
import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build

from db import get_user_by_email, create_user

google_auth = Blueprint("google_auth", __name__, url_prefix="/auth/google")

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost:8080/auth/google/callback"],
    }
}

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


@google_auth.route("/")
def authorize():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES
    )
    flow.redirect_uri = url_for("google_auth.callback", _external=True)

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
    flow.redirect_uri = url_for("google_auth.callback", _external=True)

    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    session["google_credentials"] = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes),
    }

    # Fetch the user's Google profile (name + email)
    people_service = build("people", "v1", credentials=credentials)
    profile = people_service.people().get(
        resourceName="people/me",
        personFields="names,emailAddresses",
    ).execute()

    email = profile["emailAddresses"][0]["value"]
    full_name = profile["names"][0]["displayName"]

    # Check if user already exists in the database
    existing_user = get_user_by_email(email)

    if existing_user:
        # Returning user — store their info in session
        session["user"] = existing_user
    else:
        # New user — create them in the database
        new_user = create_user(email=email, full_name=full_name)
        session["user"] = new_user

    return redirect(url_for("emails.get_emails"))
