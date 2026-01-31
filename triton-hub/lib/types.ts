export type Source = "canvas" | "email" | "piazza";

export type Category = "announcement" | "exam" | "assignment" | "event";

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
};

export type FilterType = "all" | "canvas" | "email" | "piazza" | "urgent" | Category;
