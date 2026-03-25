"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { needsCanvasSetup } from "@/lib/canvas-setup";
import { AuthShell } from "@/components/marketing/auth-shell";

const CANVAS_URL_KEY = "canvas_url";
const CANVAS_TOKEN_KEY = "canvas_token";
const DEFAULT_CANVAS_URL = "https://canvas.ucsd.edu";

/**
 * Required onboarding: save Canvas access token to Supabase profile and sessionStorage
 * so the rest of the app can load courses and assignments.
 */
export default function SetupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (!(await needsCanvasSetup(session.user.id))) {
        router.replace("/");
        return;
      }

      setReady(true);
    };
    void init();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Paste your Canvas access token to continue.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          canvas_token: trimmed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(CANVAS_TOKEN_KEY, trimmed);
        sessionStorage.setItem(CANVAS_URL_KEY, DEFAULT_CANVAS_URL);
      }

      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save your token.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#061120]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      eyebrow="One-time setup"
      title="Connect Canvas"
      subtitle="Triton Hub uses your personal Canvas access token to load courses and deadlines. You can rotate or remove it later in Settings."
      kicker="Required before your dashboard"
      bottomContent={
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-blue-100/55">
          <p className="font-medium text-blue-100/80">How to get a token</p>
          <p className="mt-2">
            In Canvas: <strong>Account</strong> → <strong>Settings</strong> → <strong>New Access Token</strong>.
            Copy the token and paste it here. Treat it like a password.
          </p>
        </div>
      }
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Canvas access token</h2>
          <p className="text-sm text-blue-100/50">Required for first-time sign-in</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
            Access token
          </label>
          <Input
            type="password"
            autoComplete="off"
            placeholder="Paste token from Canvas → Settings"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-blue-100/25"
          />
        </div>

        <a
          href="https://canvas.ucsd.edu/profile/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-white"
        >
          Open Canvas token settings
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        {error && (
          <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="h-12 w-full rounded-2xl bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.3)] hover:bg-blue-400"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save and continue"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-blue-100/45">
        Wrong account?{" "}
        <button
          type="button"
          className="font-medium text-blue-200 hover:text-white"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </p>
    </AuthShell>
  );
}
