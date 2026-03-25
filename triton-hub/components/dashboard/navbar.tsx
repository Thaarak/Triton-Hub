"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLocalAvatarUrl, getLocalDisplayName } from "@/lib/user-preferences";
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
} from "lucide-react";

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [displayName, setDisplayName] = useState("Triton Student");
  const [avatarUrl, setAvatarUrl] = useState("/avatar.png");
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const localName = getLocalDisplayName();
    const localAvatar = getLocalAvatarUrl();
    if (localName.trim()) setDisplayName(localName.trim());
    if (localAvatar.trim()) setAvatarUrl(localAvatar.trim());

    const loadFromSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metaName =
          (session.user.user_metadata?.full_name as string | undefined) ||
          (session.user.user_metadata?.name as string | undefined) ||
          "";
        const metaAvatar = (session.user.user_metadata?.avatar_url as string | undefined) || "";
        if (metaName.trim()) setDisplayName(metaName.trim());
        if (metaAvatar.trim()) setAvatarUrl(metaAvatar.trim());
      }
    };
    loadFromSession();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("triton_session_token");
      sessionStorage.removeItem("canvas_token");
      sessionStorage.removeItem("canvas_url");
    }
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-primary-foreground"
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
          <span className="hidden text-xl font-semibold text-foreground sm:block">
            Triton Hub
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
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



          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-2 pr-1"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {displayName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() || "")
                      .join("") || "TS"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:block">
                  {displayName}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
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
