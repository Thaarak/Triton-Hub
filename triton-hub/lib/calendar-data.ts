export type EventType = "announcement" | "personal" | "exam" | "event" | "assignment" | "grade";
export type Urgency = "urgent" | "medium" | "low";

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: EventType;
  urgency: Urgency;
  course?: string;
  link?: string;
};

// Color mappings for event types
export const eventTypeColors: Record<EventType, { bg: string; border: string; text: string }> = {
  announcement: {
    bg: "bg-blue-500/20",
    border: "border-l-blue-500",
    text: "text-blue-400",
  },
  personal: {
    bg: "bg-purple-500/20",
    border: "border-l-purple-500",
    text: "text-purple-400",
  },
  exam: {
    bg: "bg-orange-500/20",
    border: "border-l-orange-500",
    text: "text-orange-400",
  },
  event: {
    bg: "bg-green-500/20",
    border: "border-l-green-500",
    text: "text-green-400",
  },
  assignment: {
    bg: "bg-pink-500/20",
    border: "border-l-pink-500",
    text: "text-pink-400",
  },
  grade: {
    bg: "bg-emerald-500/20",
    border: "border-l-emerald-500",
    text: "text-emerald-400",
  },
};

// Color mappings for urgency
export const urgencyColors: Record<Urgency, { bg: string; text: string; dot: string }> = {
  urgent: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    dot: "bg-red-500",
  },
  medium: {
    bg: "bg-yellow-500/20",
    text: "text-yellow-400",
    dot: "bg-yellow-500",
  },
  low: {
    bg: "bg-green-500/20",
    text: "text-green-400",
    dot: "bg-green-500",
  },
};
