"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BookOpenText,
  CalendarRange,
  CheckCircle2,
  GraduationCap,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const featureCards = [
  {
    icon: Mail,
    title: "Turn email into action",
    body: "Surface the academic emails that matter, then merge them with assignments and announcements in one feed.",
  },
  {
    icon: BookOpenText,
    title: "Canvas + email in one workspace",
    body: "See live Canvas work beside synced notifications so you stop bouncing between tabs and missing context.",
  },
  {
    icon: CalendarRange,
    title: "Deadline-aware planning",
    body: "Track upcoming assignments, filter sources, and separate stale overdue work into a cleaner follow-up bucket.",
  },
];

const valuePoints = [
  "Unified home feed for Canvas, email, and announcements",
  "Smart overdue cleanup so old tasks stop cluttering your calendar",
  "Student-focused dashboard designed around urgency and course context",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,#061120_0%,#081426_40%,#0a1528_100%)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)] pointer-events-none" />

      <header className="relative z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur">
              <GraduationCap className="h-5 w-5 text-blue-300" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Triton Hub</p>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-200/60">Student command center</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-blue-100 hover:bg-white/10 hover:text-white">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-white text-slate-950 hover:bg-blue-50 px-5 shadow-[0_12px_30px_rgba(15,23,42,0.25)]"
            >
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-16 px-6 pb-16 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:pb-24 lg:pt-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium text-blue-100/80 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-blue-300" />
              Built for UCSD students who manage everything in too many tabs
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              One sleek hub for your
              <span className="block bg-gradient-to-r from-blue-300 via-cyan-200 to-white bg-clip-text text-transparent">
                classes, deadlines, and updates.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
              Triton Hub merges Canvas, academic email, announcements, and task cleanup into a calmer dashboard so you can
              see what matters, act faster, and stop losing work in scattered tools.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-blue-500 px-6 text-white shadow-[0_16px_40px_rgba(59,130,246,0.35)] hover:bg-blue-400"
              >
                <Link href="/signup">
                  Start your workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/10 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/login">Already have an account?</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {valuePoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-blue-50/80 shadow-[0_10px_30px_rgba(2,6,23,0.25)] backdrop-blur"
                >
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span className="font-medium">Why students use it</span>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[32px] border border-white/10 bg-white/6 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Today at a glance</p>
                    <p className="text-xs text-blue-100/50">Assignments, announcements, and email in one timeline</p>
                  </div>
                  <div className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-xs text-blue-200">
                    Synced
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-blue-400/15 bg-blue-400/8 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-300" />
                        <span className="text-sm font-medium text-white">Email surfaces the important stuff</span>
                      </div>
                      <span className="text-xs text-blue-100/50">2 unread</span>
                    </div>
                    <p className="text-sm text-blue-50/80">
                      Final reminders, professor announcements, and course notices are converted into actionable updates.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <BellRing className="h-4 w-4 text-amber-300" />
                        <p className="text-sm font-medium text-white">Announcements</p>
                      </div>
                      <p className="text-xs leading-6 text-blue-100/60">
                        Read course announcements beside email-origin alerts instead of hunting through inboxes.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-emerald-300" />
                        <p className="text-sm font-medium text-white">Assignments</p>
                      </div>
                      <p className="text-xs leading-6 text-blue-100/60">
                        Separate active work from “forgot to check off” items so your calendar stays useful.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-300" />
                      <p className="text-sm font-medium text-white">Built for trustworthy student workflow</p>
                    </div>
                    <p className="text-xs leading-6 text-blue-100/60">
                      Sign in with email or Google, sync Canvas data, and personalize the experience without leaving the app shell.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-200/50">Core product flow</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Designed to cut through deadline chaos.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-blue-100/60">
              The UI emphasizes clarity: fewer noisy surfaces, softer cards, stronger hierarchy, and direct actions where work actually happens.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(2,6,23,0.25)] backdrop-blur"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <card.icon className="h-5 w-5 text-blue-200" />
                </div>
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-blue-100/65">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-blue-100/55 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>Triton Hub helps UCSD students stay on top of classes, communication, and deadlines.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white">Sign in</Link>
            <Link href="/signup" className="hover:text-white">Create account</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
