import os
import uuid

# Google may return extra scopes (e.g. openid); oauthlib otherwise raises on mismatch.
os.environ.setdefault("OAUTHLIB_RELAX_TOKEN_SCOPE", "1")

from flask import Blueprint, redirect, request, session
import google_auth_oauthlib.flow
from googleapiclient.discovery import build
from itsdangerous import URLSafeTimedSerializer
from supabase import create_client

from db import get_user_by_email, create_user
from sync_service import perform_full_sync

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
    "openid",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


@google_auth.route("/")
def authorize():
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        CLIENT_CONFIG, scopes=SCOPES
    )
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

    service = build("oauth2", "v2", credentials=credentials)
    user_info = service.userinfo().get().execute()
    user_email = user_info.get("email")
    full_name = user_info.get("name")

    user_id = None
    has_canvas_token = False

    print(f"DEBUG: Handling sync for email: {user_email}")

    try:
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        if not supabase_url or not supabase_key:
            print("DEBUG CRITICAL: SUPABASE_URL or SUPABASE_KEY not set.")
            raise ValueError("Supabase not configured")
        supabase = create_client(supabase_url, supabase_key)

        print(f"DEBUG: Querying profiles table for {user_email}...")
        res = supabase.table("profiles").select("id, canvas_token").eq("email", user_email).execute()

        if res.data and len(res.data) > 0:
            user_id = res.data[0]["id"]
            canv_tok = res.data[0].get("canvas_token")
            has_canvas_token = bool(canv_tok and canv_tok.strip())
            print(f"DEBUG: Found existing profile! ID: {user_id}")
        else:
            print(f"DEBUG: No profile found for {user_email}. Attempting to locate or create user...")
            try:
                def _find_user_id():
                    ulist = supabase.auth.admin.list_users(page=1, per_page=1000)
                    if not isinstance(ulist, list):
                        ulist = getattr(ulist, "users", None) or []
                    for u in ulist:
                        em = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
                        if em and str(em).lower() == user_email.lower():
                            uid = getattr(u, "id", None) or (u.get("id") if isinstance(u, dict) else None)
                            if uid:
                                return uid
                    return None

                user_id = _find_user_id()
                if user_id:
                    print(f"DEBUG: Found existing auth.user ID: {user_id}")

                if not user_id:
                    print("DEBUG: User totally new. Creating in Auth...")
                    try:
                        new_user_res = supabase.auth.admin.create_user({
                            "email": user_email,
                            "password": str(uuid.uuid4())[:16],
                            "email_confirm": True,
                            "user_metadata": {"full_name": full_name},
                        })
                        uobj = getattr(new_user_res, "user", None) or (new_user_res.get("user") if isinstance(new_user_res, dict) else None)
                        if uobj is not None:
                            user_id = getattr(uobj, "id", None) or (uobj.get("id") if isinstance(uobj, dict) else None)
                        if not user_id and hasattr(new_user_res, "data"):
                            d = new_user_res.data
                            user_id = getattr(d, "id", None) or (d.get("id") if isinstance(d, dict) else None)
                        print(f"DEBUG: Created new Auth user ID: {user_id}")
                    except Exception as create_e:
                        err_s = str(create_e).lower()
                        if "already" in err_s or "registered" in err_s or "exists" in err_s:
                            print("DEBUG: User already exists in Auth, re-listing...")
                            user_id = _find_user_id()
                        else:
                            raise

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

        session["user_id"] = user_id
        session["user_email"] = user_email

        if user_id and has_canvas_token:
            print(f"[sync] User {user_email} is ready. Triggering sync mission.")
            try:
                perform_full_sync(creds_dict)
            except Exception as sync_e:
                print(f"DEBUG WARNING: Sync failed but login continues: {sync_e}")

    except Exception as e:
        print(f"DEBUG CRITICAL FAULT: {e}")

    base_f = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")
    uid = session.get("user_id")

    if not uid or str(uid) == "None":
        print("[auth] AUTH FLOW FAILED: No user ID identified.")
        return redirect(f"{base_f}/login?error=auth_failed")

    # Optional: legacy users table sync (People API) — must not break login
    try:
        people_service = build("people", "v1", credentials=credentials)
        profile = people_service.people().get(
            resourceName="people/me",
            personFields="names,emailAddresses",
        ).execute()
        email = profile["emailAddresses"][0]["value"]
        pname = profile["names"][0]["displayName"]
        existing_user = get_user_by_email(email)
        if existing_user:
            session["user"] = existing_user
        else:
            new_user = create_user(email=email, full_name=pname)
            session["user"] = new_user
    except Exception as legacy_e:
        print(f"DEBUG: Optional legacy users/People sync skipped: {legacy_e}")

    secret = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")
    oauth_serializer = URLSafeTimedSerializer(secret, salt="oauth-redirect")
    redirect_token = oauth_serializer.dumps({"user_id": str(uid), "email": user_email})

    return redirect(f"{base_f}/home?t={redirect_token}")
