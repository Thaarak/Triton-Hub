import { supabase } from "@/lib/supabase";

/**
 * Start the Google OAuth flow via Supabase Auth (no separate backend required).
 * Configure the Google provider + redirect URLs in the Supabase dashboard.
 */
export async function signInWithGoogle(): Promise<void> {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) throw error;
  if (data.url) {
    window.location.assign(data.url);
  }
}
