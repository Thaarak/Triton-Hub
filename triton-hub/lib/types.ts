export type Source = "canvas" | "email" | "piazza";

export type Category = "announcement" | "exam" | "assignment" | "event" | "grade";

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

export type FilterType = "all" | "canvas" | "email" | "piazza" | "urgent" | "classes" | Category;
