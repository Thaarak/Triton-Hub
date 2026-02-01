import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# ──────────────────────────────────────────────
# Users
# ──────────────────────────────────────────────

def get_user_by_email(email):
    response = supabase.table("users").select("*").eq("email", email).execute()
    return response.data[0] if response.data else None


def get_user(user_id):
    response = supabase.table("users").select("*").eq("user_id", user_id).execute()
    return response.data[0] if response.data else None


def create_user(email, full_name, canvas_token=""):
    user_data = {
        "email": email,
        "full_name": full_name,
        "canvas_token": canvas_token,
    }
    response = supabase.table("users").insert(user_data).execute()
    return response.data[0] if response.data else None


def update_user(user_id, user_data):
    response = supabase.table("users").update(user_data).eq("user_id", user_id).execute()
    return response.data[0] if response.data else None


# ──────────────────────────────────────────────
# Items
# ──────────────────────────────────────────────

def get_items(user_id):
    response = supabase.table("items").select("*").eq("user_id", user_id).execute()
    return response.data


def get_item(item_id):
    response = supabase.table("items").select("*").eq("id", item_id).execute()
    return response.data[0] if response.data else None


def create_item(item_data):
    response = supabase.table("items").insert(item_data).execute()
    return response.data[0] if response.data else None


def update_item(item_id, item_data):
    response = supabase.table("items").update(item_data).eq("id", item_id).execute()
    return response.data[0] if response.data else None


def delete_item(item_id):
    response = supabase.table("items").delete().eq("id", item_id).execute()
    return response.data
