"""
Test script to show the exact redirect URI being used
"""
import os
from dotenv import load_dotenv

load_dotenv()

PORT = 5328
BACKEND_URL = f"http://127.0.0.1:{PORT}"
REDIRECT_URI = f"{BACKEND_URL}/api/auth/google/callback"

print("=" * 60)
print("GOOGLE OAUTH CONFIGURATION")
print("=" * 60)
print(f"\nREDIRECT URI: {REDIRECT_URI}")
print(f"Length: {len(REDIRECT_URI)} characters")
print(f"Hex: {REDIRECT_URI.encode('utf-8').hex()}")
print("\n" + "=" * 60)
print("COPY THIS EXACT URI TO GOOGLE CLOUD CONSOLE:")
print("=" * 60)
print(REDIRECT_URI)
print("=" * 60)
print("\nSteps:")
print("1. Go to: https://console.cloud.google.com/apis/credentials")
print("2. Click on your OAuth 2.0 Client ID")
print("3. In 'Authorized redirect URIs', click '+ ADD URI'")
print("4. Paste EXACTLY (no spaces): http://127.0.0.1:5328/api/auth/google/callback")
print("5. Click SAVE")
print("6. Wait 30 seconds")
print("7. Go to: http://127.0.0.1:3000/login")
print("=" * 60)
