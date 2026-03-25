"""
Profile Routes Module
Handles user profile operations including fetching, updating, and Canvas token management.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from flask import Blueprint, jsonify, request, session
from supabase import create_client
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired


profile = Blueprint("profile", __name__)

SESSION_BEARER_SALT = "session-bearer"
SESSION_TOKEN_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def get_supabase_client():
    """Initialize and return Supabase client."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    return create_client(supabase_url, supabase_key)


def _session_token_serializer():
    secret = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")
    return URLSafeTimedSerializer(secret, salt=SESSION_BEARER_SALT)


def _profile_response_dict(profile_data, *, include_canvas_secret: bool):
    """Return a copy safe for JSON; optionally strip canvas_token."""
    out = dict(profile_data)
    if not include_canvas_secret and "canvas_token" in out:
        out["has_canvas_token"] = bool(out.get("canvas_token"))
        del out["canvas_token"]
    return out


def resolve_user_id_from_request():
    """
    Resolve user id from Bearer session token or Flask session.
    Returns (user_id, None) on success, or (None, (response, status_code)) on failure.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        raw = auth_header[7:].strip()
        if raw:
            try:
                data = _session_token_serializer().loads(raw, max_age=SESSION_TOKEN_MAX_AGE)
                user_id = data.get("user_id")
                if user_id:
                    return user_id, None
            except SignatureExpired:
                return None, (jsonify({"error": "Session expired"}), 401)
            except BadSignature:
                return None, (jsonify({"error": "Invalid token"}), 401)
            except Exception as e:
                print(f"[profile] Bearer token error: {str(e)}")
                return None, (jsonify({"error": "Invalid token"}), 401)
    user_id = session.get("user_id")
    if user_id:
        return user_id, None
    return None, (jsonify({"error": "Not authenticated"}), 401)


@profile.route("/notifications", methods=["GET"])
def list_notifications():
    """List notifications for the authenticated user (Bearer or Flask session)."""
    user_id, err = resolve_user_id_from_request()
    if err:
        return err[0], err[1]
    try:
        supabase = get_supabase_client()
        res = (
            supabase.table("notifications")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return jsonify(res.data or []), 200
    except Exception as e:
        print(f"[profile] list_notifications: {str(e)}")
        return jsonify({"error": "Failed to fetch notifications"}), 500


@profile.route("/notifications", methods=["POST"])
def create_notification():
    """Body: source, category, event_date, event_time, urgency, link, summary (matches frontend CreateNotificationInput)."""
    user_id, err = resolve_user_id_from_request()
    if err:
        return err[0], err[1]
    data = request.get_json(silent=True) or {}
    row = {
        "user_id": user_id,
        "source": data.get("source", ""),
        "category": data.get("category", "event"),
        "event_date": data.get("event_date") or "EMPTY",
        "event_time": data.get("event_time") or "EMPTY",
        "urgency": data.get("urgency", "medium"),
        "link": data.get("link") or "EMPTY",
        "summary": data.get("summary", ""),
    }
    if not row["summary"]:
        return jsonify({"error": "summary is required"}), 400
    try:
        supabase = get_supabase_client()
        res = supabase.table("notifications").insert(row).select().execute()
        if res.data and len(res.data) > 0:
            return jsonify(res.data[0]), 201
        return jsonify({"error": "Failed to create notification"}), 500
    except Exception as e:
        print(f"[profile] create_notification: {str(e)}")
        return jsonify({"error": "Failed to create notification"}), 500


@profile.route("/notifications", methods=["PATCH"])
def patch_notification_completed():
    """Body: { \"id\": <number>, \"completed\": <bool> }"""
    user_id, err = resolve_user_id_from_request()
    if err:
        return err[0], err[1]
    data = request.get_json(silent=True) or {}
    notif_id = data.get("id")
    completed = data.get("completed")
    if notif_id is None or completed is None:
        return jsonify({"error": "id and completed are required"}), 400
    try:
        notif_id = int(notif_id)
    except (TypeError, ValueError):
        return jsonify({"error": "invalid id"}), 400
    try:
        supabase = get_supabase_client()
        res = (
            supabase.table("notifications")
            .update({"completed": bool(completed)})
            .eq("id", notif_id)
            .eq("user_id", user_id)
            .select()
            .execute()
        )
        if res.data and len(res.data) > 0:
            return jsonify(res.data[0]), 200
        return jsonify({"error": "Notification not found"}), 404
    except Exception as e:
        print(f"[profile] patch_notification: {str(e)}")
        return jsonify({"error": "Failed to update notification"}), 500


@profile.route("/me", methods=["GET"])
def get_profile():
    """
    Get the current user's profile.
    Auth: Authorization Bearer (session token), ?t= one-time OAuth token, or Flask session.
    """
    one_time_token = request.args.get("t")
    auth_header = request.headers.get("Authorization", "")
    user_id = None
    used_one_time = False

    if auth_header.startswith("Bearer "):
        raw = auth_header[7:].strip()
        if raw:
            try:
                data = _session_token_serializer().loads(raw, max_age=SESSION_TOKEN_MAX_AGE)
                user_id = data.get("user_id")
            except SignatureExpired:
                return jsonify({"error": "Session expired"}), 401
            except BadSignature:
                return jsonify({"error": "Invalid token"}), 401
            except Exception as e:
                print(f"[profile] Bearer token error: {str(e)}")
                return jsonify({"error": "Invalid token"}), 401
    elif one_time_token:
        try:
            secret = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key")
            serializer = URLSafeTimedSerializer(secret, salt="oauth-redirect")
            data = serializer.loads(one_time_token, max_age=300)
            user_id = data.get("user_id")
            used_one_time = True
            if not user_id:
                return jsonify({"error": "Invalid token"}), 400
        except SignatureExpired:
            return jsonify({"error": "Token expired"}), 400
        except BadSignature:
            return jsonify({"error": "Invalid token"}), 400
        except Exception as e:
            print(f"[profile] One-time token error: {str(e)}")
            return jsonify({"error": "Token verification failed"}), 400
    else:
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"error": "Not authenticated"}), 401

    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        supabase = get_supabase_client()
        res = supabase.table("profiles").select("*").eq("id", user_id).execute()

        if res.data and len(res.data) > 0:
            profile_data = res.data[0]

            if used_one_time:
                # First hop from OAuth: allow canvas_token for client setup; issue API session token
                out = dict(profile_data)
                session_token = _session_token_serializer().dumps({"user_id": str(user_id)})
                out["session_token"] = session_token
                return jsonify(out), 200

            # Bearer or Flask session: do not expose raw canvas_token
            include_secret = False
            safe = _profile_response_dict(profile_data, include_canvas_secret=include_secret)
            return jsonify(safe), 200

        return jsonify({"error": "Profile not found"}), 404

    except Exception as e:
        print(f"[profile] Error fetching profile: {str(e)}")
        return jsonify({"error": "Failed to fetch profile"}), 500


