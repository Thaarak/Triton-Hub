#!/usr/bin/env python3
"""
Parse student notification text using an LLM.

Process:
1. Send raw text + fixed prompt to LLM.
2. Parse plain-text response: one notification per line, columns separated by '|'.
3. Return structured list of dicts (course, category, due_date, urgency, summary).

Usage:
  echo "Your notification text here" | python3 parse_notifications.py
  python3 parse_notifications.py --text "Your notification text here"
  python3 parse_notifications.py --dry-run   # print prompt and sample; no API call
"""

import os
import sys
import argparse
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Load .env from script directory so GOOGLE_API_KEY (or GEMINI_API_KEY) is available
def _load_env():
    _script_dir = os.path.dirname(os.path.abspath(__file__))
    _env_path = os.path.join(_script_dir, ".env")
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_path)
    except ImportError:
        pass
    # Fallback: read .env manually if key still missing (e.g. dotenv not installed)
    if not (os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")) and os.path.isfile(_env_path):
        with open(_env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    key, value = key.strip(), value.strip().strip('"\'')
                    if key in ("GOOGLE_API_KEY", "GEMINI_API_KEY") and value:
                        os.environ[key] = value
                        break
_load_env()

# Fixed prompt from the assignment
# Fixed prompt from the assignment
SYSTEM_PROMPT_TEMPLATE = """You are an assistant that parses student notifications.
Today is {today}.

System Prompt (Context):
You are a notification parser for a college student. Your job is to extract ONLY the most important academic notifications from emails.

Task:
1. Categorize each notification into one of: 'exam', 'assignment', 'event', 'announcement', 'personal', 'spam'.
2. If the category is 'spam' or 'scam', strictly ignore it.
3. STRICTLY IGNORE any notifications related to:
   - "free food", "promotions", "coupons", "deals", or "marketing"
   - "TritonToGo" or any food delivery services
   - "Google Docs" or "Google Drive" sharing notifications
   - Social media notifications (Instagram, Facebook, Twitter, etc.)
   - Generic newsletters or mailing lists
   - Administrative emails with no action items (e.g., "thank you", "reminder to check portal")
4. ONLY INCLUDE notifications that are:
   - Academic deadlines (exams, assignments, project due dates)
   - Important campus events (required meetings, career fairs, academic workshops)
   - Critical announcements from professors or departments
   - Personal messages from professors, TAs, or study groups with specific action items
5. For the items you DO include, extract:
   - source (e.g. 'Canvas', 'Professor Smith', 'CSE Department')
   - category ('exam', 'assignment', 'event', 'announcement', 'personal')
   - event_date (YYYY-MM-DD or 'null')
   - event_time (HH:MM AM/PM, or 'null')
   - urgency (assessment: high/medium/low)
   - link (extract any URL if present in the text, else 'null')
   - summary (1-2 sentence description)

4. IMPORTANT: Deduplicate aggressively for the SAME course/source only.
   - If two lines describe the same task or announcement from the SAME source (same class/course), keep ONE.
   - If the same KIND of update applies to DIFFERENT courses (e.g. "final grades posted" for MATH 20C vs COGS 9), keep BOTH — one line per class.
5. Return the results in plain text, one notification per line, columns separated by '|'.
6. Do NOT emit markdown formatting or headers.
"""

COLUMNS = ["source", "category", "event_date", "event_time", "urgency", "link", "summary"]


def call_llm(user_text: str) -> str:
    """Call Google AI Studio (Gemini) API. Requires GOOGLE_API_KEY or GEMINI_API_KEY in .env or environment."""
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("Set GOOGLE_API_KEY or GEMINI_API_KEY in .env or your environment.")

    try:
        from google import genai
        from google.genai import types
        from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type, before_sleep_log
        import logging
    except ImportError:
        raise SystemExit(
            "Missing dependencies. With venv activated, run:\n"
            "  pip install -r requirements.txt"
        )

    client = genai.Client(api_key=api_key)
    today_str = datetime.now().strftime("%Y-%m-%d")
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(today=today_str)

    # Retry helper specifically for 429s (Rate Limit)
    # We'll retry a few times with exponential backoff
    @retry(
        reraise=True,
        wait=wait_exponential(multiplier=1, min=4, max=60),
        stop=stop_after_attempt(5)
    )
    def generate_with_retry(model_id, prompt):
        return client.models.generate_content(
            model=model_id,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0,
            ),
        )

    # Try current Gemini models (gemini-flash-latest is most reliable for free tier)
    models = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro-latest"]
    
    for model_id in models:
        try:
            response = client.models.generate_content(
                model=model_id,
                contents=f"{system_prompt}\n\nCONTENT TO PARSE:\n{user_text}"
            )
            return (response.text or "").strip()
        except Exception as e:
            # If rate limited OR any other error (like 404), try the next model
            err_str = str(e).lower()
            if "429" in err_str or "resource_exhausted" in err_str:
                print(f"Model {model_id} hit rate limit or has no quota. Trying next model...", file=sys.stderr)
            else:
                print(f"Error with {model_id}: {e}. Trying next model...", file=sys.stderr)
            continue # Keep trying!
    
    print("Error: All Gemini models failed to parse content.", file=sys.stderr)
    return "[]"


def parse_llm_output(raw_output: str) -> list[dict]:
    """
    Parse LLM plain-text response into list of notification dicts.
    Expects one notification per line, columns separated by '|'.
    """
    rows = []
    today = datetime.now()
    
    for line in raw_output.strip().split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
            
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < len(COLUMNS):
            continue
            
        # If summary contained '|', join extra parts into summary
        if len(parts) > len(COLUMNS):
            parts = parts[: len(COLUMNS) - 1] + ["|".join(parts[len(COLUMNS) - 1 :])]
            
        row = dict(zip(COLUMNS, parts))
        
        # 1. Clean up nulls
        for k in row:
            if row[k].lower() == "null":
                row[k] = ""

        # 2. Logic: Canvas Urgency
        # "If the information is from canvas make sure the data automatically has a high urgency
        # and then ultra high if its within a few days."
        source = row.get("source", "").lower()
        if "canvas" in source:
            current_urgency = row.get("urgency", "high").lower()
            # Set minimum to high if not already
            if "ultra" not in current_urgency:
                row["urgency"] = "High"
            
            # Check date for "Ultra High"
            e_date_str = row.get("event_date", "")
            if e_date_str:
                try:
                    e_date = datetime.strptime(e_date_str, "%Y-%m-%d")
                    delta = (e_date - today).days
                    # "within a few days" -> let's say <= 3 days
                    if 0 <= delta <= 3:
                        row["urgency"] = "Ultra High"
                except ValueError:
                    pass # Date parsing failed, keep as High

        # 3. Filter Spam (if prompt missed it)
        category = row.get("category", "").lower()
        if "spam" in category or "scam" in category:
            continue
            
        rows.append(row)

    # Sort: Exam > Assignment > Event > Announcement > Personal
    cat_order = {"exam": 1, "assignment": 2, "event": 3, "announcement": 4, "personal": 5}
    
    rows.sort(key=lambda x: (
        cat_order.get(x.get("category", "").lower(), 6),
        x.get("event_date", "9999-99-99")
    ))
    
    return rows


def _normalize_source_key(source) -> str:
    return " ".join(str(source or "").lower().split())


def _sources_allow_dedupe(n1: dict, n2: dict) -> bool:
    """
    Only treat as duplicates when summaries match AND they refer to the same course/source.
    Different classes may have similar text (e.g. final grades) — those must NOT merge.
    """
    s1, s2 = _normalize_source_key(n1.get("source")), _normalize_source_key(n2.get("source"))
    if s1 and s2:
        return s1 == s2
    if not s1 and not s2:
        return True
    return False


def _normalize_summary_key(summary) -> str:
    return " ".join(str(summary or "").lower().split())


def _normalize_event_date_key(d) -> str:
    s = str(d or "").strip().lower()
    if s in ("", "null", "none"):
        return ""
    return s


def notifications_exact_duplicate(n1: dict, n2: dict) -> bool:
    if (n1.get("category") or "").lower() != (n2.get("category") or "").lower():
        return False
    if _normalize_event_date_key(n1.get("event_date")) != _normalize_event_date_key(n2.get("event_date")):
        return False
    if _normalize_summary_key(n1.get("summary")) != _normalize_summary_key(n2.get("summary")):
        return False
    return _sources_allow_dedupe(n1, n2)


def is_similar_notification(new_notif, existing_notif, threshold=0.82):
    """Same category + same source + very similar summary → duplicate. Different source → never duplicate."""
    from difflib import SequenceMatcher

    if (new_notif.get("category") or "").lower() != (existing_notif.get("category") or "").lower():
        return False

    if not _sources_allow_dedupe(new_notif, existing_notif):
        return False

    summary1 = str(new_notif.get("summary", "")).lower().strip()
    summary2 = str(existing_notif.get("summary", "")).lower().strip()

    if not summary1 or not summary2:
        return False

    similarity = SequenceMatcher(None, summary1, summary2).ratio()
    return similarity >= threshold


def dedupe_notification_list(notifications: list[dict]) -> list[dict]:
    """Drop exact or near-duplicates within one batch (e.g. Gemini output) before upload."""
    out: list[dict] = []
    for n in notifications:
        if any(notifications_exact_duplicate(n, e) or is_similar_notification(n, e) for e in out):
            continue
        out.append(n)
    return out

def check_existing_notifications(supabase_client):
    """Fetch existing notifications from Supabase to check for duplicates"""
    try:
        response = supabase_client.table("notifications").select("summary,event_date,category,source").execute()
        return response.data  # Return full objects for similarity comparison
    except Exception as e:
        print(f"Warning: Could not fetch existing notifications: {e}", file=sys.stderr)
        return []

def upload_to_supabase(notifications: list[dict], user_id: str = None) -> bool:
    """Upload parsed notifications to Supabase with intelligent deduplication."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    # If user_id not provided, try to get from environment
    if not user_id:
        user_id = os.environ.get("USER_ID")
    
    if not supabase_url or not supabase_key:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not set. Falling back to stdout.", file=sys.stderr)
        return False
    
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Get existing notifications for deduplication
        print(f"Checking for duplicates in Supabase for user {user_id}...", file=sys.stderr)
        
        # If we have a user_id, filter by it. Otherwise try to fetch all (might fail if RLS is on)
        query = supabase.table("notifications").select("summary,event_date,category,source")
        if user_id:
            query = query.eq("user_id", user_id)
        
        response = query.execute()
        existing_notifications = response.data
        
        # Filter out duplicates and similar items
        unique_notifications = []
        duplicates_skipped = 0
        similar_skipped = 0
        
        notifications = dedupe_notification_list(notifications)

        for notif in notifications:
            # Attach user_id to the notification
            if user_id:
                notif["user_id"] = user_id
                
            is_duplicate = False
            
            # Check against all existing notifications
            for existing in existing_notifications:
                # Exact match check (normalized; includes source/course)
                if notifications_exact_duplicate(notif, existing):
                    is_duplicate = True
                    duplicates_skipped += 1
                    break
                
                # Similarity check (same source only)
                if is_similar_notification(notif, existing):
                    is_duplicate = True
                    similar_skipped += 1
                    break

            # Also skip if duplicate of another row already accepted in this upload batch
            if not is_duplicate:
                for prior in unique_notifications:
                    if notifications_exact_duplicate(notif, prior) or is_similar_notification(notif, prior):
                        is_duplicate = True
                        similar_skipped += 1
                        break
            
            if not is_duplicate:
                unique_notifications.append(notif)
        
        if duplicates_skipped > 0:
            print(f"Skipped {duplicates_skipped} exact duplicate(s).", file=sys.stderr)
        if similar_skipped > 0:
            print(f"Skipped {similar_skipped} similar notification(s).", file=sys.stderr)
        
        if not unique_notifications:
            print("No new notifications to upload.", file=sys.stderr)
            return True
        
        print(f"Uploading {len(unique_notifications)} new notifications to Supabase...", file=sys.stderr)
        supabase.table("notifications").insert(unique_notifications).execute()
        print("Successfully uploaded notifications to Supabase.", file=sys.stderr)
        return True
        
    except Exception as e:
        print(f"Error uploading to Supabase: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Parse student notifications with LLM")
    parser.add_argument("--text", type=str, help="Raw notification text (otherwise read from stdin)")
    parser.add_argument("--dry-run", action="store_true", help="Print prompt and sample output; no API call")
    parser.add_argument("--format", choices=["table", "lines", "json"], default="table", help="Output format")
    args = parser.parse_args()

    if args.text is not None:
        user_text = args.text
    else:
        user_text = sys.stdin.read().strip()

    if not user_text:
        print("No input text. Use --text '...' or pipe input.", file=sys.stderr)
        sys.exit(1)

    if args.dry_run:
        today_str = datetime.now().strftime("%Y-%m-%d")
        print("=== System prompt (first 5 lines) ===")
        print("\n".join(SYSTEM_PROMPT_TEMPLATE.format(today=today_str).split("\n")[:5]) + "\n...")
        print("\n=== User text ===")
        print(user_text)
        print("\n=== Expected output format (example) ===")
        print(" | ".join(COLUMNS))
        print(" | ".join(COLUMNS))
        print("Canvas | assignment | 2023-02-03 | 11:59 PM | High | https://canvas.ucsd.edu/assign/3 | Assignment 3 for CSE 110 due.")
        return

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Set GOOGLE_API_KEY or GEMINI_API_KEY in .env or your environment, or use --dry-run.", file=sys.stderr)
        sys.exit(1)

    raw_output = call_llm(user_text)
    notifications = dedupe_notification_list(parse_llm_output(raw_output))

    # Arguments usage: if user specifically asked for 'json' or 'lines' output, we probably shouldn't SILENTLY upload to Supabase?
    # But for this task, the primary goal is Supabase integration.
    # Let's try to upload first.
    uploaded = upload_to_supabase(notifications)
    
    # If upload failed or not configured, fall back to requested format
    if not uploaded:
        if args.format == "table":
            if not notifications:
                 print(" | ".join(COLUMNS))
                 print("(no notifications parsed)")
            else:
                 col_widths = [max(len(str(n.get(c, ""))) for n in notifications) for c in COLUMNS]
                 col_widths = [max(w, len(c)) for w, c in zip(col_widths, COLUMNS)]
                 header = " | ".join(c.ljust(col_widths[i]) for i, c in enumerate(COLUMNS))
                 print(header)
                 print("-" * len(header))
                 for n in notifications:
                     print(" | ".join(str(n.get(c, "") or "").ljust(col_widths[i]) for i, c in enumerate(COLUMNS)))
        elif args.format == "lines":
            for n in notifications:
                print(" | ".join(str(n.get(c, "") or "") for c in COLUMNS))
        elif args.format == "json":
            import json
            print(json.dumps(notifications, indent=2))

if __name__ == "__main__":
    main()
