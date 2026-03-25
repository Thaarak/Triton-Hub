"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, ExternalLink, RefreshCw, AlertCircle, Check, Eye } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
const READ_EMAILS_KEY = "triton_read_emails";

interface EmailItem {
    id: string;
    subject: string;
    from: string;
    snippet: string;
    date: string | null;
    isRecent: boolean;
}

export function EmailView() {
    const [emails, setEmails] = useState<EmailItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [showRead, setShowRead] = useState(false);

    // Load read emails from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(READ_EMAILS_KEY);
        if (stored) {
            setReadIds(new Set(JSON.parse(stored)));
        }
    }, []);

    const toggleRead = (id: string) => {
        setReadIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            localStorage.setItem(READ_EMAILS_KEY, JSON.stringify([...newSet]));
            return newSet;
        });
    };

    const loadEmails = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${BACKEND_URL}/api/emails`, {
                credentials: "include",
            });

            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error("Please sign in with Google to view emails");
                }
                throw new Error(`Failed to fetch emails: ${res.status}`);
            }

            const data = await res.json();
            const emailList = data.emails || [];
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            // Transform to EmailItem format
            const items: EmailItem[] = emailList.map((e: any) => {
                const emailDate = e.date ? new Date(e.date) : null;
                return {
                    id: e.id,
                    subject: e.subject || "(No Subject)",
                    from: parseFromField(e.from),
                    snippet: e.snippet || "",
                    date: e.date,
                    isRecent: emailDate ? emailDate > oneDayAgo : false,
                };
            });

            setEmails(items);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to fetch emails");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmails();
    }, []);

    // Parse "Name <email@example.com>" format to just show name or email
    const parseFromField = (from: string): string => {
        if (!from) return "Unknown";
        const match = from.match(/^(.+?)\s*<.+>$/);
        if (match) return match[1].replace(/"/g, "");
        return from;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Unknown date";
        try {
            return format(new Date(dateStr), "MMM d, h:mm a");
        } catch {
            return dateStr;
        }
    };

    const getRelativeTime = (dateStr: string | null) => {
        if (!dateStr) return null;
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch {
            return null;
        }
    };

    const recentCount = emails?.filter((e) => e.isRecent && !readIds.has(e.id)).length || 0;
    const unreadCount = emails?.filter((e) => !readIds.has(e.id)).length || 0;
    const readCount = emails?.filter((e) => readIds.has(e.id)).length || 0;

    const filteredEmails = emails?.filter((e) => showRead ? readIds.has(e.id) : !readIds.has(e.id));

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Recent Emails</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadEmails}
                        disabled={loading}
                        className="p-2 rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                        title="Refresh emails"
                    >
                        <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
                    </button>
                    {recentCount > 0 && (
                        <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {recentCount} New Today
                        </span>
                    )}
                    {readCount > 0 && (
                        <span className="bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {readCount} Read
                        </span>
                    )}
                    <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {unreadCount} Unread
                    </span>
                </div>
            </div>

            {/* Filter buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowRead(false)}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                        !showRead
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                >
                    Unread
                </button>
                <button
                    onClick={() => setShowRead(true)}
                    className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
                        showRead
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                >
                    Read
                </button>
            </div>

            {filteredEmails && filteredEmails.length > 0 ? (
                <div className="space-y-3">
                    {filteredEmails.slice(0, 15).map((e) => (
                        <div
                            key={e.id}
                            className={cn(
                                "group relative flex flex-col gap-1 rounded-xl border p-4 transition-colors",
                                readIds.has(e.id) && "opacity-60",
                                e.isRecent && !readIds.has(e.id)
                                    ? "border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10"
                                    : "hover:bg-muted/50"
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className={cn("font-medium text-sm truncate", readIds.has(e.id) && "font-normal")}>
                                        {e.from}
                                    </span>
                                    {e.isRecent && !readIds.has(e.id) && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                            NEW
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => toggleRead(e.id)}
                                        className={cn(
                                            "p-1.5 rounded-md transition-colors",
                                            readIds.has(e.id)
                                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                                : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                        )}
                                        title={readIds.has(e.id) ? "Mark as unread" : "Mark as read"}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <span className="text-xs text-muted-foreground">
                                        {getRelativeTime(e.date)}
                                    </span>
                                </div>
                            </div>

                            <div className="pl-6">
                                <h3 className={cn("font-semibold text-sm leading-tight line-clamp-1", readIds.has(e.id) && "font-normal")}>
                                    {e.subject}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {e.snippet}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
                    <Mail className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">
                        {showRead ? "No read emails" : "No unread emails!"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {showRead ? "Mark some emails as read to see them here." : "You're all caught up!"}
                    </p>
                </div>
            )}
        </div>
    );
}
