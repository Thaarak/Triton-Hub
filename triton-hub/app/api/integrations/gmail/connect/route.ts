import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { gmailCallbackUrl, gmailConfig, gmailConsentCookie } from "@/lib/gmail-server";
import { integrationUser, sameOrigin } from "@/lib/integrations-server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const user = await integrationUser();
  if (!user) return new Response(null, { status: 401 });
  const config = gmailConfig();
  if (!config) return Response.json({ error: "Gmail connection is disabled on this deployment." }, { status: 503 });
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.id, redirect_uri: gmailCallbackUrl(request), response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly", access_type: "offline", prompt: "consent",
    state, code_challenge_method: "S256", code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    ...(user.email ? { login_hint: user.email } : {}),
  }).toString();
  const response = NextResponse.json({ url: url.toString() });
  response.cookies.set(gmailConsentCookie, `${user.id}.${state}.${verifier}`, {
    httpOnly: true, sameSite: "lax", secure: new URL(gmailCallbackUrl(request)).protocol === "https:",
    path: "/api/integrations/gmail/callback", maxAge: 600,
  });
  return response;
}
