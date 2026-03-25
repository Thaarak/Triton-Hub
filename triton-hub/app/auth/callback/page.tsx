"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

/**
 * OAuth return URL: Supabase redirects here with ?code=… after Google;
 * we exchange it for a session and send the user to the app root.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const err =
        searchParams.get("error_description") ||
        searchParams.get("error");
      if (err) {
        setError(decodeURIComponent(err.replace(/\+/g, " ")));
        return;
      }

      const code = searchParams.get("code");
      if (!code) {
        router.replace("/login");
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      router.replace("/");
    };
    void run();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#061120] px-4 text-center">
        <p className="text-red-300 text-sm max-w-md">{error}</p>
        <Link href="/login" className="text-blue-300 hover:text-white text-sm underline">
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
