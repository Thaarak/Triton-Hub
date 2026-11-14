import { createBrowserClient } from "@supabase/ssr";
import { supabaseKey, supabaseUrl } from "./auth-config";

// The public demo has no credentials. Auth entry points check configuration before use.
export const supabase = createBrowserClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseKey || "demo-only",
  { auth: { flowType: "pkce" } },
);
