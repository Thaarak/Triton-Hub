/**
 * Small backend for Canvas OAuth token exchange.
 * The client_secret must never be sent to the browser, so the code-for-token
 * exchange happens here.
 *
 * Required env (or .env): CANVAS_CLIENT_ID, CANVAS_CLIENT_SECRET, CANVAS_BASE_URL, OAUTH_REDIRECT_URI
 * For UCSD: get a Developer Key from your institution admin, then add the redirect URI
 * (e.g. http://localhost:5173/oauth/callback) in the key settings.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT ?? 3001;
const CANVAS_BASE_URL = (process.env.CANVAS_BASE_URL ?? 'https://canvas.ucsd.edu').replace(/\/$/, '');
const CLIENT_ID = process.env.CANVAS_CLIENT_ID;
const CLIENT_SECRET = process.env.CANVAS_CLIENT_SECRET;
const REDIRECT_URI = process.env.OAUTH_REDIRECT_URI ?? 'http://localhost:5173/oauth/callback';

const oauthConfigured = Boolean(CLIENT_ID && CLIENT_SECRET);

app.get('/api/oauth/config', (_req, res) => {
  if (!oauthConfigured) {
    return res.status(503).json({
      configured: false,
      message: 'OAuth is not configured. Set CANVAS_CLIENT_ID, CANVAS_CLIENT_SECRET, and OAUTH_REDIRECT_URI.',
    });
  }
  res.json({
    configured: true,
    clientId: CLIENT_ID,
    canvasBaseUrl: CANVAS_BASE_URL,
    redirectUri: REDIRECT_URI,
  });
});

app.post('/api/oauth/token', async (req, res) => {
  if (!oauthConfigured) {
    return res.status(503).json({ error: 'OAuth not configured' });
  }
  const { code, redirect_uri } = req.body;
  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' });
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri,
    code,
  });

  try {
    const tokenRes = await fetch(`${CANVAS_BASE_URL}/login/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({
        error: data.error ?? 'Token exchange failed',
        error_description: data.error_description,
      });
    }
    res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user: data.user,
      canvas_base_url: CANVAS_BASE_URL,
    });
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Token exchange failed' });
  }
});

app.listen(PORT, () => {
  console.log(`OAuth server http://localhost:${PORT}`);
  if (!oauthConfigured) {
    console.log('OAuth not configured. Set CANVAS_CLIENT_ID, CANVAS_CLIENT_SECRET, OAUTH_REDIRECT_URI (and optionally CANVAS_BASE_URL).');
  }
});
