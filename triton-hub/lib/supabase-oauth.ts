import { supabase } from "@/lib/supabase";

export async function signInWithGoogle(): Promise<void> {
  const status = await fetch("/api/auth/status", { cache: "no-store" });
  if (!status.ok) {
    const result = await status.json().catch(() => null);
    throw new Error(result?.error || "Google sign-in is temporarily unavailable.");
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback`, scopes: "openid email profile" },
  });
  if (error) throw error;
}
