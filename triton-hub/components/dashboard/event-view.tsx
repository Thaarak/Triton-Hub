"use client";

import { useState, useEffect } from "react";
import { Loader2, Calendar, ExternalLink, RefreshCw, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCanvasToken } from "@/lib/canvas";
import { format } from "date-fns";

interface CalendarEventItem {
    id: string;
    title: string;
    description: string | null;
    startAt: string | null;
    endAt: string | null;
    locationName: string | null;
    locationAddress: string | null;
    contextCode: string;
    contextName: string;
    htmlUrl: string;
    type: 'event' | 'assignment';
}

export function EventView() {
    const [events, setEvents] = useState<CalendarEventItem[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasToken, setHasToken] = useState<boolean | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get token from backend session
            const token = await getCanvasToken();
            
            if (!token) {
                setHasToken(false);
                setLoading(false);
                return;
            }
            
            setHasToken(true);

            const headers = { Authorization: `Bearer ${token}` };
            const base = '/canvas-api';

            // Fetch calendar events
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 3); // Next 3 months

            const eventsRes = await fetch(
                `${base}/api/v1/calendar_events?type=event&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}&per_page=50`,
                { headers }
            );

            if (!eventsRes.ok) throw new Error(`Canvas API error: ${eventsRes.status}`);
            const eventsJson = await eventsRes.json();

            const mappedEvents: CalendarEventItem[] = eventsJson.map((e: any) => ({
                id: e.id,
                title: e.title,
                description: e.description,
                startAt: e.start_at,
                endAt: e.end_at,
                locationName: e.location_name,
                locationAddress: e.location_address,
                contextCode: e.context_code || '',
                contextName: e.context_name || 'Personal',
                htmlUrl: e.html_url,
                type: 'event'
            }));

            // Sort by start date
            mappedEvents.sort((a, b) => {
                if (!a.startAt) return 1;
                if (!b.startAt) return -1;
                return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
            });

            setEvents(mappedEvents);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (startAt: string | null, endAt: string | null) => {
        if (!startAt) return 'No date set';
        const start = new Date(startAt);
        const dateStr = format(start, 'EEE, MMM d');
        const timeStr = format(start, 'h:mm a');
        
        if (endAt) {
            const end = new Date(endAt);
            const endTimeStr = format(end, 'h:mm a');
            return `${dateStr} • ${timeStr} - ${endTimeStr}`;
        }
        return `${dateStr} • ${timeStr}`;
    };

    const stripHtml = (html: string | null) => {
        if (!html) return '';
        if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading events...</p>
            </div>
        );
    }

    if (hasToken === false) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold">Canvas Not Connected</h3>
                <p className="text-muted-foreground mt-2 mb-4">
                    Please log in to connect your Canvas account.
                </p>
                <a href="/login" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
                    Go to Login
                </a>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Upcoming Events</h2>
                    <p className="text-sm text-muted-foreground mt-1">Calendar events from Canvas</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-secondary text-secondary-foreground text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {events?.length || 0} Events
                    </span>
                    <button
                        onClick={fetchEvents}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                </div>
            </div>

            {events && events.length > 0 ? (
                <div className="grid gap-4">
                    {events.map((event) => (
                        <div key={event.id} className="group relative rounded-xl border bg-card p-5 hover:border-primary/50 transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-500/10 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                            {event.contextName}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                                        {event.title}
                                    </h3>
                                    
                                    <div className="flex flex-col gap-2 mt-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {formatDateTime(event.startAt, event.endAt)}
                                        </div>
                                        
                                        {(event.locationName || event.locationAddress) && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                {event.locationName || event.locationAddress}
                                            </div>
                                        )}
                                        
                                        {event.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                {stripHtml(event.description)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <a 
                                    href={event.htmlUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="shrink-0 p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ExternalLink className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 border border-border rounded-xl bg-card">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">No upcoming events found!</p>
                    <p className="text-xs text-muted-foreground mt-1">Events from your Canvas calendar will appear here.</p>
                </div>
            )}
        </div>
    );
}
