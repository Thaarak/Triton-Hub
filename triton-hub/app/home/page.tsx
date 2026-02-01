"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CanvasIntegration } from "@/components/dashboard/canvas-integration";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatsSidebar } from "@/components/dashboard/stats-sidebar";
import { Loader2 } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const CANVAS_TOKEN_KEY = "canvas_token";
const CANVAS_URL_KEY = "canvas_url";
const CANVAS_UCSD_URL = "https://canvas.ucsd.edu";

function HomePageContent() {
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("t");
    if (!t) {
      setReady(true);
      return;
    }
    // Exchange one-time token (from Google OAuth redirect) for profile and load canvas token into sessionStorage
    const loadProfileFromToken = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/profile/me?t=${encodeURIComponent(t)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Invalid or expired link");
        }
        const profile = await res.json();
        if (typeof sessionStorage !== "undefined") {
          if (profile.canvas_token) {
            sessionStorage.setItem(CANVAS_TOKEN_KEY, profile.canvas_token);
            sessionStorage.setItem(CANVAS_URL_KEY, CANVAS_UCSD_URL);
          }
          if (profile.session_token) {
            sessionStorage.setItem("triton_session_token", profile.session_token);
          }
        }
        // Remove token from URL so it isn't visible or shared
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("t");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      } catch (err: unknown) {
        setTokenError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setReady(true);
      }
    };
    loadProfileFromToken();
  }, [searchParams]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-destructive text-center">{tokenError}. Try signing in again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Sidebar />
      <StatsSidebar />
      <main className="pt-16 pb-20 sm:pb-0 sm:pl-56 xl:pr-72 transition-all duration-300">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Canvas Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sync your Canvas account to view your classes, grades, and assignments.
            </p>
          </div>

          <CanvasIntegration />
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
