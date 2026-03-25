# Google Sign-In Test Instructions

## ✅ Setup Complete!

Your Google sign-in integration is now configured and ready to test.

## 🔧 What Was Fixed

1. **Frontend Login Button**: Updated the Google sign-in button URL from `/api/flask/auth/google` to `/api/flask/auth/google/login`
2. **Authentication Check**: Enhanced the main page to check both Supabase and Google authentication
3. **Backend Running**: Flask backend is running on port 5328

## 🚀 Testing Steps

### Step 1: Start the Frontend (if not already running)
Open a **new terminal** and run:
```bash
npm run dev
```

### Step 2: Verify Both Servers Are Running
- Flask Backend: http://localhost:5328 ✓ (Already running)
- Next.js Frontend: http://localhost:3000 (Start if needed)

### Step 3: Test the Google Sign-In Flow

1. **Open your browser** and go to: http://localhost:3000/login

2. **Click "Sign in with Google"** button

3. **You should see**:
   - Redirect to Google's consent screen
   - A list of permissions being requested:
     - View your email address
     - See your personal info
     - Read your Gmail messages
   
4. **Select your Google account** and approve

5. **After approval**:
   - You'll be redirected back to http://localhost:3000
   - The main dashboard should load
   - Your Google session is now active

### Step 4: Verify Authentication

Open these URLs in your browser to verify:

1. **Check user info**: http://localhost:5328/api/auth/google/me
   - Should return JSON with your user data:
   ```json
   {
     "authenticated": true,
     "user": {
       "email": "your-email@gmail.com",
       "name": "Your Name",
       "picture": "profile-pic-url",
       ...
     }
   }
   ```

2. **Check via frontend proxy**: http://localhost:3000/api/flask/auth/google/me
   - Should return the same data (proxied through Next.js)

## 🔍 Debugging

### If you see "redirect_uri_mismatch" error:

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and ensure:
- **Authorized redirect URIs** contains exactly:
  ```
  http://localhost:5328/api/auth/google/callback
  ```
- No trailing slashes
- Correct port number (5328)

### If the login button does nothing:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Click the Google sign-in button
4. Check if you see a request to `/api/flask/auth/google/login`
5. Look for any error messages in the Console tab

### If you get redirected but not authenticated:

1. Check browser cookies:
   - Open DevTools > Application > Cookies
   - Look for cookies from localhost:5328
   - Session cookie should be present

2. Check Flask logs in the terminal:
   - Look for any error messages
   - Verify the callback was successful

## 📋 Expected Flow

```
User clicks "Sign in with Google"
    ↓
Frontend redirects to: /api/flask/auth/google/login
    ↓
Next.js proxy forwards to: http://localhost:5328/api/auth/google/login
    ↓
Flask redirects to: Google OAuth consent page
    ↓
User approves permissions
    ↓
Google redirects to: http://localhost:5328/api/auth/google/callback
    ↓
Flask processes callback, stores session
    ↓
Flask redirects to: http://localhost:3000
    ↓
Frontend checks auth status
    ↓
User sees dashboard (authenticated)
```

## 🎉 Success Criteria

✅ You can click "Sign in with Google" without errors
✅ Google consent screen appears
✅ After approving, you're redirected back to the app
✅ Dashboard loads successfully
✅ `/api/auth/google/me` returns your user info
✅ Session persists when you refresh the page

## 📝 Additional Notes

- The Flask backend uses server-side sessions to store Google credentials
- The session is shared between backend and frontend via cookies
- You can sign out by clearing cookies or implementing a logout endpoint
- The current setup is for development only (HTTP, not HTTPS)

## 🔐 Security Reminder

- The `.env` file contains sensitive credentials
- Never commit `.env` to version control
- For production, use HTTPS and proper session security
- Consider implementing a logout endpoint
