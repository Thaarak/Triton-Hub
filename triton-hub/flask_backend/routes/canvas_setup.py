from flask import Blueprint, jsonify, session, request
import os
import requests

canvas_setup = Blueprint("canvas_setup", __name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://eorcjtcaxonmrohyrxnt.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service role key needed

@canvas_setup.route("/save-token", methods=["POST"])
def save_canvas_token():
    """Save Canvas token to Supabase and Flask session"""
    if "user_info" not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    canvas_token = data.get("canvas_token")
    
    if not canvas_token:
        return jsonify({"error": "Canvas token required"}), 400
    
    user_email = session["user_info"]["email"]
    user_name = session["user_info"].get("name", user_email.split('@')[0])
    
    # Use service role key to bypass RLS
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # Check if profile exists
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{user_email}",
            headers=headers
        )
        
        if response.status_code == 200:
            profiles = response.json()
            
            if profiles:
                # Update existing profile
                update_response = requests.patch(
                    f"{SUPABASE_URL}/rest/v1/profiles?email=eq.{user_email}",
                    headers=headers,
                    json={"canvas_token": canvas_token}
                )
                
                if update_response.status_code not in [200, 204]:
                    return jsonify({"error": "Failed to update profile"}), 500
            else:
                # Create new profile
                insert_response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/profiles",
                    headers=headers,
                    json={
                        "email": user_email,
                        "full_name": user_name,
                        "canvas_token": canvas_token
                    }
                )
                
                if insert_response.status_code not in [200, 201]:
                    return jsonify({"error": "Failed to create profile"}), 500
        
        # Also save to Flask session
        session["canvas_token"] = canvas_token
        session["canvas_url"] = "https://canvas.ucsd.edu"
        
        return jsonify({"success": True, "message": "Canvas token saved"})
        
    except Exception as e:
        print(f"Error saving Canvas token: {e}")
        return jsonify({"error": str(e)}), 500
