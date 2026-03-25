"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CONFIG_HINT =
  "In Supabase → Authentication → URL configuration: set Site URL to https://YOUR-APP.vercel.app (not localhost), add that same origin under Redirect URLs, and set NEXT_PUBLIC_SITE_URL on Vercel to match.";

/**
 * OAuth return in the browser:
 * - PKCE: ?code=… + cookie verifier (preferred)
 * - Implicit: #access_token=… (hash is never sent to a Route Handler — only the client can read it)
 *
 * If you land on localhost after production sign-in, Supabase is still using localhost as Site URL.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      const errParam =
        searchParams.get("error_description") || searchParams.get("error");
      if (errParam) {
        setError(decodeURIComponent(errParam.replace(/\+/g, " ")));
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exErr) {
          setError(exErr.message);
          return;
        }
        router.replace("/");
        return;
      }

      const hash =
        typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
      if (hash.includes("access_token") || hash.includes("error")) {
        const { data: first, error: e1 } = await supabase.auth.getSession();
        if (e1) {
          setError(e1.message);
          return;
        }
        if (first.session) {
          window.history.replaceState(null, "", window.location.pathname);
          router.replace("/");
          return;
        }

        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if (session) {
              if (timeoutId) clearTimeout(timeoutId);
              sub.unsubscribe();
              window.history.replaceState(null, "", window.location.pathname);
              router.replace("/");
            }
          }
        );
        subscription = sub;

        await supabase.auth.getSession();

        timeoutId = setTimeout(() => {
          subscription?.unsubscribe();
          setError(`Could not finish sign-in from URL. ${CONFIG_HINT}`);
        }, 8000);
        return;
      }

      setError(`Missing OAuth response. ${CONFIG_HINT}`);
    };

    void run();

    return () => {
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#061120] px-4 text-center">
        <p className="text-red-300 text-sm max-w-md">{error}</p>
        <Link
          href="/login"
          className="text-blue-300 hover:text-white text-sm underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#061120]">
      <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
      <p className="mt-4 text-blue-200/40 text-[10px] font-black uppercase tracking-[0.3em]">
        Finishing sign-in
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#061120]">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
