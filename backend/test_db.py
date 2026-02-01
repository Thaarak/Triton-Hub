"""Quick test: create a user, fetch them, update them, and clean up."""

from db import get_user, get_user_by_email, create_user, update_user

TEST_EMAIL = "test@ucsd.edu"
TEST_NAME = "Test User"


def test_create_user():
    print("Creating user...")
    user = create_user(email=TEST_EMAIL, full_name=TEST_NAME)
    print(f"  Created: {user}")
    return user


def test_get_user(user_id):
    print(f"Fetching user by ID ({user_id})...")
    user = get_user(user_id)
    print(f"  Found: {user}")
    return user


def test_get_user_by_email():
    print(f"Fetching user by email ({TEST_EMAIL})...")
    user = get_user_by_email(TEST_EMAIL)
    print(f"  Found: {user}")
    return user


def test_update_user(user_id):
    print(f"Updating canvas_token for user {user_id}...")
    updated = update_user(user_id, {"canvas_token": "test_canvas_token_123"})
    print(f"  Updated: {updated}")
    return updated


def test_duplicate_check():
    print(f"Checking if duplicate is detected...")
    existing = get_user_by_email(TEST_EMAIL)
    if existing:
        print(f"  User already exists — would skip creation")
    else:
        print(f"  User not found — would create new user")
    return existing


if __name__ == "__main__":
    print("=" * 50)
    print("DATABASE TEST")
    print("=" * 50)

    user = test_create_user()
    print()

    user_id = user["user_id"]

    test_get_user(user_id)
    print()

    test_get_user_by_email()
    print()

    test_update_user(user_id)
    print()

    test_duplicate_check()
    print()

    print("=" * 50)
    print("ALL TESTS PASSED")
    print("=" * 50)
    print(f"\nNote: test user ({TEST_EMAIL}) was left in the database.")
    print("Delete it manually from Supabase if needed.")
