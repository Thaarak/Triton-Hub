import { CategoryFeed } from "@/components/dashboard/category-feed";

export default function AssignmentsPage() {
  return (
    <CategoryFeed
      category="assignment"
      title="Assignments"
      description="Homework, projects, and lab submissions"
    />
  );
}
