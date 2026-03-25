export type NotificationSourceFilter = "both" | "email" | "canvas";

const SOURCE_FILTER_KEY = "triton_source_filter";
const DISPLAY_NAME_KEY = "triton_display_name";
const AVATAR_URL_KEY = "triton_avatar_url";

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getNotificationSourceFilter(): NotificationSourceFilter {
  if (!hasStorage()) return "both";
  const raw = localStorage.getItem(SOURCE_FILTER_KEY);
  if (raw === "email" || raw === "canvas" || raw === "both") return raw;
  return "both";
}

export function setNotificationSourceFilter(value: NotificationSourceFilter): void {
  if (!hasStorage()) return;
  localStorage.setItem(SOURCE_FILTER_KEY, value);
}

export function getLocalDisplayName(): string {
  if (!hasStorage()) return "";
  return localStorage.getItem(DISPLAY_NAME_KEY) || "";
}

export function setLocalDisplayName(value: string): void {
  if (!hasStorage()) return;
  localStorage.setItem(DISPLAY_NAME_KEY, value);
}

export function getLocalAvatarUrl(): string {
  if (!hasStorage()) return "";
  return localStorage.getItem(AVATAR_URL_KEY) || "";
}

export function setLocalAvatarUrl(value: string): void {
  if (!hasStorage()) return;
  localStorage.setItem(AVATAR_URL_KEY, value);
}