@profile.route("/me", methods=["PUT"])
def update_profile():
    """
    Update the current user's profile information.
    Accepts: full_name, canvas_token, avatar_url (if column exists)
    """
    user_id, err = resolve_user_id_from_request()
    if err:
        return err[0], err[1]

    try:
        data = request.get_json(silent=True) or {}
        update_data = {}

        if "full_name" in data:
            update_data["full_name"] = data["full_name"]
        if "canvas_token" in data:
            update_data["canvas_token"] = data["canvas_token"]
        if "avatar_url" in data:
            # Backward compatible: only write avatar_url when schema includes that column.
            supabase = get_supabase_client()
            current = supabase.table("profiles").select("*").eq("id", user_id).limit(1).execute()
            row = current.data[0] if current.data else {}
            if isinstance(row, dict) and "avatar_url" in row:
                update_data["avatar_url"] = data["avatar_url"]

        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400

        supabase = get_supabase_client()
        res = supabase.table("profiles").update(update_data).eq("id", user_id).execute()

        if res.data:
            return jsonify({"message": "Profile updated successfully", "profile": res.data[0]}), 200
        return jsonify({"error": "Failed to update profile"}), 500

    except Exception as e:
        print(f"[profile] Error updating profile: {str(e)}")
        return jsonify({"error": "Failed to update profile"}), 500


@profile.route("/canvas-token", methods=["POST"])
def update_canvas_token():
    """
    Update the user's Canvas API token.
    Expects: {"canvas_token": "your_token_here"}
    """
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        data = request.get_json()
        canvas_token = data.get("canvas_token")

        if not canvas_token:
            return jsonify({"error": "Canvas token is required"}), 400

        supabase = get_supabase_client()
        res = supabase.table("profiles").update({"canvas_token": canvas_token}).eq("id", user_id).execute()

        if res.data:
            return jsonify({"message": "Canvas token updated successfully"}), 200
        return jsonify({"error": "Failed to update Canvas token"}), 500

    except Exception as e:
        print(f"[profile] Error updating Canvas token: {str(e)}")
        return jsonify({"error": "Failed to update Canvas token"}), 500


@profile.route("/canvas-token", methods=["DELETE"])
def remove_canvas_token():
    """
    Remove the user's Canvas API token.
    """
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    try:
        supabase = get_supabase_client()
        res = supabase.table("profiles").update({"canvas_token": None}).eq("id", user_id).execute()

        if res.data:
            return jsonify({"message": "Canvas token removed successfully"}), 200
        return jsonify({"error": "Failed to remove Canvas token"}), 500

    except Exception as e:
        print(f"[profile] Error removing Canvas token: {str(e)}")
        return jsonify({"error": "Failed to remove Canvas token"}), 500
