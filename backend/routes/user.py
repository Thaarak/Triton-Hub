from flask import Blueprint, jsonify, request, session

from db import get_user, update_user

user = Blueprint("user", __name__)


@user.route("/me")
def me():
    if "user" not in session:
        return jsonify({"error": "not authenticated"}), 401
    return jsonify(session["user"])


@user.route("/me", methods=["PATCH"])
def update_me():
    if "user" not in session:
        return jsonify({"error": "not authenticated"}), 401

    data = request.get_json()
    user_id = session["user"]["user_id"]

    # Only allow updating specific fields
    allowed_fields = {"canvas_token", "full_name"}
    update_data = {k: v for k, v in data.items() if k in allowed_fields}

    if not update_data:
        return jsonify({"error": "no valid fields to update"}), 400

    updated = update_user(user_id, update_data)
    session["user"] = updated
    return jsonify(updated)
