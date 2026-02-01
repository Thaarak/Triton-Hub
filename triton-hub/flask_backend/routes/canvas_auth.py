from flask import Blueprint, jsonify, request, session

canvas_auth = Blueprint("canvas_auth", __name__)

@canvas_auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or "access_token" not in data:
        return jsonify({"error": "Missing access_token"}), 400
    
    access_token = data["access_token"]
    canvas_url = data.get("canvas_url", "https://canvas.ucsd.edu")

    # Store in session for now (could be database later)
    session["canvas_token"] = access_token
    session["canvas_url"] = canvas_url
    
    return jsonify({
        "message": "Canvas token saved successfully",
        "canvas_url": canvas_url
    }), 200


@canvas_auth.route("/callback")
def callback():
    # TODO: If using Canvas OAuth2 instead of personal access tokens:
    #   - Receive authorization code from Canvas
    #   - Exchange code for access token
    #   - Store token in database linked to user
    return jsonify({"message": "canvas oauth callback not implemented"}), 501
