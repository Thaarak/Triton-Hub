import type { Notification } from "./types";

/** Where the row came from in the app: live Canvas API vs inbox / DB sync (Gmail pipeline, manual adds). */
export type DataOrigin = "email" | "canvas";

/**
 * Synthetic rows merged from the browser Canvas API (see canvas-feed.ts).
 * Positive DB ids with a real user UUID are from Supabase (email pipeline or manual).
 */
export function isLiveCanvasNotification(notif: Pick<Notification, "id" | "user_id">): boolean {
  return notif.id < 0 || notif.user_id === "canvas";
}

export function getNotificationDataOrigin(notif: Pick<Notification, "id" | "user_id">): DataOrigin {
  return isLiveCanvasNotification(notif) ? "canvas" : "email";
}
