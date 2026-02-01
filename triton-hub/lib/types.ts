export type Source = "canvas" | "email" | "piazza";

export type Category = "announcement" | "exam" | "assignment" | "event" | "grade" | "personal";

export type Update = {
  id: string;
  source: Source;
  category: Category;
  title: string;
  snippet: string;
  timestamp: Date;
  url: string;
  unread: boolean;
  priority?: "urgent" | "normal";
  course?: string;
  dueDate?: Date;
  isCompleted?: boolean;
  subCategory?: string;
};

export type Notification = {
  id: number;
  created_at: string;
  source: string;
  category: string;
  event_date: string;
  event_time: string;
  urgency: string;
  link: string;
  summary: string;
  user_id: string;
  completed: boolean;
};

export type FilterType = "all" | "canvas" | "email" | "piazza" | "urgent" | "classes" | Category;
