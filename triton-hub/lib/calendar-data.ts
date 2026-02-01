export type EventType = "announcement" | "personal" | "exam" | "class" | "assignment";
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
  class: {
    bg: "bg-green-500/20",
    border: "border-l-green-500",
    text: "text-green-400",
  },
  assignment: {
    bg: "bg-pink-500/20",
    border: "border-l-pink-500",
    text: "text-pink-400",
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

// Mock calendar data
const today = new Date();
const getDate = (daysOffset: number) => {
  const date = new Date(today);
  date.setDate(today.getDate() + daysOffset);
  return date;
};

export const mockCalendarEvents: CalendarEvent[] = [
  // Today's events
  {
    id: "1",
    title: "CSE 110 Midterm",
    description: "Covers chapters 1-5, bring pencil and calculator",
    date: getDate(0),
    startTime: "10:00 AM",
    endTime: "11:50 AM",
    type: "exam",
    urgency: "urgent",
    course: "CSE 110",
  },
  {
    id: "2",
    title: "CSE 110 Lecture",
    description: "Software Engineering principles",
    date: getDate(0),
    startTime: "2:00 PM",
    endTime: "3:20 PM",
    type: "class",
    urgency: "low",
    course: "CSE 110",
  },
  {
    id: "3",
    title: "CSE 101 Assignment 3 Due",
    description: "Submit on Gradescope by 11:59 PM",
    date: getDate(0),
    startTime: "11:59 PM",
    type: "assignment",
    urgency: "urgent",
    course: "CSE 101",
  },

  // Tomorrow
  {
    id: "4",
    title: "Study Group Meeting",
    description: "Meet at Geisel Library 2nd floor",
    date: getDate(1),
    startTime: "4:00 PM",
    endTime: "6:00 PM",
    type: "personal",
    urgency: "medium",
  },
  {
    id: "5",
    title: "MATH 20C Discussion",
    description: "Review session for quiz",
    date: getDate(1),
    startTime: "1:00 PM",
    endTime: "1:50 PM",
    type: "class",
    urgency: "low",
    course: "MATH 20C",
  },

  // Day after tomorrow
  {
    id: "6",
    title: "Office Hours - Prof. Smith",
    description: "Questions about project requirements",
    date: getDate(2),
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    type: "personal",
    urgency: "medium",
  },
  {
    id: "7",
    title: "Quiz 4 Released",
    description: "Available on Canvas until Friday",
    date: getDate(2),
    type: "announcement",
    urgency: "medium",
    course: "CSE 110",
  },

  // This week
  {
    id: "8",
    title: "CSE 101 Final Exam",
    description: "Comprehensive final, covers all material",
    date: getDate(5),
    startTime: "8:00 AM",
    endTime: "10:59 AM",
    type: "exam",
    urgency: "urgent",
    course: "CSE 101",
  },
  {
    id: "9",
    title: "Project Demo",
    description: "Present final project to TA",
    date: getDate(4),
    startTime: "2:00 PM",
    endTime: "2:30 PM",
    type: "class",
    urgency: "urgent",
    course: "CSE 110",
  },
  {
    id: "10",
    title: "Career Fair",
    description: "Price Center West Ballroom",
    date: getDate(3),
    startTime: "10:00 AM",
    endTime: "3:00 PM",
    type: "personal",
    urgency: "low",
  },

  // Next week
  {
    id: "11",
    title: "MATH 20C Midterm 2",
    description: "Sections 12.1-14.5",
    date: getDate(8),
    startTime: "7:00 PM",
    endTime: "8:50 PM",
    type: "exam",
    urgency: "medium",
    course: "MATH 20C",
  },
  {
    id: "12",
    title: "Spring Quarter Registration",
    description: "Check WebReg for enrollment time",
    date: getDate(7),
    type: "announcement",
    urgency: "medium",
  },
  {
    id: "13",
    title: "Gym Session",
    description: "RIMAC Arena - Basketball",
    date: getDate(6),
    startTime: "6:00 PM",
    endTime: "8:00 PM",
    type: "personal",
    urgency: "low",
  },
  {
    id: "14",
    title: "CSE 110 Lecture",
    description: "Final review session",
    date: getDate(6),
    startTime: "2:00 PM",
    endTime: "3:20 PM",
    type: "class",
    urgency: "low",
    course: "CSE 110",
  },
  // Assignments
  {
    id: "15",
    title: "CSE 110 PA5 Due",
    description: "Programming Assignment 5 - Graph algorithms implementation",
    date: getDate(3),
    startTime: "11:59 PM",
    type: "assignment",
    urgency: "urgent",
    course: "CSE 110",
  },
  {
    id: "16",
    title: "MATH 20C Homework 7",
    description: "WebAssign homework on integration techniques",
    date: getDate(4),
    startTime: "11:59 PM",
    type: "assignment",
    urgency: "medium",
    course: "MATH 20C",
  },
  {
    id: "17",
    title: "CSE 30 Lab 6",
    description: "Assembly language lab submission",
    date: getDate(2),
    startTime: "11:59 PM",
    type: "assignment",
    urgency: "medium",
    course: "CSE 30",
  },
  {
    id: "18",
    title: "CSE 101 PA6 Due",
    description: "Dynamic programming assignment",
    date: getDate(9),
    startTime: "11:59 PM",
    type: "assignment",
    urgency: "low",
    course: "CSE 101",
  },
];
