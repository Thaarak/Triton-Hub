import { supabase } from "./supabase";
import type { Update, Category, Notification } from "./types";

/**
 * Fetch notifications for the current authenticated user from Supabase.
 * RLS policies ensure users only see their own notifications.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return data || [];
}

/**
 * Parse event_date and event_time from notifications table into a Date object.
 * Returns null if the date is "EMPTY" or invalid.
 */
function parseEventDateTime(eventDate: string, eventTime: string): Date | null {
  if (!eventDate || eventDate === "EMPTY") {
    return null;
  }

  try {
    // eventDate format: "2026-01-31"
    // eventTime format: "11:59 PM PST" or "EMPTY"
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
    return null;
  }
}

/**
 * Map notification category to Update category.
 * "personal" maps to "event" for display purposes.
 */
function mapCategory(category: string): Category {
  const validCategories: Category[] = ["announcement", "exam", "assignment", "event", "grade", "personal"];
  if (validCategories.includes(category as Category)) {
    // "personal" items are displayed as events
    if (category === "personal") return "event";
    return category as Category;
  }
  return "event"; // Default fallback
}

/**
 * Safely parse a date string, returning current date if invalid.
 */
function safeParseDate(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return new Date(); // Return current date as fallback
  }
  return date;
}

/**
 * Transform Supabase notifications into the Update[] format used by the dashboard.
 */
export function transformToUpdates(notifications: Notification[]): Update[] {
  const now = new Date();

  return notifications.map((notif) => {
    const eventDateTime = parseEventDateTime(notif.event_date, notif.event_time);
    const category = mapCategory(notif.category);

    // Determine priority based on urgency
    const priority: "urgent" | "normal" = notif.urgency === "high" ? "urgent" : "normal";

    // Use event date/time if available, otherwise fall back to created_at
    const timestamp = eventDateTime || safeParseDate(notif.created_at);

    // For assignments, check if they're urgent (due within 2 days)
    const isAssignment = category === "assignment";
    const isUrgentByDate = isAssignment && eventDateTime &&
      (eventDateTime.getTime() - now.getTime() < 86400000 * 2) &&
      (eventDateTime.getTime() > now.getTime());

    return {
      id: `notif-${notif.id}`,
      source: "canvas" as const, // Default source, can be enhanced later
      category,
      title: notif.summary,
      snippet: notif.summary,
      timestamp,
      url: notif.link !== "EMPTY" ? notif.link : "",
      unread: true, // Default to unread
      priority: isUrgentByDate ? "urgent" : priority,
      course: notif.source, // Use source field as course name
      dueDate: eventDateTime || undefined,
      isCompleted: false, // Default to not completed
    };
  });
}

/**
 * Fetch notifications and transform them to Update[] format in one call.
 */
export async function fetchAndTransformNotifications(): Promise<Update[]> {
  const notifications = await fetchNotifications();
  return transformToUpdates(notifications);
}
