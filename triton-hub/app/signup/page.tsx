"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, CalendarRange, ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/marketing/auth-shell";
import { GoogleSignInButton } from "@/components/marketing/google-sign-in-button";

export default function SignUpPage() {
    const [error, setError] = useState<string | null>(null);

    return (
        <AuthShell
            eyebrow="Create your Triton Hub workspace"
            title="A better home base for every class update."
            subtitle="Sign in with Google, then add your Canvas access token so we can sync courses and deadlines."
            kicker="Student dashboard setup"
            bottomContent={
                <div className="grid gap-3 sm:grid-cols-3">
                    {[
                        {
                            icon: BellRing,
                            title: "Announcements that surface fast",
                            body: "Prioritize what professors and classes are actually asking you to do.",
                        },
                        {
                            icon: CalendarRange,
                            title: "Deadline-aware planning",
                            body: "See assignments with context instead of guessing what still matters.",
                        },
                        {
                            icon: ShieldCheck,
                            title: "Personalized workspace",
                            body: "Theme, profile, and feed preferences tuned to your student workflow.",
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
                <h2 className="text-2xl font-semibold text-white">Create your account</h2>
                <p className="mt-2 text-sm text-blue-100/60">
                    Continue with Google. On your first visit we&apos;ll ask for your Canvas token next.
                </p>
            </div>

            {error && (
                <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                </div>
            )}

            <GoogleSignInButton
                label="Continue with Google"
                onStart={() => setError(null)}
                onError={setError}
            />

            <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-blue-100/50">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-blue-200 hover:text-white">
                        Log in
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
