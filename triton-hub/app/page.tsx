"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsCheckingAuth(false);
        return;
      }
      // Google OAuth users: no Supabase session, but may have backend session token
      const backendToken = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("triton_session_token") : null;
      if (backendToken) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/profile/me`, {
            headers: { Authorization: `Bearer ${backendToken}` },
          });
          if (res.ok) {
            setIsCheckingAuth(false);
            return;
          }
        } catch {
          // token invalid or network error
        }
      }
      router.push("/login");
    };
    checkAuth();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#00132b]">
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

  return <Dashboard />;
}
