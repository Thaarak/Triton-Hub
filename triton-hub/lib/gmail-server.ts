export const gmailConsentCookie = "triton_gmail_consent";

export function gmailConfig() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

export function gmailCallbackUrl(request: Request) {
  return new URL("/api/integrations/gmail/callback",
    process.env.NEXT_PUBLIC_SITE_URL || request.url).toString();
}

export async function gmailToken(params: Record<string, string>) {
  const config = gmailConfig();
  if (!config) return null;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ ...params, client_id: config.id, client_secret: config.secret }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return null;
  return await response.json() as { access_token?: string; refresh_token?: string; scope?: string };
}
