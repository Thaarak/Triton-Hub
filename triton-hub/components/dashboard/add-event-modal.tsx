"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNotification, type CreateNotificationInput } from "@/lib/notifications";
import { toast } from "sonner";

const categoryOptions = [
  { value: "event", label: "Event" },
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "announcement", label: "Announcement" },
  { value: "personal", label: "Personal" },
];

const urgencyOptions = [
  { value: "high", label: "High (Urgent)" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface AddEventModalProps {
  onEventAdded?: () => void;
  selectedDate?: Date | null;
}

export function AddEventModal({ onEventAdded, selectedDate }: AddEventModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [category, setCategory] = useState("event");
  const [eventDate, setEventDate] = useState(
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [eventTime, setEventTime] = useState("");
  const [urgency, setUrgency] = useState<"high" | "medium" | "low">("medium");
  const [link, setLink] = useState("");

  // Reset form when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset to defaults when opening
      setSummary("");
      setSource("");
      setCategory("event");
      setEventDate(
        selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
      );
      setEventTime("");
      setUrgency("medium");
      setLink("");
    }
    setOpen(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!summary.trim()) {
      toast.error("Please enter a description for the event");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format time if provided (convert from 24h input to 12h format)
      let formattedTime = "EMPTY";
      if (eventTime) {
        const [hours, minutes] = eventTime.split(":");
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? "PM" : "AM";
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        formattedTime = `${hour12}:${minutes} ${period}`;
      }

      const input: CreateNotificationInput = {
        summary: summary.trim(),
        source: source.trim() || "Personal",
        category,
        event_date: eventDate || "EMPTY",
        event_time: formattedTime,
        urgency,
        link: link.trim() || "EMPTY",
      };

      await createNotification(input);
      toast.success("Event added successfully!");
      setOpen(false);
      onEventAdded?.();
    } catch (error) {
      console.error("Failed to create event:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to add event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event or reminder. It will appear on your calendar and notifications.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Summary/Description */}
            <div className="grid gap-2">
              <Label htmlFor="summary">Description *</Label>
              <Textarea
                id="summary"
                placeholder="What is this event about?"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Source/Course */}
            <div className="grid gap-2">
              <Label htmlFor="source">Source / Course</Label>
              <Input
                id="source"
                placeholder="e.g., CSE 110, Personal, Work"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>

            {/* Category and Urgency in a row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select
                  value={urgency}
                  onValueChange={(val) => setUrgency(val as "high" | "medium" | "low")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    {urgencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time in a row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="event-time">Time (optional)</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>

            {/* Link */}
            <div className="grid gap-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
