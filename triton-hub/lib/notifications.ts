import { supabase } from "./supabase";
import type { Update, Category, Notification } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

/**
 * Fetch notifications for the current authenticated user.
 * Uses Supabase session when signed in with email/password, or backend session token when signed in with Google OAuth.
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
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

  // Google OAuth: no Supabase session; use backend session token
  const backendToken = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("triton_session_token") : null;
  if (backendToken) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/profile/notifications`, {
        headers: { Authorization: `Bearer ${backendToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      }
    } catch (e) {
      console.error("Error fetching notifications from backend:", e);
    }
  }

  return [];
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

/**
 * Input type for creating a new notification/event.
 */
export type CreateNotificationInput = {
  source: string;
  category: string;
  event_date: string; // Format: "YYYY-MM-DD" or "EMPTY"
  event_time: string; // Format: "HH:MM AM/PM" or "EMPTY"
  urgency: "high" | "medium" | "low";
  link: string;
  summary: string;
};

/**
 * Create a new notification for the current authenticated user.
 * Returns the created notification or throws an error.
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error("No Supabase session found. User must be logged in.");
    throw new Error("You must be logged in to create an event");
  }

  console.log("Creating notification for user:", session.user.id);
  console.log("Notification data:", input);

  const insertData = {
    user_id: session.user.id,
    source: input.source,
    category: input.category,
    event_date: input.event_date || "EMPTY",
    event_time: input.event_time || "EMPTY",
    urgency: input.urgency,
    link: input.link || "EMPTY",
    summary: input.summary,
  };

  console.log("Inserting into Supabase:", insertData);

  const { data, error } = await supabase
    .from("notifications")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Error details:", error.details);
    throw new Error(`Failed to create event: ${error.message}`);
  }

  console.log("Successfully created notification:", data);
  return data;
}
