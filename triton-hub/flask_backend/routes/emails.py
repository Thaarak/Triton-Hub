from flask import Blueprint, jsonify, session, redirect, url_for
import google.oauth2.credentials
from email_api import fetch_emails_with_creds

emails = Blueprint("emails", __name__)

@emails.route("")
@emails.route("/")
def get_emails():
    if "google_credentials" not in session:
        return jsonify({"error": "Not authenticated"}), 401

    creds_data = session["google_credentials"]
    creds = google.oauth2.credentials.Credentials(
        token=creds_data["token"],
        refresh_token=creds_data.get("refresh_token"),
        token_uri=creds_data.get("token_uri"),
        client_id=creds_data.get("client_id"),
        client_secret=creds_data.get("client_secret"),
        scopes=creds_data.get("scopes"),
    )

    email_list = fetch_emails_with_creds(creds)
    return jsonify({"emails": email_list})