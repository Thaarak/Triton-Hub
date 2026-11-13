const CANVAS_ORIGIN = "https://canvas.ucsd.edu";

export async function canvasRequest(path: string, token: string) {
  return fetch(`${CANVAS_ORIGIN}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12000),
  });
}
