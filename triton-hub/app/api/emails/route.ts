import { gmailConfig, gmailToken } from "@/lib/gmail-server";
import { integrationUser, readCredential } from "@/lib/integrations-server";

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

async function fetchMessageList(
  accessToken: string,
  listUrl: string
): Promise<{ ok: boolean; status: number; ids: string[] }> {
  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!listRes.ok) {
    return { ok: false, status: listRes.status, ids: [] };
  }
  const listData = (await listRes.json()) as GmailMessageList;
  const ids = (listData.messages ?? []).map((m) => m.id).filter(Boolean);
  return { ok: true, status: 200, ids };
}

type InboxDebug = {
  inboxLabelCount: number;
  inboxLabelStatus: number;
  fallbackQueryCount: number | null;
  fallbackQueryStatus: number | null;
  metadataFetched: number;
  metadataSucceeded: number;
};

async function fetchInboxWithAccessToken(accessToken: string) {
  const debug: InboxDebug = {
    inboxLabelCount: 0,
    inboxLabelStatus: 0,
    fallbackQueryCount: null,
    fallbackQueryStatus: null,
    metadataFetched: 0,
    metadataSucceeded: 0,
  };

  // Try primary: INBOX label
  const inboxUrl =
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=25";
  const primary = await fetchMessageList(accessToken, inboxUrl);
  debug.inboxLabelStatus = primary.status;
  if (!primary.ok) {
    return { ok: false as const, status: primary.status, emails: [] as EmailRow[], debug };
  }
  debug.inboxLabelCount = primary.ids.length;

  let ids = primary.ids;

  // Fallback: q=is:inbox (catches non-standard inbox setups)
  if (ids.length === 0) {
    const qUrl = encodeURIComponent("is:inbox");
    const fallbackUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${qUrl}&maxResults=25`;
    const fallback = await fetchMessageList(accessToken, fallbackUrl);
    debug.fallbackQueryStatus = fallback.status;
    debug.fallbackQueryCount = fallback.ids.length;
    if (!fallback.ok) {
      return { ok: false as const, status: fallback.status, emails: [] as EmailRow[], debug };
    }
    ids = fallback.ids;
  }

  // Tertiary: recent mail (any label) — catches archived-inbox setups
  if (ids.length === 0) {
    const anyUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10";
    const anyList = await fetchMessageList(accessToken, anyUrl);
    if (anyList.ok && anyList.ids.length > 0) {
      ids = anyList.ids;
    }
  }

  if (ids.length === 0) {
    return { ok: true as const, status: 200, emails: [] as EmailRow[], debug };
  }

  debug.metadataFetched = ids.length;
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
  debug.metadataSucceeded = emails.length;
  return { ok: true as const, status: 200, emails, debug };
}

type EmailRow = {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string | null;
};

const BLOCKED_FROM_PATTERNS = [
  "noreply",
  "no-reply",
  "donotreply",
  "do-not-reply",
  "mailer-daemon",
  "notifications@github",
  "@github.com",
  "notifications@linkedin",
  "notify@twitter",
  "notify@x.com",
  "notification@instagram",
  "facebookmail.com",
  "amazonses.com",
  "bounce.",
  "postmaster@",
];

const BLOCKED_SUBJECT_PATTERNS = [
  /^\[github\]/i,
  /^\[google\]/i,
  /^\[linkedin\]/i,
  /^\[twitter\]/i,
  /^\[instagram\]/i,
  /^\[facebook\]/i,
  /^\[slack\]/i,
  /verification code/i,
  /confirm your email/i,
  /\botp\b/i,
  /one-time password/i,
  /one time password/i,
  /sign-in link/i,
  /magic link/i,
  /login attempt/i,
  /security alert/i,
  /password reset/i,
  /account recovery/i,
  /has been added to your account/i,
  /authorized to access your account/i,
  /third-party.*application/i,
  /unsubscribe/i,
];

const BLOCKED_SNIPPET_PATTERNS = [
  /unsubscribe/i,
  /opt.?out/i,
  /view in browser/i,
];

/**
 * Deterministic pre-filter — always runs, no API key needed.
 * Drops obvious automated/junk emails by sender and subject patterns.
 */
function preFilterEmails(emails: EmailRow[]): EmailRow[] {
  return emails.filter((e) => {
    const fromLower = (e.from || "").toLowerCase();
    if (BLOCKED_FROM_PATTERNS.some((p) => fromLower.includes(p))) return false;

    const subject = e.subject || "";
    if (BLOCKED_SUBJECT_PATTERNS.some((p) => p.test(subject))) return false;

    const snippet = e.snippet || "";
    if (BLOCKED_SNIPPET_PATTERNS.some((p) => p.test(snippet))) return false;

    return true;
  });
}

/**
 * Uses Gemini Flash to filter the email list down to only items relevant to a student:
 * professor/TA messages, course updates, academic deadlines, career/internship emails, etc.
 * Verification codes, newsletters, promotions, and automated receipts are discarded.
 * Falls back to returning all emails unchanged if GEMINI_API_KEY is not set or the call fails.
 */
export async function GET() {
  const user = await integrationUser();
  if (!user) return Response.json({ emails: [] }, { status: 401 });
  const headers = { "Cache-Control": "private, no-store" };
  if (!gmailConfig()) return Response.json({ emails: [] }, { headers });
  try {
    const refresh = await readCredential(user.id, "gmail");
    if (!refresh) return Response.json({ emails: [] }, { headers });
    const token = await gmailToken({ grant_type: "refresh_token", refresh_token: refresh });
    if (token?.access_token) {
      const result = await fetchInboxWithAccessToken(token.access_token);
      if (result.ok) return Response.json({ emails: preFilterEmails(result.emails) }, { headers });
    }
  } catch {
    // Keep Canvas and calendar available if Gmail cannot refresh.
  }
  return Response.json({
    emails: [], error: "gmail_api_error", message: "Could not load Gmail. Reconnect Gmail in Settings.",
  }, { headers });
}
