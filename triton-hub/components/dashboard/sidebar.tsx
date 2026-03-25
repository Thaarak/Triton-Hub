"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  ClipboardList,
  CalendarDays,
  Calendar,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { clearStoredProfilePreferences } from "@/lib/profile-preferences";

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/" },
  { icon: Megaphone, label: "Announcements", href: "/announcements" },
  { icon: ClipboardList, label: "Assignments", href: "/assignments" },
  { icon: CalendarDays, label: "Events", href: "/events" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-white/10 bg-background/75 backdrop-blur-xl transition-all duration-300",
        "hidden sm:block",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="px-4 pt-4">
          <div className={cn(
            "rounded-3xl border border-white/10 bg-card/70 p-4 shadow-sm",
            collapsed && "px-2 py-3"
          )}>
            {collapsed ? (
              <div className="flex justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.24em]">Workspace</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-foreground">Stay ahead of every class update.</p>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  Email, Canvas, announcements, and scheduling all from one calmer dashboard.
                </p>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/" && pathname === "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/10"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  isActive ? "bg-primary/10" : "bg-secondary/70"
                )}>
                  <item.icon className="h-4 w-4 shrink-0" />
                </div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 p-4 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "h-11 w-full rounded-2xl justify-center text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-colors",
              !collapsed && "justify-start"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-3 font-semibold text-xs tracking-wide">Sign out</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "h-11 w-full rounded-2xl justify-center text-muted-foreground hover:bg-card hover:text-foreground",
              !collapsed && "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs font-semibold tracking-wide">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

