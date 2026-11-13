"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { needsCanvasSetup } from "@/lib/canvas-setup";

/**
 * Dashboard routes: if the user is signed in but has not saved a Canvas token on their profile,
 * send them to /setup before rendering the page.
 */
export function CanvasSetupGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!hasSupabaseConfig) { router.replace("/demo"); return; }
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) router.replace("/login");
        return;
      }

      const missing = await needsCanvasSetup().catch(() => false);
      if (cancelled) return;
      if (missing && window.location.pathname !== "/settings") {
        router.replace("/setup");
        return;
      }
      if (!cancelled) setAllowed(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!allowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
