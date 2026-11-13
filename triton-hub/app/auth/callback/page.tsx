"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hasSupabaseConfig } from "@/lib/auth-config";

function Pending() {
  return <div className="grid min-h-screen place-items-center"><Loader2 aria-label="Finishing sign-in" className="animate-spin" /></div>;
}

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function finish() {
      if (!hasSupabaseConfig || params.has("error") || !params.has("code")) throw new Error();
      // The browser client initializes PKCE and exchanges the returned code once.
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw new Error();
      if (!cancelled) router.replace("/");
    }
    void finish().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [params, router]);

  if (!error) return <Pending />;
  return (
    <main className="grid min-h-screen place-content-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">Google sign-in didn&apos;t finish</h1>
      <p className="text-muted-foreground">Try again or open the sample dashboard.</p>
      <Link href="/login" className="underline">Back to sign in</Link>
      <Link href="/demo" className="underline">Explore the demo</Link>
    </main>
  );
}

export default function AuthCallbackPage() {
  return <Suspense fallback={<Pending />}><AuthCallbackContent /></Suspense>;
}
