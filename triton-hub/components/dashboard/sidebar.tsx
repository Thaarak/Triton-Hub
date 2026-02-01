"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  ClipboardList,
  CalendarDays,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const navItems = [
  { icon: LayoutDashboard, label: "Home", href: "/home" },
  { icon: Megaphone, label: "Announcements", href: "/announcements" },
  { icon: ClipboardList, label: "Assignments", href: "/assignments" },
  { icon: CalendarDays, label: "Events", href: "/events" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Settings, label: "Settings", href: "#" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
    <aside
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-sidebar-border bg-sidebar transition-all duration-300",
        "hidden sm:block",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === "/" && pathname === "/");
            return (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-sidebar-border p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full justify-center text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-colors",
              !collapsed && "justify-start"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-3 font-bold uppercase text-[10px] tracking-widest">Sign Out</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              !collapsed && "justify-start"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

