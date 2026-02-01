"use client";

import { useState, useMemo, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Megaphone, User, FileText, GraduationCap, ClipboardList, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fetchNotifications } from "@/lib/notifications";
import type { Notification } from "@/lib/types";
import {
  eventTypeColors,
  urgencyColors,
  type CalendarEvent,
  type EventType,
  type Urgency,
} from "@/lib/calendar-data";

const eventTypeIcons: Record<EventType, typeof Megaphone> = {
  announcement: Megaphone,
  personal: User,
  exam: FileText,
  event: Calendar,
  assignment: ClipboardList,
  grade: GraduationCap,
};

const eventTypeLabels: Record<EventType, string> = {
  announcement: "Announcement",
  personal: "Personal",
  exam: "Exam",
  event: "Event",
  assignment: "Assignment",
  grade: "Grade",
};

const urgencyLabels: Record<Urgency, string> = {
  urgent: "Urgent",
  medium: "Medium",
  low: "Low",
};

/**
 * Parse event_date and event_time into a Date object
 */
function parseNotificationDate(eventDate: string, eventTime: string, createdAt: string): Date {
  if (!eventDate || eventDate === "EMPTY") {
    return new Date(createdAt);
  }

  try {
    if (!eventTime || eventTime === "EMPTY") {
      return new Date(eventDate);
    }

    // Parse time like "11:59 PM PST"
    const timeMatch = eventTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const period = timeMatch[3].toUpperCase();

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      const date = new Date(eventDate);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    return new Date(eventDate);
  } catch {
    return new Date(createdAt);
  }
}

/**
 * Map notification category to calendar EventType
 */
function mapCategoryToEventType(category: string): EventType {
  const mapping: Record<string, EventType> = {
    announcement: "announcement",
    assignment: "assignment",
    exam: "exam",
    event: "event",
    personal: "personal",
    grade: "grade",
  };
  return mapping[category] || "event";
}

/**
 * Map notification urgency to calendar Urgency
 */
function mapUrgency(urgency: string): Urgency {
  if (urgency === "high") return "urgent";
  if (urgency === "medium") return "medium";
  return "low";
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterType, setFilterType] = useState<EventType | "all">("all");
  const [filterUrgency, setFilterUrgency] = useState<Urgency | "all">("all");

  // Fetch notifications from Supabase
  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const notifications = await fetchNotifications();

        const calendarEvents: CalendarEvent[] = notifications.map((notif: Notification) => {
          const date = parseNotificationDate(notif.event_date, notif.event_time, notif.created_at);
          const eventType = mapCategoryToEventType(notif.category);
          const urgency = mapUrgency(notif.urgency);

          // Extract time string for display
          let startTime: string | undefined;
          if (notif.event_time && notif.event_time !== "EMPTY") {
            startTime = notif.event_time.replace(/\s*(PST|PDT|EST|EDT|CST|CDT|MST|MDT)$/i, "").trim();
          }

          return {
            id: `notif-${notif.id}`,
            title: notif.summary,
            description: notif.summary,
            date,
            startTime,
            type: eventType,
            urgency,
            course: notif.source,
            link: notif.link !== "EMPTY" ? notif.link : undefined,
          };
        });

        setEvents(calendarEvents);
      } catch (error) {
        console.error("Failed to fetch calendar events:", error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);


  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get the day of week for the first day (0 = Sunday)
  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filterType !== "all" && event.type !== filterType) return false;
      if (filterUrgency !== "all" && event.urgency !== filterUrgency) return false;
      return true;
    });
  }, [filterType, filterUrgency, events]);

  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => isSameDay(event.date, day));
  };

  const selectedDateEvents = selectedDate
    ? filteredEvents
      .filter((event) => isSameDay(event.date, selectedDate))
      .sort((a, b) => {
        // Sort by urgency first (urgent > medium > low)
        const urgencyOrder = { urgent: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      })
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <div className="flex gap-1">
              <Button
                variant={filterType === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              {(Object.keys(eventTypeLabels) as EventType[]).map((type) => {
                const Icon = eventTypeIcons[type];
                return (
                  <Button
                    key={type}
                    variant={filterType === type ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setFilterType(type)}
                    className="gap-1"
                  >
                    <Icon className={cn("h-3 w-3", eventTypeColors[type].text)} />
                    <span className="hidden sm:inline">{eventTypeLabels[type]}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Urgency:</span>
            <div className="flex gap-1">
              <Button
                variant={filterUrgency === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setFilterUrgency("all")}
              >
                All
              </Button>
              {(Object.keys(urgencyLabels) as Urgency[]).map((urgency) => (
                <Button
                  key={urgency}
                  variant={filterUrgency === urgency ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilterUrgency(urgency)}
                  className="gap-1"
                >
                  <span className={cn("h-2 w-2 rounded-full", urgencyColors[urgency].dot)} />
                  <span className="hidden sm:inline">{urgencyLabels[urgency]}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before the first of the month */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-[100px] p-2 border-b border-r border-border bg-muted/30"
              />
            ))}

            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[100px] p-2 border-b border-r border-border cursor-pointer transition-colors",
                    !isSameMonth(day, currentMonth) && "bg-muted/30 text-muted-foreground",
                    isSelected && "bg-primary/10",
                    !isSelected && "hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full",
                      isCurrentDay && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded truncate border-l-2",
                          eventTypeColors[event.type].bg,
                          eventTypeColors[event.type].border
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full inline-block mr-1", urgencyColors[event.urgency].dot)} />
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground px-1.5">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Event Types</p>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(eventTypeLabels) as EventType[]).map((type) => {
                const Icon = eventTypeIcons[type];
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={cn("w-3 h-3 rounded border-l-2", eventTypeColors[type].bg, eventTypeColors[type].border)} />
                    <Icon className={cn("h-3 w-3", eventTypeColors[type].text)} />
                    <span className="text-xs text-muted-foreground">{eventTypeLabels[type]}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Urgency</p>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(urgencyLabels) as Urgency[]).map((urgency) => (
                <div key={urgency} className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", urgencyColors[urgency].dot)} />
                  <span className="text-xs text-muted-foreground">{urgencyLabels[urgency]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Events Panel */}
      <div className="lg:w-80">
        <div className="rounded-lg border border-border bg-card p-4 sticky top-20">
          <h3 className="font-semibold text-foreground mb-1">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
          </h3>
          {selectedDate && isToday(selectedDate) && (
            <p className="text-xs text-primary mb-3">Today</p>
          )}

          {selectedDateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="space-y-3 mt-4">
              {selectedDateEvents.map((event) => {
                const Icon = eventTypeIcons[event.type];
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "p-3 rounded-lg border-l-4",
                      eventTypeColors[event.type].bg,
                      eventTypeColors[event.type].border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4 shrink-0", eventTypeColors[event.type].text)} />
                        <span className="font-medium text-sm">{event.title}</span>
                      </div>
                      <span className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", urgencyColors[event.urgency].dot)} />
                    </div>
                    {event.course && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">{event.course}</p>
                    )}
                    {event.startTime && (
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {event.startTime}
                        {event.endTime && ` - ${event.endTime}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 ml-6">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 ml-6">
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", urgencyColors[event.urgency].bg, urgencyColors[event.urgency].text)}>
                        {urgencyLabels[event.urgency]}
                      </span>
                      <span className={cn("text-xs px-1.5 py-0.5 rounded", eventTypeColors[event.type].bg, eventTypeColors[event.type].text)}>
                        {eventTypeLabels[event.type]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
