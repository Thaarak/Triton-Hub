import { CategoryFeed } from "@/components/dashboard/category-feed";

export default function EventsPage() {
  return (
    <CategoryFeed
      category="event"
      title="Events"
      description="Study groups, office hours, and campus events"
    />
  );
}
