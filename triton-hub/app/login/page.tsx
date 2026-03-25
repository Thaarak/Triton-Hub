"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, CalendarRange, BookOpenText } from "lucide-react";
import { AuthShell } from "@/components/marketing/auth-shell";
import { GoogleSignInButton } from "@/components/marketing/google-sign-in-button";

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        if (params.get("error") === "auth_failed") {
            setError(
                "Google sign-in could not finish (server could not create your profile). Confirm Supabase configuration, then try again."
            );
        }
    }, []);

    return (
        <AuthShell
            eyebrow="Sign in to your student workspace"
            title="Everything important, finally in one place."
            subtitle="Return to a cleaner dashboard for Canvas tasks, academic email, announcements, and the deadlines you actually need to act on."
            kicker="Focused academic workflow"
            bottomContent={
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        {
                            icon: Mail,
                            title: "Email triage",
                            body: "Catch professor updates without digging through threads.",
                        },
                        {
                            icon: BookOpenText,
                            title: "Canvas merge",
                            body: "See assignments and announcements in the same flow.",
                        },
                        {
                            icon: CalendarRange,
                            title: "Calm planning",
                            body: "Keep the urgent work visible and stale tasks out of the way.",
                        },
                    ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                            <item.icon className="h-4 w-4 text-blue-300" />
                            <p className="mt-3 text-sm font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-6 text-blue-100/60">{item.body}</p>
                        </div>
                    ))}
                </div>
            }
        >
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white">Welcome back</h2>
                <p className="mt-2 text-sm text-blue-100/60">
                    Sign in with the Google account you use for school.
                </p>
            </div>

            {error && (
                <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <GoogleSignInButton
                label="Log in with Google"
                onStart={() => setError(null)}
                onError={setError}
            />

            <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-blue-100/50">
                    New to Triton Hub?{" "}
                    <Link href="/signup" className="font-medium text-blue-200 hover:text-white">
                        Create your account
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
