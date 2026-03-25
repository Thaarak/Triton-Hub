# Google Authentication Setup Guide

## ✅ Current Configuration

### Backend Configuration
- **Flask Backend Port**: 5328
- **Redirect URI**: `http://localhost:5328/api/auth/google/callback`
- **Frontend URL**: `http://localhost:3000`

### Environment Variables (flask_backend/.env)
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
FLASK_SECRET_KEY=YOUR_FLASK_SECRET_KEY
```

## 🔧 Google Cloud Console Setup

### Required Steps:

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Navigate to APIs & Services > Credentials**

3. **Configure OAuth Consent Screen** (if not done):
   - User Type: External (or Internal if you have a Google Workspace)
   - App name: Triton Hub
   - User support email: Your email
   - Authorized domains: (leave empty for localhost testing)
   - Developer contact: Your email

4. **Create or Update OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: Triton Hub
   
   **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   http://localhost:5328
   ```
   
   **Authorized redirect URIs:**
   ```
   http://localhost:5328/api/auth/google/callback
   ```

5. **Download credentials** or verify they match your .env file

## 🚀 Running the Application

### Terminal 1 - Flask Backend:
```bash
cd flask_backend
python app.py
```
The backend should start on `http://localhost:5328`

### Terminal 2 - Next.js Frontend:
```bash
npm run dev
```
The frontend should start on `http://localhost:3000`

## 🔄 OAuth Flow

1. User clicks "Sign in with Google" on `/login`
2. Frontend redirects to: `/api/flask/auth/google/login`
3. Next.js proxy forwards to: `http://localhost:5328/api/auth/google/login`
4. Flask redirects to Google OAuth consent page
5. User approves
6. Google redirects to: `http://localhost:5328/api/auth/google/callback`
7. Flask stores credentials in session and redirects to: `http://localhost:3000`
8. User is back on frontend with authenticated session

## 🔍 Testing the Flow

1. Make sure both servers are running
2. Go to `http://localhost:3000/login`
3. Click "Sign in with Google"
4. You should see Google's consent screen
5. After approval, you should be redirected back to `http://localhost:3000`
6. Check auth status: `http://localhost:5328/api/auth/google/me` (should return user info)

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"
- Verify the redirect URI in Google Cloud Console exactly matches:
  `http://localhost:5328/api/auth/google/callback`
- Make sure there are no trailing slashes

### Error: "CORS" or "Network error"
- Ensure Flask backend is running on port 5328
- Check Next.js proxy in `next.config.ts`
- Verify CORS is enabled in Flask (already configured)

### Session not persisting
- Ensure `credentials: 'include'` is set in frontend fetch calls
- Check FLASK_SECRET_KEY is set in .env
- Verify cookies are being set (check browser DevTools > Application > Cookies)

## 📝 API Endpoints

- `GET /api/auth/google/login` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Handles OAuth callback from Google
- `GET /api/auth/google/me` - Returns current user info if authenticated
