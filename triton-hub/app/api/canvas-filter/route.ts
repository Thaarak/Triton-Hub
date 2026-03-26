import { NextResponse } from "next/server";

type CanvasItem = {
  id: number;
  source: string;   // course name
  category: string; // "assignment" | "announcement"
  summary: string;  // title
  event_date: string;
};

/**
 * Uses Gemini Flash to remove repetitive Canvas notifications within the same course.
 * Items from different courses are always preserved even if they have similar titles.
 * Assignments are never dropped — only announcements can be collapsed when redundant.
 * Falls back to all items if GEMINI_API_KEY is not set or the call fails.
 */
async function dedupeCanvasWithGemini(items: CanvasItem[]): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || items.length === 0) return items.map((i) => i.id);

  const list = items
    .map(
      (i) =>
        `ID: ${i.id} | Course: ${i.source} | Type: ${i.category} | Title: ${i.summary} | Date: ${i.event_date}`
    )
    .join("\n");

  const prompt = `You are deduplicating Canvas notifications for a student dashboard.

Rules:
1. ALWAYS keep every ASSIGNMENT, regardless of how similar the title is to another.
2. For ANNOUNCEMENTS: if two or more announcements in the SAME course have very similar titles or cover the same topic (e.g. multiple "Office Hours" reminders, duplicate "Week N" recap posts), keep only the most recent one (lowest list position = oldest, so prefer the one with the latest date or just pick one to keep).
3. ALWAYS keep announcements from DIFFERENT courses, even if titles sound the same.
4. When in doubt, keep the item.

Respond ONLY with a JSON array of the IDs to KEEP. Example: [123, 456, 789]
If unsure about any item, include its ID.

Canvas items:
${list}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    if (!res.ok) return items.map((i) => i.id);

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const keepIds = new Set<number>(JSON.parse(text) as number[]);
    // Safety: if Gemini returns nothing, fall back to all
    return keepIds.size > 0
      ? items.filter((i) => keepIds.has(i.id)).map((i) => i.id)
      : items.map((i) => i.id);
  } catch {
    return items.map((i) => i.id);
  }
}

export async function POST(request: Request) {
  let body: { items?: unknown };
  try {
    body = (await request.json()) as { items?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!Array.isArray(body.items)) {
    return NextResponse.json({ keepIds: [] });
  }

  const items = body.items as CanvasItem[];
  const keepIds = await dedupeCanvasWithGemini(items);
  return NextResponse.json({ keepIds });
}
