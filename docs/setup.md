# Set up a student workspace

The [sample dashboard](../README.md#run-the-demo-locally) runs with Node.js 24 and npm. A student workspace also needs a Supabase project and Google OAuth. Run the Next.js app from `triton-hub/`.

## Supabase and Google sign-in

1. Apply the two [migrations](../supabase/migrations/) in filename order to your Supabase database. They create profiles, notifications, and a server-only credential store. For an existing workspace, back up the database and check its schema in staging first. The second migration drops the old plaintext token columns. Existing users will need to reconnect Canvas and Gmail.
2. Create a Google OAuth web client for sign-in. In Google Cloud, allow the Supabase callback URL shown in **Supabase → Authentication → Sign In / Providers → Google**. Enter the web client ID and secret there. Basic Google sign-in uses the identity scopes `openid`, `email`, and `profile`.
3. In **Supabase → Authentication → URL Configuration**, set the Site URL to the app’s canonical origin and allow `<origin>/auth/callback`. For local development, use `http://localhost:3000/auth/callback`.
4. Copy [`.env.example`](../triton-hub/.env.example) to `triton-hub/.env.local` and fill in the public Supabase URL and anon key, the server-only service-role key, and the app’s origin. Generate `INTEGRATION_ENCRYPTION_KEY` with `openssl rand -hex 32` and keep it stable across deployments. Changing it requires reconnecting the integrations.
5. Run `npm ci` and `npm run dev`. Sign in, then create a personal access token in **UCSD Canvas → Account → Settings → New Access Token**. Paste it into Triton Hub once. The app checks the token with UCSD Canvas before saving it. You can replace or disconnect it under **Settings → Connections**. Revoke a discarded token in Canvas.

## Optional Gmail connection

For a separate Gmail consent step, create a Google OAuth web client, enable Gmail API, and allow `<origin>/api/integrations/gmail/callback` as a redirect URI. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the Next.js server. Under **Settings → Connections**, choose **Connect Gmail**. This requests `gmail.readonly` and keeps the refresh token in the encrypted store. Set the consent screen audience and test users as appropriate for the Google project. Disconnecting deletes the app’s saved token. You can also remove the app’s access from your Google account.

Email filtering uses local rules on the server. Email snippets and Canvas announcement titles are kept out of the Gemini integration in this setup.

## Data and service boundaries

- The browser receives a Supabase session. It can read and write its own workspace rows through row-level policies. The SQL test verifies that a second student cannot read or change the first student’s event.
- The server validates the session before loading a Canvas token or Gmail refresh token. It stores those tokens encrypted with AES-256-GCM in a table inaccessible to browser roles. The dashboard receives course or email data without receiving the saved credentials.
- The supported workspace uses Next.js and Supabase. The original Flask code handled a separate Google sign-in flow, Canvas and Gmail experiments, notification sync, and profile endpoints. It is retained for reference and should be left offline for this deployment.

## Deploy and verify

Set the Vercel root directory to `triton-hub`. For a live workspace, configure the same environment variables and matching OAuth callbacks before deploying. For a standalone portfolio demo, leave Supabase and integration variables unset.

In staging, test basic Google sign-in, connect Canvas with a test account, confirm assignments render, save a calendar event, reload, and confirm it persists. If Gmail is enabled, verify that it remains disconnected after sign-in and only loads mail after separate consent. Run [the SQL ownership test](../supabase/tests/workspace.sql) on a disposable migrated database as `postgres`.

If the auth provider fails, the landing page and sample dashboard remain usable. Verify both after deploying and keep the previous app/database backup available for rollback.
