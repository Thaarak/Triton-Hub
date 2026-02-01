import os
import sys
import uuid
from flask import Blueprint, redirect, request, session, url_for
from itsdangerous import URLSafeTimedSerializer
import google_auth_oauthlib.flow
from supabase import create_client

# Add parent directory to path to import sync modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sync_service import perform_full_sync

google_auth = Blueprint("google_auth", __name__, url_prefix="/auth/google")

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")],
    }
}

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly", 
    "https://www.googleapis.com/auth/userinfo.email", 
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid"
]

@google_auth.route("/")
def authorize():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES
    )
    # Force the redirect URI to match exactly what is in the console/env
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")
    flow.redirect_uri = redirect_uri
    
    print(f"DEBUG: Redirecting to Google with URI: {redirect_uri}")

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
    # Match the redirect_uri exactly
    flow.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8080/auth/google/callback")

    flow.fetch_token(authorization_response=request.url)

    credentials = flow.credentials
    creds_dict = {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": list(credentials.scopes),
    }
    session["google_credentials"] = creds_dict

    # 1. Get user info from Google
    from googleapiclient.discovery import build
    service = build('oauth2', 'v2', credentials=credentials)
    user_info = service.userinfo().get().execute()
    user_email = user_info.get("email")
    full_name = user_info.get("name")
    google_id = user_info.get("id")

    # 2. Sync with Supabase logic
    user_id = None
    has_canvas_token = False
    profile_found = False  # True = existing profile in Supabase → dashboard; False → setup for Canvas token

    print(f"DEBUG: Handling sync for email: {user_email}")

    try:
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")  # service_role
        if not supabase_url or not supabase_key:
            print("DEBUG CRITICAL: SUPABASE_URL or SUPABASE_KEY not set.")
            raise ValueError("Supabase not configured")
        supabase = create_client(supabase_url, supabase_key)

        # A. Try to find existing profile by exact email match
        print(f"DEBUG: Querying profiles table for {user_email}...")
        res = supabase.table("profiles").select("id, canvas_token").eq("email", user_email).execute()

        if res.data and len(res.data) > 0:
            profile_found = True
            user_id = res.data[0]["id"]
            canv_tok = res.data[0].get("canvas_token")
            has_canvas_token = bool(canv_tok and canv_tok.strip())
            print(f"DEBUG: Found existing profile! ID: {user_id} → sending to dashboard.")
        else:
            print(f"DEBUG: No profile found for {user_email}. Attempting to locate or create user...")
            # B. Attempt to find the user in Supabase Auth via email search (admin)
            try:
                # list_users returns paginated result; get enough pages to find by email
                ulist = []
                users_res = supabase.auth.admin.list_users(params={"per_page": 1000})
                if isinstance(users_res, list):
                    ulist = users_res
                elif hasattr(users_res, "users"):
                    ulist = users_res.users or []
                elif hasattr(users_res, "data"):
                    data = users_res.data
                    ulist = data.get("users", data.users if hasattr(data, "users") else []) if isinstance(data, dict) else (getattr(data, "users", None) or [])
                # Handle list of user objects (may have .email/.id or ["email"]/["id"])
                for u in ulist:
                    em = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
                    if em and str(em).lower() == user_email.lower():
                        user_id = getattr(u, "id", None) or (u.get("id") if isinstance(u, dict) else None)
                        if user_id:
                            print(f"DEBUG: Found existing auth.user ID: {user_id}")
                            break
                
                # C. If still no user_id, create the user in Auth
                if not user_id:
                    print("DEBUG: User totally new. Creating in Auth...")
                    new_user_res = supabase.auth.admin.create_user({
                        "email": user_email,
                        "password": str(uuid.uuid4())[:16],
                        "email_confirm": True,
                        "user_metadata": {"full_name": full_name},
                    })
                    # Extract ID from result: response has .user.id or .data or dict with user.id
                    uobj = getattr(new_user_res, "user", None) or (new_user_res.get("user") if isinstance(new_user_res, dict) else None)
                    if uobj is not None:
                        user_id = getattr(uobj, "id", None) or (uobj.get("id") if isinstance(uobj, dict) else None)
                    if not user_id and hasattr(new_user_res, "data"):
                        d = new_user_res.data
                        user_id = getattr(d, "id", None) or (d.get("id") if isinstance(d, dict) else None)
                    print(f"DEBUG: Created new Auth user ID: {user_id}")

                # D. Create or update the public profile record
                if user_id:
                    print(f"DEBUG: Creating/updating public.profile for {user_id}...")
                    supabase.table("profiles").upsert(
                        {"id": user_id, "email": user_email, "full_name": full_name or ""},
                        on_conflict="id",
                    ).execute()
            except Exception as auth_inner:
                print(f"DEBUG ERROR during Auth/Profile setup: {auth_inner}")
                import traceback
                traceback.print_exc()

        # Final storage in session
        session["user_id"] = user_id
        session["user_email"] = user_email
        
        # Trigger sync if user is ready
        if user_id and has_canvas_token:
            print(f"🚀 User {user_email} is ready. Triggering sync mission.")
            try:
                perform_full_sync(creds_dict)
            except Exception as sync_e:
                print(f"DEBUG WARNING: Sync failed but login continues: {sync_e}")

    except Exception as e:
        print(f"DEBUG CRITICAL FAULT: {e}")

    # --- FINAL REDIRECT ---
    base_f = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    uid = session.get("user_id")

    if not uid or str(uid) == "None":
        print("❌ AUTH FLOW FAILED: No user ID identified.")
        return redirect(f"{base_f}/login?error=auth_failed")

    # Profile found in Supabase → dashboard with token so frontend can load profile; else → setup for Canvas token
    if profile_found:
        secret = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")
        serializer = URLSafeTimedSerializer(secret, salt="oauth-redirect")
        one_time_token = serializer.dumps({"user_id": uid, "email": session.get("user_email", "")})
        redirect_url = f"{base_f}/home?t={one_time_token}"
        print(f"⭐ Profile found: Sending {user_email} to Dashboard with token.")
        return redirect(redirect_url)
    else:
        print(f"📝 New/updated profile: Sending {user_email} to Setup for Canvas token.")
        return redirect(f"{base_f}/setup?user_id={uid}")
