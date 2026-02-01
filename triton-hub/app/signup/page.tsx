"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignup = () => {
        setIsLoading(true);
        window.location.href = "/api/flask/auth/google/login";
    };

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

            <main className="relative z-10 w-full max-w-md px-6 py-12">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-[0_0_30px_rgba(37,99,235,0.4)] mb-6 transform transition-transform hover:scale-110 duration-500">
                        <GraduationCap className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2 font-sans italic uppercase">
                        Join <span className="text-blue-500">Triton Hub</span>
                    </h1>
                    <p className="text-blue-200/60 text-sm font-medium">
                        Centralized Intelligence for UCSD Students
                    </p>
                </div>

                <div className="group relative">
                    {/* Glass Card Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-yellow-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

                    <div className="relative w-full bg-[#001a3a]/80 backdrop-blur-2xl border border-white/5 rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-white mb-2">Get Started</h2>
                            <p className="text-blue-200/50 text-sm">Sign up with your Google account to create your profile</p>
                        </div>

                        <Button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={isLoading}
                            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold h-12 rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                        <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                    </svg>
                                    Sign up with Google
                                </>
                            )}
                        </Button>

                        <div className="mt-8 pt-6 border-t border-white/5 text-center">
                            <p className="text-blue-200/40 text-xs font-medium tracking-wide">
                                Already have an account?{" "}
                                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 opacity-60">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-[9px] font-black text-blue-100 uppercase tracking-widest whitespace-nowrap">Secure Auth</span>
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
