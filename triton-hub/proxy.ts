import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hasSupabaseConfig } from "@/lib/auth-config";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return hasSupabaseConfig ? updateSession(request) : NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!demo(?:/|$)|api/auth/status|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
