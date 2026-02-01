"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);

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
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#00132b]">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />
            </div>

            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.03] bg-[grid_20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <main className="relative z-10 w-full max-w-md px-6 py-12">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-6 transform transition-transform hover:scale-110 duration-500">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2 font-sans italic uppercase">
                        Triton <span className="text-blue-500">Hub</span>
                    </h1>
                    <p className="text-blue-200/60 text-sm font-medium">
                        Centralized Intelligence for UCSD Students
                    </p>
                </div>

                <div className="group relative">
                    {/* Glass Card Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                    <div className="relative w-full bg-[#001a3a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-1">
                                    University Email
                                </label>
                                <div className="relative group/input">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors" />
                                    <Input
                                        required
                                        type="email"
                                        placeholder="triton@ucsd.edu"
                                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em]">
                                        Password
                                    </label>
                                    <Link href="#" className="text-[10px] font-bold text-blue-200/40 hover:text-blue-400 uppercase tracking-wider transition-colors">
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative group/input">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors" />
                                    <Input
                                        required
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-70 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Enter Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>

                            <div className="relative py-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                    <span className="bg-[#0b1f3b] px-2 text-blue-200/40">Or sync with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.location.href = "http://localhost:8080/auth/google"}
                                className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-12 rounded-xl transition-all flex items-center justify-center gap-3 group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-blue-200/40 text-xs font-medium tracking-wide">
                                New to the Hub?{" "}
                                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">
                                    Create Class Profile
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                        <span className="text-[10px] font-bold text-blue-200/60 uppercase tracking-widest">UCSD Verified</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
