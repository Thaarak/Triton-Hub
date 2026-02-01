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
from dotenv import load_dotenv

# Load environment variables from the root .env
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'))
# Also try the local .env
load_dotenv()
from email_api import get_emails_last_month
from parse_notifications import call_llm, parse_llm_output, upload_to_supabase

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
    parser.add_argument("--user-id", type=str, help="Supabase user ID for RLS compliance")
    args = parser.parse_args()

    # Handle Re-authentication
    if args.reauth:
        if os.path.exists("token.json"):
            print("Removing cached credentials to force re-login...")
            os.remove("token.json")
        else:
            print("No cached credentials found. Proceeding with fresh login...")

    all_notifications = []
    
    # 1. Fetch Emails and Identify User
    print(f"Fetching up to {args.limit} emails from the last 30 days...")
    try:
        from email_api import get_user_email
        user_email = get_user_email()
        print(f"Authenticated as: {user_email}")
        
        # Auto-detect user_id by email lookup
        user_id = args.user_id
        if not user_id:
            from supabase import create_client
            url = os.environ.get("SUPABASE_URL")
            key = os.environ.get("SUPABASE_KEY")
            
            if not url or not key:
                print("Error: SUPABASE_URL or SUPABASE_KEY missing from .env")
                sys.exit(1)
                
            supabase = create_client(url, key)
            # Try to find the user in the profiles table (case-insensitive)
            try:
                # Use ilike for case-insensitive matching in Supabase
                res = supabase.table("profiles").select("id").ilike("email", user_email).execute()
                if res.data and len(res.data) > 0:
                    user_id = res.data[0]["id"]
                    print(f"✅ Auto-detected User ID for {user_email}: {user_id}")
                else:
                    # Fallback check
                    res = supabase.table("profiles").select("id, email").execute()
                    found = False
                    for row in res.data:
                        if row['email'].lower() == user_email.lower():
                            user_id = row['id']
                            print(f"✅ Auto-detected User ID for {user_email}: {user_id}")
                            found = True
                            break
                    
                    if not found:
                        print(f"❌ Error: Could not find a profile for {user_email} in Supabase.")
                        print("CHECKLIST:")
                        print("1. Go to Supabase -> Settings -> API.")
                        print("2. Copy the 'service_role' key (the secret one).")
                        print("3. Paste it into your .env as SUPABASE_KEY.")
                        sys.exit(1)
            except Exception as e:
                print(f"❌ Database error while looking up profile: {e}")
                print("TIP: You likely need to use the 'service_role' key from Supabase settings to bypass RLS.")
                sys.exit(1)

        emails = get_emails_last_month(max_results=args.limit)
        print(f"Fetched {len(emails)} emails.")
    except Exception as e:
        print(f"Error during initialization/fetch: {e}")
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
            # Pass detected user_id to upload function
            upload_to_supabase(all_notifications, user_id=user_id)
    else:
        print("No notifications to upload.")

if __name__ == "__main__":
    main()
