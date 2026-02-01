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

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-white/10"></div>
                                <span className="flex-shrink-0 mx-4 text-white/30 text-xs uppercase tracking-wider">Or</span>
                                <div className="flex-grow border-t border-white/10"></div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.location.href = "/api/flask/auth/google/login"}
                                className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98]"
                            >
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Sign in with Google
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
