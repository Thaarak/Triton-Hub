export async function needsCanvasSetup(): Promise<boolean> {
  const response = await fetch("/api/integrations/canvas", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not check the Canvas connection.");
  const { connected } = await response.json();
  return !connected;
}
