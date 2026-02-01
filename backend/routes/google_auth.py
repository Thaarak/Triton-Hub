import os

from flask import Blueprint, redirect, request, session, url_for
import google.oauth2.credentials
import google_auth_oauthlib.flow

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

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


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

    # TODO: Link Google account to the logged-in user in the database
    # TODO: Redirect to frontend dashboard instead of /emails
    return redirect(url_for("emails.get_emails"))
