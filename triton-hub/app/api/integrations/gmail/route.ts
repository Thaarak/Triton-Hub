import { gmailConfig } from "@/lib/gmail-server";
import { integrationUser, readCredential, removeCredential, sameOrigin } from "@/lib/integrations-server";

export async function GET() {
  const user = await integrationUser();
  if (!user) return new Response(null, { status: 401 });
  if (!gmailConfig()) return Response.json({ configured: false, connected: false });
  try {
    return Response.json({ configured: true, connected: Boolean(await readCredential(user.id, "gmail")) });
  } catch {
    return Response.json({ error: "Gmail storage is unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const user = await integrationUser();
  if (!user) return new Response(null, { status: 401 });
  try {
    await removeCredential(user.id, "gmail");
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Could not disconnect Gmail." }, { status: 503 });
  }
}
