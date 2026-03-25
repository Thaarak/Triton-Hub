"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  kicker: string;
  children: ReactNode;
  bottomContent?: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  kicker,
  children,
  bottomContent,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,#061120_0%,#081426_42%,#0a1528_100%)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)] pointer-events-none" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
              <GraduationCap className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Triton Hub</p>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/60">{kicker}</p>
            </div>
          </Link>

          <Button asChild variant="outline" className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link href="/">
              Back home
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl gap-12 px-6 pb-12 pt-4 lg:grid-cols-[1fr_540px] lg:px-10 lg:pb-16 lg:pt-10">
        <section className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-blue-100/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            {eyebrow}
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100/68">
            {subtitle}
          </p>

          {bottomContent ? <div className="mt-10">{bottomContent}</div> : null}
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
              {children}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
