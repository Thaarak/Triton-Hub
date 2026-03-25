import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type GmailMessageList = { messages?: { id: string }[] };

type GmailMessage = {
  id: string;
  snippet?: string;
  payload?: { headers?: { name: string; value: string }[] };
};

function headerFromPayload(msg: GmailMessage, name: string): string {
  const headers = msg.payload?.headers;
  if (!headers) return "";
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return typeof data.access_token === "string" ? data.access_token : null;
}

async function fetchInboxWithAccessToken(accessToken: string) {
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=25",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) {
    return { ok: false as const, status: listRes.status, emails: [] as EmailRow[] };
  }
  const listData = (await listRes.json()) as GmailMessageList;
  const ids = (listData.messages ?? []).map((m) => m.id).filter(Boolean);
  if (ids.length === 0) {
    return { ok: true as const, status: 200, emails: [] as EmailRow[] };
  }

  const details = await Promise.all(
    ids.map(async (id) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!r.ok) return null;
      return (await r.json()) as GmailMessage;
    })
  );

  const emails: EmailRow[] = [];
  for (const msg of details) {
    if (!msg?.id) continue;
    emails.push({
      id: msg.id,
      snippet: msg.snippet ?? "",
      subject: headerFromPayload(msg, "Subject"),
      from: headerFromPayload(msg, "From"),
      date: headerFromPayload(msg, "Date") || null,
    });
  }
  return { ok: true as const, status: 200, emails };
}

type EmailRow = {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string | null;
};

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore when called from route without mutable cookies
          }
        },
      },
    }
  );

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return NextResponse.json({ emails: [] }, { status: 401 });
  }

  let accessToken = session.provider_token ?? null;
  const sessionRefresh = session.provider_refresh_token ?? null;

  if (!accessToken && sessionRefresh) {
    accessToken = await refreshGoogleAccessToken(sessionRefresh);
  }

  if (!accessToken) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("google_refresh_token")
      .eq("id", session.user.id)
      .maybeSingle();
    const stored = profile?.google_refresh_token?.trim();
    if (stored) {
      accessToken = await refreshGoogleAccessToken(stored);
    }
  }

  if (!accessToken) {
    return NextResponse.json({
      emails: [],
      error: "no_provider_token",
      message:
        "Gmail access is not available yet. Sign out and sign in with Google again (Gmail permission). In Google Cloud, add gmail.readonly to the OAuth client used by Supabase; set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on Vercel for token refresh.",
    });
  }

  let result = await fetchInboxWithAccessToken(accessToken);

  if (!result.ok && result.status === 401) {
    const altRefresh =
      sessionRefresh ||
      (
        await supabase
          .from("profiles")
          .select("google_refresh_token")
          .eq("id", session.user.id)
          .maybeSingle()
      ).data?.google_refresh_token?.trim();
    if (altRefresh) {
      const next = await refreshGoogleAccessToken(altRefresh);
      if (next) {
        result = await fetchInboxWithAccessToken(next);
      }
    }
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        emails: [],
        error: "gmail_api_error",
        message: "Could not load Gmail. Try signing out and signing in again.",
      },
      { status: 200 }
    );
  }

  return NextResponse.json({ emails: result.emails });
}
