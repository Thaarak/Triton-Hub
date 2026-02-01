"""Quick test: fetch and print all Canvas info for a user."""

import json
from canvas_api import fetch_canvas_info

if __name__ == "__main__":
    result = fetch_canvas_info(user_id="test_user")
    print(json.dumps(result, indent=2, default=str))
