#!/usr/bin/env python3
"""
Orchestrator script:
1. Fetch emails from Gmail (last 30 days) using local OAuth login.
2. Fetch Canvas assignments/announcements using canvasapi library
3. Parse Gmail emails using LLM.
4. Combine and deduplicate all notifications
5. Upload to Supabase with similarity detection.
"""
import sys
import os
import argparse
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from email_api import fetch_emails_with_creds
from parse_notifications import call_llm, parse_llm_output, upload_to_supabase

# Google OAuth imports for standalone execution
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
TOKEN_PATH = os.path.join(os.path.dirname(__file__), "..", "token.json")

# Read OAuth client credentials from environment instead of hardcoding secrets.
CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

# Client config for InstalledAppFlow (desktop app style)
CLIENT_CONFIG = {
    "installed": {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"]
    }
}


def get_gmail_creds():
    """Get Gmail credentials - load from token.json or prompt for login."""
    creds = None

    if not CLIENT_ID or not CLIENT_SECRET:
        raise SystemExit("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment or .env.")
    
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    
    # If no valid credentials, prompt for login
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("\nOpening browser for Google login...")
            flow = InstalledAppFlow.from_client_config(CLIENT_CONFIG, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # Save for future runs
        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())
    
    return creds


def get_emails_last_month(max_results=50):
    """Wrapper to fetch emails using local OAuth."""
    creds = get_gmail_creds()
    return fetch_emails_with_creds(creds, max_results=max_results)

# Import Canvas library
try:
    from canvasapi import Canvas
    # Import get_api_key from backend
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
    from canvas_api import get_api_key
except ImportError:
    print("Warning: canvasapi not installed. Install with: pip install canvasapi")
    Canvas = None
    get_api_key = None

def fetch_canvas_data():
    """Fetch Canvas data using canvasapi library and token from backend/canvas_api.py"""
    if Canvas is None or get_api_key is None:
        print("Skipping Canvas: canvasapi library not installed or backend not found")
        return []
    
    # Get token from backend function (uses placeholder user_id for now)
    token = get_api_key(user_id="placeholder")
    domain = "https://canvas.ucsd.edu"
    
    print(f"\nFetching Canvas data from {domain}...")
    try:
        canvas = Canvas(domain, token)
        
        # Fetch active courses for Winter 2026
        print("Fetching courses...")
        courses = []
        for course in canvas.get_courses(enrollment_state="active"):
            # Only get WI26 courses (or current term)
            if hasattr(course, 'name') and "WI26" in course.name:
                courses.append(course)
        
        print(f"Found {len(courses)} active WI26 courses.")
        
        all_notifications = []
        
        # Fetch assignments for each course
        print("Fetching assignments...")
        for course in courses:
            course_name = course.name if hasattr(course, 'name') else 'Unknown Course'
            course_id = course.id if hasattr(course, 'id') else None
            
            if not course_id:
                continue
            
            try:
                for assignment in course.get_assignments():
                    due_at = assignment.due_at if hasattr(assignment, 'due_at') else None
                    if not due_at:
                        continue
                        
                    try:
                        # Parse ISO format datetime
                        dt = datetime.fromisoformat(due_at.replace("Z", "+00:00"))
                        event_date = dt.strftime("%Y-%m-%d")
                        event_time = dt.strftime("%I:%M %p")
                    except:
                        event_date = str(due_at)
                        event_time = ""
                    
                    assignment_name = assignment.name if hasattr(assignment, 'name') else 'Assignment'
                    html_url = assignment.html_url if hasattr(assignment, 'html_url') else ""
                    
                    notif = {
                        "source": "Canvas",
                        "category": "assignment",
                        "event_date": event_date,
                        "event_time": event_time,
                        "urgency": "High",
                        "link": html_url,
                        "summary": f"[{course_name}] {assignment_name} is due."
                    }
                    all_notifications.append(notif)
            except Exception as e:
                print(f"Warning: Could not fetch assignments for {course_name}: {e}")
                continue
        
        # Fetch announcements
        print("Fetching announcements...")
        try:
            course_ids = [c.id for c in courses if hasattr(c, 'id')]
            for announcement in canvas.get_announcements(course_ids):
                posted_at = announcement.posted_at if hasattr(announcement, 'posted_at') else None
                
                try:
                    if posted_at:
                        dt = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                        event_date = dt.strftime("%Y-%m-%d")
                        event_time = dt.strftime("%I:%M %p")
                    else:
                        event_date = "null"
                        event_time = "null"
                except:
                    event_date = "null"
                    event_time = "null"
                
                title = announcement.title if hasattr(announcement, 'title') else 'Announcement'
                html_url = announcement.html_url if hasattr(announcement, 'html_url') else ""
                
                notif = {
                    "source": "Canvas",
                    "category": "announcement",
                    "event_date": event_date,
                    "event_time": event_time,
                    "urgency": "Medium",
                    "link": html_url,
                    "summary": f"Canvas Announcement: {title}"
                }
                all_notifications.append(notif)
        except Exception as e:
            print(f"Warning: Could not fetch announcements: {e}")
        
        print(f"Fetched {len(all_notifications)} Canvas notifications.")
        return all_notifications
        
    except Exception as e:
        print(f"Error fetching Canvas data: {e}")
        import traceback
        traceback.print_exc()
        return []

def main():
    parser = argparse.ArgumentParser(description="Fetch Gmail + Canvas, Parse, and Upload")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and parse but do not upload")
    parser.add_argument("--limit", type=int, default=50, help="Max emails to fetch")
    parser.add_argument("--reauth", action="store_true", help="Force re-authentication (switch account)")
    parser.add_argument("--skip-canvas", action="store_true", help="Skip Canvas integration")
    args = parser.parse_args()

    # Handle Re-authentication
    if args.reauth:
        if os.path.exists("token.json"):
            print("Removing cached credentials to force re-login...")
            os.remove("token.json")
        else:
            print("No cached credentials found. Proceeding with fresh login...")

    all_notifications = []
    
    # 1. Fetch Emails
    print(f"Fetching up to {args.limit} emails from the last 30 days...")
    try:
        emails = get_emails_last_month(max_results=args.limit)
        print(f"Fetched {len(emails)} emails.")
    except Exception as e:
        print(f"Error fetching emails: {e}")
        print("Ensure 'credentials.json' is present and you have authenticated.")
        sys.exit(1)

    if emails:
        # 2. Prepare content for LLM
        print("\nPreparing email content for parsing...")
        full_text = "\n\n---\n\n".join(
            [
                f"FROM: {email.get('from', 'Unknown')}\nSUBJECT: {email.get('subject', 'No Subject')}\nBODY:\n{email.get('body', '')}"
                for email in emails
            ]
        )

        # 3. Call LLM
        print("Sending to LLM for parsing...")
        raw_output = call_llm(full_text)

        # 4. Parse LLM Output
        gmail_notifications = parse_llm_output(raw_output)
        print(f"Parsed {len(gmail_notifications)} notifications from Gmail.")
        all_notifications.extend(gmail_notifications)
    else:
        print("No emails found.")

    # 5. Fetch Canvas Data
    if not args.skip_canvas:
        canvas_notifications = fetch_canvas_data()
        all_notifications.extend(canvas_notifications)
    
    # 6. Upload to Supabase (with automatic deduplication and similarity detection)
    if all_notifications:
        if args.dry_run:
            print("\n[DRY RUN] Would upload these notifications:")
            for notif in all_notifications:
                print(f"  - {notif}")
        else:
            upload_to_supabase(all_notifications)
    else:
        print("No notifications to upload.")

if __name__ == "__main__":
    main()
