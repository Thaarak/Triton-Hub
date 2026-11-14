import type { Metadata } from "next";
import { DemoDashboard } from "@/components/demo/demo-dashboard";

export const metadata: Metadata = {
  title: "Triton Hub | Sample Dashboard",
  description: "Explore Triton Hub with fictional coursework, deadlines, and academic email.",
};

export default function DemoPage() {
  return <DemoDashboard />;
}
