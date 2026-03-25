"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  clearStoredProfilePreferences,
  getStoredProfilePreferences,
  setStoredProfilePreferences,
  subscribeToStoredProfilePreferences,
} from "@/lib/profile-preferences";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Moon,
  Sun,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "TS"
  );
}

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("Triton Student");
  const [avatarUrl, setAvatarUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const applyProfile = (name: string, avatar: string) => {
      setDisplayName(name.trim() || "Triton Student");
      setAvatarUrl(avatar.trim());
    };

    const stored = getStoredProfilePreferences();
    applyProfile(stored.displayName, stored.avatarUrl);

    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: row } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();

        const resolvedName =
          row?.full_name ||
          (session.user.user_metadata?.full_name as string | undefined) ||
          (session.user.user_metadata?.name as string | undefined) ||
          stored.displayName;
        const resolvedAvatar =
          (session.user.user_metadata?.avatar_url as string | undefined) ||
          stored.avatarUrl;

        applyProfile(resolvedName || "", resolvedAvatar || "");
        setStoredProfilePreferences({
          displayName: resolvedName || "",
          avatarUrl: resolvedAvatar || "",
        });
        return;
      }

      const backendToken =
        typeof sessionStorage !== "undefined" ? sessionStorage.getItem("triton_session_token") : null;
      if (!backendToken) return;

      try {
        const res = await fetch(`${BACKEND_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${backendToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const resolvedName = data.full_name || stored.displayName;
        applyProfile(resolvedName, stored.avatarUrl);
        setStoredProfilePreferences({
          displayName: resolvedName || "",
          avatarUrl: stored.avatarUrl || "",
        });
      } catch {
        // Keep cached profile values.
      }
    };

    const unsubscribe = subscribeToStoredProfilePreferences((next) => {
      applyProfile(next.displayName, next.avatarUrl);
    });

    loadProfile();
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearStoredProfilePreferences();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("triton_session_token");
      sessionStorage.removeItem("canvas_token");
      sessionStorage.removeItem("canvas_url");
    }
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/15 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L12 22" />
              <path d="M12 2L6 8" />
              <path d="M12 2L18 8" />
              <path d="M6 12L12 6L18 12" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold tracking-tight text-foreground">Triton Hub</p>
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Modern student workflow</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Canvas, email, and deadlines in one place
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full border-white/10 bg-card/70 text-muted-foreground hover:bg-card"
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {!mounted ? (
              <Moon className="h-5 w-5 opacity-0" aria-hidden />
            ) : theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 rounded-full border border-white/10 bg-card/70 pl-2 pr-3 shadow-sm hover:bg-card"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 text-left md:block">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground">Personal workspace</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl border-white/10 bg-popover/95 backdrop-blur-xl">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
