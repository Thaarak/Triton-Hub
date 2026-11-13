import { supabaseKey, supabaseUrl } from "@/lib/auth-config";

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return Response.json({ error: "Sign-in is unavailable here. You can still explore the demo." }, { status: 503 });
  }
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: { apikey: supabaseKey },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok && (await response.json()).external?.google === true) return new Response(null, { status: 204 });
  } catch {
    // Keep the public demo reachable when the identity provider is down.
  }
  return Response.json({ error: "Google sign-in is temporarily unavailable. Try again later or explore the demo." }, { status: 503 });
}
