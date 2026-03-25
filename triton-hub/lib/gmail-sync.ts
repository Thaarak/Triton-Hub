import { supabase } from "@/lib/supabase";

/** Persists Google's refresh token so /api/emails works after Supabase rotates sessions. */
export async function syncGmailRefreshTokenToProfile(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const rt = session?.provider_refresh_token;
  if (!rt) return;
  await fetch("/api/profile/gmail-token", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rt }),
  }).catch(() => {});
}
