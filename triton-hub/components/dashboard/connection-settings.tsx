"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Connection = { connected: boolean; configured?: boolean };

export function ConnectionSettings() {
  const [canvas, setCanvas] = useState<Connection>();
  const [gmail, setGmail] = useState<Connection>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const gmailResult = useSearchParams().get("gmail");

  useEffect(() => {
    let active = true;
    async function load() {
      const responses = await Promise.all(
        ["canvas", "gmail"].map((provider) => fetch(`/api/integrations/${provider}`, { cache: "no-store" })),
      );
      if (!responses.every((response) => response.ok)) throw new Error();
      const [canvasStatus, gmailStatus] = await Promise.all(responses.map((response) => response.json()));
      if (active) { setCanvas(canvasStatus); setGmail(gmailStatus); }
    }
    void load().catch(() => { if (active) setMessage("Could not load connection settings."); });
    return () => { active = false; };
  }, []);

  async function update(provider: "canvas" | "gmail", connect: boolean) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/integrations/${provider}${connect ? "/connect" : ""}`, {
        method: connect ? "POST" : "DELETE",
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || "Could not update the connection.");
      if (connect) {
        const { url } = await response.json();
        window.location.assign(url);
      } else if (provider === "canvas") {
        setCanvas({ connected: false });
        setMessage("Canvas disconnected.");
      } else {
        setGmail({ connected: false, configured: true });
        setMessage("Gmail disconnected.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-5 rounded-[28px] border border-white/10 bg-card/80 p-6">
      <h2 className="text-lg font-semibold">Connections</h2>
      {(message || gmailResult) && (
        <p role="status" className="text-sm text-muted-foreground">
          {message || (gmailResult === "connected" ? "Gmail connected." : "Gmail authorization did not finish. Try connecting again.")}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">UCSD Canvas</h3>
          <p className="text-sm text-muted-foreground">{canvas?.connected ? "Connected" : "Connect Canvas to load courses and assignments."}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/setup?edit=1">{canvas?.connected ? "Replace token" : "Connect Canvas"}</Link></Button>
          {canvas?.connected && <Button variant="outline" disabled={busy} onClick={() => void update("canvas", false)}>Disconnect Canvas</Button>}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div>
          <h3 className="font-medium">Gmail</h3>
          <p className="text-sm text-muted-foreground">Optional read-only connection for academic email.</p>
          {gmail?.configured === false && <p className="text-sm text-muted-foreground">Gmail is unavailable on this deployment.</p>}
        </div>
        {gmail?.configured && (
          <Button variant="outline" disabled={busy} onClick={() => void update("gmail", !gmail.connected)}>
            {gmail.connected ? "Disconnect Gmail" : "Connect Gmail"}
          </Button>
        )}
      </div>
    </section>
  );
}
