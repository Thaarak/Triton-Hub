import { CategoryFeed } from "@/components/dashboard/category-feed";

export default function AnnouncementsPage() {
  return (
    <CategoryFeed
      category="announcement"
      title="Announcements"
      description="Important updates from your courses and instructors"
    />
  );
}
