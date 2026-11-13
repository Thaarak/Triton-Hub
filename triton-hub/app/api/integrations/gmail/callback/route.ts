import { type NextRequest, NextResponse } from "next/server";
import { gmailCallbackUrl, gmailConsentCookie, gmailToken } from "@/lib/gmail-server";
import { integrationUser, writeCredential } from "@/lib/integrations-server";

export async function GET(request: NextRequest) {
  const redirect = (result: "connected" | "failed") => {
    const response = NextResponse.redirect(new URL(`/settings?gmail=${result}`, gmailCallbackUrl(request)));
    response.cookies.set(gmailConsentCookie, "", { path: "/api/integrations/gmail/callback", maxAge: 0 });
    return response;
  };
  const user = await integrationUser();
  const [userId, state, verifier] = (request.cookies.get(gmailConsentCookie)?.value ?? "").split(".");
  const code = request.nextUrl.searchParams.get("code");
  if (!user || user.id !== userId || !state || !verifier || state !== request.nextUrl.searchParams.get("state") || !code) {
    return redirect("failed");
  }
  try {
    const token = await gmailToken({
      grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: gmailCallbackUrl(request),
    });
    if (!token?.refresh_token || !token.scope?.split(" ").includes("https://www.googleapis.com/auth/gmail.readonly")) {
      return redirect("failed");
    }
    await writeCredential(user.id, "gmail", token.refresh_token);
    return redirect("connected");
  } catch {
    return redirect("failed");
  }
}
