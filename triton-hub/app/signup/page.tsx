"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, Check, X, CalendarRange, Sparkles, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { AuthShell } from "@/components/marketing/auth-shell";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

export default function SignUpPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        let strength = 0;
        if (formData.password.length > 5) strength += 1;
        if (formData.password.length > 8) strength += 1;
        if (/[A-Z]/.test(formData.password)) strength += 1;
        if (/[0-9]/.test(formData.password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
        setPasswordStrength(strength);
    }, [formData.password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: { full_name: formData.name },
                },
            });

            if (error) throw error;
            if (!data.user?.id) throw new Error("Account created but no user id returned");

            // Step 2: redirect to setup to add Canvas token
            router.push(`/setup?user_id=${encodeURIComponent(data.user.id)}`);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const passwordsMatch = formData.password.length > 0 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

    return (
        <AuthShell
            eyebrow="Create your Triton Hub workspace"
            title="A better home base for every class update."
            subtitle="Start with your account, then connect the signals that matter: course announcements, Canvas work, urgent email, and a cleaner planning flow."
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
                <p className="mt-2 text-sm text-blue-100/60">Set up your profile first, then connect Canvas and other sources.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/35" />
                            <Input
                                required
                                placeholder="Rayirth Dinesh"
                                className="h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-blue-100/25 focus:border-blue-400/40 focus:ring-blue-500/25"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

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
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
                            Password
                        </label>
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
                        <div className="flex h-1 gap-1 overflow-hidden rounded-full">
                            <div className={cn("flex-1 bg-white/10 transition-all", passwordStrength > 0 && "bg-red-400")} />
                            <div className={cn("flex-1 bg-white/10 transition-all", passwordStrength > 2 && "bg-amber-400")} />
                            <div className={cn("flex-1 bg-white/10 transition-all", passwordStrength > 4 && "bg-emerald-400")} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100/50">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/35" />
                            <Input
                                required
                                type="password"
                                placeholder="Confirm password"
                                className={cn(
                                    "h-12 rounded-2xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-blue-100/25 focus:border-blue-400/40 focus:ring-blue-500/25",
                                    formData.confirmPassword && !passwordsMatch && "border-red-500/40",
                                    formData.confirmPassword && passwordsMatch && "border-emerald-500/40"
                                )}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            {formData.confirmPassword && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {passwordsMatch ? (
                                        <Check className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                        <X className="h-4 w-4 text-red-400" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-blue-100/60">
                    Next step after signup: connect Canvas so assignments and announcements can sync into your dashboard.
                </div>

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
                    onClick={() => (window.location.href = `${BACKEND_URL}/auth/google`)}
                    className="h-12 w-full rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </Button>

                {error && (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </div>
                )}

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <input type="checkbox" required className="mt-1 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50" />
                    <span className="text-xs leading-6 text-blue-100/55">
                        I agree to the Triton Hub terms and understand this workspace helps organize my academic data across connected sources.
                    </span>
                </label>

                <Button
                    type="submit"
                    disabled={isLoading || (formData.password.length > 0 && formData.confirmPassword.length > 0 && !passwordsMatch)}
                    className="h-12 w-full rounded-2xl bg-blue-500 text-white shadow-[0_18px_40px_rgba(59,130,246,0.3)] hover:bg-blue-400"
                >
                    {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <span className="flex items-center gap-2">
                            Create workspace
                            <ArrowRight className="h-4 w-4" />
                        </span>
                    )}
                </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-blue-100/50">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-blue-200 hover:text-white">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
