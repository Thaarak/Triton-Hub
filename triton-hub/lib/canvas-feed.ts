import type { Notification } from "./types";
import { getCanvasCourses } from "./canvas";

type CanvasAssignment = {
  id: number; course_id: number; due_at: string | null; html_url?: string;
  name?: string; submission?: { workflow_state?: string };
};

type CanvasAnnouncement = {
  id: number; context_code?: string; posted_at?: string; html_url?: string; title?: string;
};

/** Stable synthetic negative ids (avoid collision with positive DB ids). */
function syntheticAssignmentId(canvasAssignmentId: number): number {
  return -(1_000_000_000 + (canvasAssignmentId % 999_999_999));
}

function syntheticAnnouncementId(canvasAnnouncementId: number): number {
  return -(2_000_000_000 + (canvasAnnouncementId % 999_999_999));
}

function formatDueDateParts(dueAt: string | null): { event_date: string; event_time: string } {
  if (!dueAt) return { event_date: "EMPTY", event_time: "EMPTY" };
  try {
    const d = new Date(dueAt);
    if (isNaN(d.getTime())) return { event_date: "EMPTY", event_time: "EMPTY" };
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const timeStr = `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
    return { event_date: `${y}-${m}-${day}`, event_time: timeStr };
  } catch {
    return { event_date: "EMPTY", event_time: "EMPTY" };
  }
}

function urgencyFromDue(dueAt: string | null): "high" | "medium" | "low" {
  if (!dueAt) return "medium";
  const d = new Date(dueAt);
  if (isNaN(d.getTime())) return "medium";
  const diff = d.getTime() - Date.now();
  if (diff < 0) return "low";
  if (diff < 2 * 86400000) return "high";
  return "medium";
}

/** Map the signed-in student’s Canvas data to the unified feed. */
export async function fetchCanvasMergeNotifications(): Promise<Notification[]> {
  const base = "/canvas-api";
  const filteredCourses = await getCanvasCourses();

  const assignmentPromises = filteredCourses.map(async (course): Promise<CanvasAssignment[]> => {
    const url = `${base}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=50&order_by=due_at`;
    const res = await fetch(url);
    return res.ok ? await res.json() : [];
  });

  const annPromises = filteredCourses.map(async (course): Promise<CanvasAnnouncement[]> => {
    const url = `${base}/api/v1/announcements?context_codes[]=course_${course.id}&per_page=10`;
    const res = await fetch(url);
    return res.ok ? await res.json() : [];
  });

  const [allAssignsRaw, allAnnsRaw] = await Promise.all([
    Promise.all(assignmentPromises),
    Promise.all(annPromises),
  ]);

  const nowIso = new Date().toISOString();
  const syntheticUser = "canvas";

  const assignmentNotifs: Notification[] = allAssignsRaw.flat().map((a) => {
    const course = filteredCourses.find((c) => c.id === a.course_id);
    const courseName = course?.name || "Course";
    const { event_date, event_time } = formatDueDateParts(a.due_at);
    const id = syntheticAssignmentId(Number(a.id));
    return {
      id,
      created_at: nowIso,
      source: courseName,
      category: "assignment",
      event_date,
      event_time,
      urgency: urgencyFromDue(a.due_at),
      link: a.html_url || "EMPTY",
      summary: a.name || "Assignment",
      user_id: syntheticUser,
      completed: a.submission?.workflow_state === "graded" || a.submission?.workflow_state === "submitted",
    };
  });

  const announcementNotifs: Notification[] = allAnnsRaw.flat().map((a) => {
    const courseId = parseInt(String(a.context_code || "").replace("course_", ""), 10);
    const course = filteredCourses.find((c) => c.id === courseId);
    const courseName = course?.name || "Course";
    const posted = a.posted_at ? new Date(a.posted_at) : new Date();
    const y = posted.getFullYear();
    const m = String(posted.getMonth() + 1).padStart(2, "0");
    const day = String(posted.getDate()).padStart(2, "0");
    const id = syntheticAnnouncementId(Number(a.id));
    return {
      id,
      created_at: a.posted_at || nowIso,
      source: courseName,
      category: "announcement",
      event_date: `${y}-${m}-${day}`,
      event_time: "EMPTY",
      urgency: "medium" as const,
      link: a.html_url || "EMPTY",
      summary: a.title || "Announcement",
      user_id: syntheticUser,
      completed: false,
    };
  });

  return [...assignmentNotifs, ...announcementNotifs];
}

export function mergeNotificationsDedupe(
  supabaseRows: Notification[],
  canvasRows: Notification[]
): Notification[] {
  const key = (n: Notification) =>
    `${n.source}|${n.summary}|${n.event_date}|${n.category}`;
  const seen = new Set(supabaseRows.map(key));
  const merged = [...supabaseRows];
  for (const c of canvasRows) {
    if (!seen.has(key(c))) {
      merged.push(c);
      seen.add(key(c));
    }
  }
  return merged;
}
