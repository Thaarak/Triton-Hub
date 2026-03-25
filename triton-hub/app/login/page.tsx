"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2, BellRing, CalendarRange, BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/supabase-oauth";
import { AuthShell } from "@/components/marketing/auth-shell";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
        if (params.get("error") === "auth_failed") {
            setError(
                "Google sign-in could not finish (server could not create your profile). Confirm SUPABASE_URL and SUPABASE_KEY in the backend .env, then try again."
            );
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            router.push("/");
        } catch (err: any) {
            setError(err.message || "Invalid login credentials");
        } finally {
            setIsLoading(false);
        }
    };

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
                <p className="mt-2 text-sm text-blue-100/60">Sign in with email/password or continue with Google.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
                        University Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/35" />
                        <Input
                            required
                            type="email"
                            placeholder="triton@ucsd.edu"
                            className="h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-blue-100/25 focus:border-blue-400/40 focus:ring-blue-500/25"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
                            Password
                        </label>
                        <Link href="#" className="text-xs text-blue-200/45 hover:text-blue-200">
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/35" />
                        <Input
                            required
                            type="password"
                            placeholder="••••••••"
                            className="h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-blue-100/25 focus:border-blue-400/40 focus:ring-blue-500/25"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-2xl bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.3)] hover:bg-blue-400"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Enter dashboard
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>

                <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-slate-950 px-3 text-[11px] uppercase tracking-[0.24em] text-blue-100/40">
                            or continue with
                        </span>
                    </div>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                        setError(null);
                        setIsLoading(true);
                        try {
                            await signInWithGoogle();
                        } catch (err: unknown) {
                            setError(
                                err instanceof Error ? err.message : "Google sign-in failed"
                            );
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                    className="h-12 w-full rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </Button>
            </form>

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
