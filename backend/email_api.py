import os
import datetime
import threading
import webbrowser
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from werkzeug.serving import make_server
from flask import Flask, redirect, request, session, url_for
from dotenv import load_dotenv

load_dotenv()

# Scopes required to read Gmail
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def get_gmail_service(creds=None):
    """Shows basic usage of the Gmail API."""
    if creds:
        return build('gmail', 'v1', credentials=creds)
    
    creds = None
    token_path = 'token.json'
    
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if client_id and client_secret:
                CLIENT_CONFIG = {
                    "web": {
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                }
                print("Launching local login server on port 5001...")
                flow = InstalledAppFlow.from_client_config(CLIENT_CONFIG, scopes=SCOPES)
                # Using localhost as it is the most common entry in the console
                creds = flow.run_local_server(port=5001, host='localhost', prompt='consent')
            else:
                creds_path = 'credentials.json'
                if os.path.exists(creds_path):
                    flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
                    creds = flow.run_local_server(port=5001)
                else:
                    raise ValueError("No credentials found. Please set GOOGLE_CLIENT_ID/SECRET in .env or provide credentials.json")
                  
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)
    return service

def _get_header(headers, name):
    for h in headers:
        if h["name"].lower() == name.lower():
            return h["value"]
    return ""

def get_user_email(creds=None):
    """Returns the email address of the authenticated user."""
    service = get_gmail_service(creds)
    profile = service.users().getProfile(userId='me').execute()
    return profile.get('emailAddress')

def get_emails_last_month(max_results=50, creds=None):
    """Fetches emails from the last 30 days."""
    service = get_gmail_service(creds)
    today = datetime.date.today()
    last_month = today - datetime.timedelta(days=30)
    query = f"after:{last_month.strftime('%Y/%m/%d')}"
    
    results = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    messages = results.get("messages", [])
    if not messages:
        return []

    email_list = []
    for msg in messages:
        msg_detail = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = msg_detail.get("payload", {}).get("headers", [])
        snippet = msg_detail.get("snippet", "")
        
        email_data = {
            "id": msg_detail["id"],
            "snippet": snippet,
            "subject": _get_header(headers, "Subject"),
            "from": _get_header(headers, "From"),
            "date": _get_header(headers, "Date"),
            "body": snippet
        }
        email_list.append(email_data)
    return email_list

def fetch_emails_with_creds(creds, max_results=10):
    service = build("gmail", "v1", credentials=creds)
    results = service.users().messages().list(userId="me", labelIds=["INBOX"], maxResults=max_results).execute()
    messages = results.get("messages", [])
    if not messages:
        return []
    email_list = []
    for msg in messages:
        msg_detail = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = msg_detail.get("payload", {}).get("headers", [])
        email_data = {
            "id": msg_detail["id"],
            "snippet": msg_detail.get("snippet", ""),
            "subject": _get_header(headers, "Subject"),
            "from": _get_header(headers, "From"),
            "date": _get_header(headers, "Date"),
        }
        email_list.append(email_data)
    return email_list
