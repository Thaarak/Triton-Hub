from flask import Blueprint, jsonify, session

user_auth = Blueprint("user_auth", __name__, url_prefix="/auth")


@user_auth.route("/signup", methods=["POST"])
def signup():
    # TODO: Accept email + password from request body
    # TODO: Hash the password
    # TODO: Store user in database
    # TODO: Return user info + session token
    return jsonify({"message": "signup not implemented"}), 501


@user_auth.route("/login", methods=["POST"])
def login():
    # TODO: Accept email + password from request body
    # TODO: Verify credentials against database
    # TODO: Create session / return JWT
    return jsonify({"message": "login not implemented"}), 501


@user_auth.route("/logout", methods=["POST"])
def logout():
    # TODO: Clear user session / invalidate JWT
    session.clear()
    return jsonify({"message": "logout not implemented"}), 501
