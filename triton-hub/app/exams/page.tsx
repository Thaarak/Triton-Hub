import { CategoryFeed } from "@/components/dashboard/category-feed";

export default function ExamsPage() {
  return (
    <CategoryFeed
      category="exam"
      title="Exams"
      description="Upcoming quizzes, midterms, and final exams"
    />
  );
}
