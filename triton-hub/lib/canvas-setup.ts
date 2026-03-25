import { supabase } from "@/lib/supabase";

/**
 * Returns true when the user must complete Canvas token setup before using the dashboard.
 * Treats missing profile row or empty canvas_token as needing setup.
 */
export async function needsCanvasSetup(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("canvas_token")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("needsCanvasSetup:", error);
    return true;
  }
  if (!data) return true;
  const t = data.canvas_token?.trim();
  return !t;
}
