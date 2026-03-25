"""
Sync Service Module
Handles synchronization of Gmail emails and Canvas data for users.
"""
import os
from google.oauth2.credentials import Credentials
from email_api import fetch_emails_with_creds
from supabase import create_client


def perform_full_sync(creds_dict):
    """
    Performs a full synchronization of user data from Gmail and Canvas.
    
    Args:
        creds_dict: Dictionary containing OAuth credentials with keys:
                   - token: Access token
                   - refresh_token: Refresh token
                   - token_uri: Token URI
                   - client_id: OAuth client ID
                   - client_secret: OAuth client secret
                   - scopes: List of OAuth scopes
    
    Returns:
        dict: Sync results with status information
    """
    print("🔄 Starting full sync...")
    
    try:
        # Initialize Supabase client
        supabase_url = os.environ.get("SUPABASE_URL")
        supabase_key = os.environ.get("SUPABASE_KEY")
        supabase = create_client(supabase_url, supabase_key)
        
        # Create credentials object from dictionary
        creds = Credentials(
            token=creds_dict.get("token"),
            refresh_token=creds_dict.get("refresh_token"),
            token_uri=creds_dict.get("token_uri"),
            client_id=creds_dict.get("client_id"),
            client_secret=creds_dict.get("client_secret"),
            scopes=creds_dict.get("scopes")
        )
        
        # Fetch emails from Gmail
        print("📧 Fetching emails from Gmail...")
        emails = fetch_emails_with_creds(creds, max_results=50)
        print(f"✅ Fetched {len(emails)} emails")
        
        # TODO: Store emails in Supabase if needed
        # TODO: Sync Canvas data if Canvas token is available
        # TODO: Parse and categorize notifications
        
        print("✅ Full sync completed successfully")
        return {
            "success": True,
            "emails_synced": len(emails),
            "message": "Sync completed successfully"
        }
        
    except Exception as e:
        print(f"❌ Sync failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Sync failed"
        }


def sync_gmail_only(creds_dict, max_results=50):
    """
    Syncs only Gmail emails for a user.
    
    Args:
        creds_dict: Dictionary containing OAuth credentials
        max_results: Maximum number of emails to fetch (default: 50)
    
    Returns:
        list: List of email data dictionaries
    """
    try:
        creds = Credentials(
            token=creds_dict.get("token"),
            refresh_token=creds_dict.get("refresh_token"),
            token_uri=creds_dict.get("token_uri"),
            client_id=creds_dict.get("client_id"),
            client_secret=creds_dict.get("client_secret"),
            scopes=creds_dict.get("scopes")
        )
        
        emails = fetch_emails_with_creds(creds, max_results=max_results)
        return emails
        
    except Exception as e:
        print(f"❌ Gmail sync failed: {str(e)}")
        return []
