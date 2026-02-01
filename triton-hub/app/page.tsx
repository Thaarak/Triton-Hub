"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard/dashboard";
import { Loader2 } from "lucide-react";
import { getFlaskAuthStatus } from "@/lib/flask";

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Check Flask/Google auth only (all auth via backend)
      const flaskAuth = await getFlaskAuthStatus();
      if (flaskAuth.authenticated && flaskAuth.user) {
        setUser(flaskAuth.user);
        setIsCheckingAuth(false);
        return;
      }

      // No authentication found, redirect to login
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
