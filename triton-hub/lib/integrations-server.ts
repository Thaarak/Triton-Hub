import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseKey, supabaseUrl } from "./auth-config";

type Provider = "canvas" | "gmail";

export async function integrationUser() {
  if (!supabaseUrl || !supabaseKey) return null;
  const cookieStore = await cookies();
  const client = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values: { name: string; value: string; options: CookieOptions }[]) => values.forEach(({ name, value, options }) =>
        cookieStore.set(name, value, options)),
    },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

function encryptionKey() {
  const encoded = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!encoded || !/^[a-f0-9]{64}$/i.test(encoded)) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY must contain 64 hexadecimal characters");
  }
  return Buffer.from(encoded, "hex");
}

function store() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) throw new Error("Integration storage is not configured");
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).from("integration_credentials");
}

export async function readCredential(userId: string, provider: Provider) {
  const { data, error } = await store().select("encrypted_token")
    .eq("user_id", userId).eq("provider", provider).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [iv, tag, ciphertext] = data.encrypted_token.split(".").map((part: string) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAAD(Buffer.from(`${userId}:${provider}`));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function writeCredential(userId: string, provider: Provider, token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(`${userId}:${provider}`));
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const encrypted = [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
  const { error } = await store().upsert({
    user_id: userId, provider, encrypted_token: encrypted, updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function removeCredential(userId: string, provider: Provider) {
  const { error } = await store().delete().eq("user_id", userId).eq("provider", provider);
  if (error) throw error;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.url;
  return origin !== null && origin === new URL(allowedOrigin).origin;
}
