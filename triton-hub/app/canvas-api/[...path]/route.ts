import { canvasRequest } from "@/lib/canvas-server";
import { integrationUser, readCredential } from "@/lib/integrations-server";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join("/");
  if (!/^api\/v1\/(courses(?:\/\d+\/assignments)?|announcements)$/.test(path)) {
    return new Response(null, { status: 404 });
  }
  const user = await integrationUser();
  if (!user) return new Response(null, { status: 401 });
  try {
    const token = await readCredential(user.id, "canvas");
    if (!token) return new Response(null, { status: 409 });
    const result = await canvasRequest(`/${path}${new URL(request.url).search}`, token);
    if (!result.ok) return new Response(null, { status: result.status });
    return Response.json(await result.json(), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
