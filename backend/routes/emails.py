from flask import Blueprint, jsonify, redirect, session, url_for
import google.oauth2.credentials

from email_api import fetch_emails_with_creds

emails = Blueprint("emails", __name__)


@emails.route("/emails")
def get_emails():
    if "google_credentials" not in session:
        return redirect(url_for("google_auth.authorize"))

    creds = google.oauth2.credentials.Credentials(**session["google_credentials"])
    email_list = fetch_emails_with_creds(creds)

    for e in email_list:
        print(f"From: {e['from']}")
        print(f"Subject: {e['subject']}")
        print(f"Date: {e['date']}")
        print(f"Snippet: {e['snippet']}")
        print("-" * 40)

    return jsonify({"emails": email_list})
