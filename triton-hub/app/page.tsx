"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { LandingPage } from "@/components/marketing/landing-page";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { needsCanvasSetup } from "@/lib/canvas-setup";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function Home() {
  const router = useRouter();
  const [authState, setAuthState] = useState<
    "checking" | "authenticated" | "public" | "needs_setup"
  >("checking");

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        if (await needsCanvasSetup(session.user.id)) {
          setAuthState("needs_setup");
          return;
        }
        setAuthState("authenticated");
        return;
      }

      // Legacy: backend session token (Flask) — no Supabase profile canvas check here
      const backendToken =
        typeof sessionStorage !== "undefined"
          ? sessionStorage.getItem("triton_session_token")
          : null;
      if (backendToken) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${backendToken}` },
          });
          if (res.ok) {
            setAuthState("authenticated");
            return;
          }
        } catch {
          // token invalid or network error
        }
      }

      setAuthState("public");
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (authState === "needs_setup") {
      router.replace("/setup");
    }
  }, [authState, router]);

  if (authState === "needs_setup") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#061120]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (authState === "checking") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#061120]">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-blue-500/20 animate-pulse rounded-full" />
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-blue-200/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Authenticating Triton Profile
        </p>
      </div>
    );
  }

  return authState === "authenticated" ? <Dashboard /> : <LandingPage />;
}
