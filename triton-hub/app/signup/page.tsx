"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Mail, Lock, User, ArrowRight, Loader2, Sparkles, ShieldCheck, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function SignUpPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        canvasToken: "",
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
                    data: {
                        full_name: formData.name,
                        canvas_token: formData.canvasToken,
                    },
                },
            });

            if (error) throw error;

            // Successful signup
            router.push("/");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const passwordsMatch = formData.password.length > 0 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#00132b]">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />
            </div>

            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 z-[1] opacity-[0.03] bg-[grid_20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

            <main className="relative z-10 w-full max-w-lg px-6 py-12">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-6 transform transition-transform hover:scale-110 duration-500">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2 font-sans italic uppercase">
                        Create <span className="text-blue-500">Profile</span>
                    </h1>
                    <p className="text-blue-200/60 text-sm font-medium">
                        Join the centralized intelligence network for Triton Students
                    </p>
                </div>

                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                    <div className="relative w-full bg-[#001a3a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-1">
                                        Full Name
                                    </label>
                                    <div className="relative group/input">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors" />
                                        <Input
                                            required
                                            placeholder="King Triton"
                                            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>

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
                                    <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-1">
                                        Account Password
                                    </label>
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
                                    {/* Strength Bar */}
                                    <div className="flex gap-1 h-1 mt-1 ml-1 overflow-hidden rounded-full">
                                        <div className={cn("flex-1 transition-all duration-300 bg-white/10", passwordStrength > 0 && "bg-red-500")} />
                                        <div className={cn("flex-1 transition-all duration-300 bg-white/10", passwordStrength > 2 && "bg-yellow-500")} />
                                        <div className={cn("flex-1 transition-all duration-300 bg-white/10", passwordStrength > 4 && "bg-green-500")} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-1">
                                        Retype Password
                                    </label>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors" />
                                        <Input
                                            required
                                            type="password"
                                            placeholder="Confirm password"
                                            className={cn(
                                                "pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all",
                                                formData.confirmPassword && !passwordsMatch && "border-red-500/50 focus:border-red-500/50",
                                                formData.confirmPassword && passwordsMatch && "border-green-500/50 focus:border-green-500/50"
                                            )}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                        {formData.confirmPassword && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                {passwordsMatch ? (
                                                    <Check className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <X className="w-4 h-4 text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-400/80 uppercase tracking-[0.2em] ml-1">
                                        Canvas Token
                                    </label>
                                    <div className="relative group/input">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/30 group-focus-within/input:text-blue-400 transition-colors" />
                                        <Input
                                            required
                                            type="text"
                                            placeholder="Paste your token here"
                                            className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12 rounded-xl focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                            value={formData.canvasToken}
                                            onChange={(e) => setFormData({ ...formData, canvasToken: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-start gap-3 px-1">
                                <div className="mt-1">
                                    <input type="checkbox" required className="rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500/50" />
                                </div>
                                <p className="text-[10px] leading-relaxed text-blue-200/40 uppercase font-medium tracking-wider">
                                    I agree to the <span className="text-blue-400">Triton Hub Terms</span> and acknowledge the university data integration protocols.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || (formData.password.length > 0 && formData.confirmPassword.length > 0 && !passwordsMatch)}
                                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold h-12 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-70 group"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Initialize Hub Profile <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-blue-200/40 text-xs font-medium tracking-wide">
                                Already have a profile?{" "}
                                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">
                                    Sign In to Hub
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-60">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest whitespace-nowrap">Encrypted Backend</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest whitespace-nowrap">Canvas Sync Ready</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
