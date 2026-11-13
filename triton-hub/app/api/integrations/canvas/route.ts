import { canvasRequest } from "@/lib/canvas-server";
import { integrationUser, readCredential, removeCredential, sameOrigin, writeCredential } from "@/lib/integrations-server";

export async function GET() {
  const user = await integrationUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    return Response.json({ connected: Boolean(await readCredential(user.id, "canvas")) });
  } catch {
    return Response.json({ error: "Canvas storage is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const user = await integrationUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token || token.length > 2048) return Response.json({ error: "Enter a valid Canvas token." }, { status: 400 });
  try {
    const response = await canvasRequest("/api/v1/users/self/profile", token);
    if (!response.ok) {
      return Response.json({ error: response.status === 401 || response.status === 403
        ? "UCSD Canvas rejected this token. Create a new token and try again."
        : "UCSD Canvas is unavailable. Try again shortly." }, { status: response.status === 401 || response.status === 403 ? 400 : 502 });
    }
    await writeCredential(user.id, "canvas", token);
    return Response.json({ connected: true });
  } catch {
    return Response.json({ error: "Could not connect to Canvas. Try again or check your server settings." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const user = await integrationUser();
  if (!user) return new Response(null, { status: 401 });
  try {
    await removeCredential(user.id, "canvas");
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Could not disconnect Canvas." }, { status: 503 });
  }
}
