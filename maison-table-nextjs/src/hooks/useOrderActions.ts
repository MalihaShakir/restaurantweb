"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

/** Wraps all order mutation API calls with optimistic loading and toast feedback. */
export function useOrderActions(onSuccess?: () => void) {
  const [busy, setBusy] = useState<string | null>(null);

  async function call(
    url: string,
    method: "PATCH" | "POST",
    body: Record<string, unknown>,
    successMsg: string,
  ) {
    // Extract the order _id from the URL pattern /api/v1/admin/orders/<id>/...
    const parts = url.split("/");
    const id = parts[5] ?? url;
    setBusy(id);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error ?? "Action failed"); return false; }
      toast.success(successMsg);
      onSuccess?.();
      return true;
    } catch {
      toast.error("Network error — please try again");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return {
    busy,
    updateStatus: (orderId: string, status: string) =>
      call(`/api/v1/admin/orders/${orderId}/status`, "PATCH", { status },
        `Order moved to "${status.replace(/_/g, " ")}"`),
    collectCod: (orderId: string) =>
      call(`/api/v1/admin/orders/${orderId}/collect-cod`, "POST", {}, "Cash collected ✓"),
    assignRider: (orderId: string, riderId: string) =>
      call(`/api/v1/admin/orders/${orderId}/assign-rider`, "POST", { riderId }, "Rider assigned ✓"),
  };
}

/** Plays a short beep when pending order count increases. Returns mute controls. */
export function useNewOrderAlert(count: number) {
  const [muted, setMuted] = useState(false);
  const prev = useRef(count);

  useEffect(() => {
    if (!muted && count > prev.current) {
      try {
        const AudioCtx = window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx  = new AudioCtx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } catch { /* audio not available — ignore */ }
    }
    prev.current = count;
  }, [count, muted]);

  return { muted, toggleMute: () => setMuted(v => !v) };
}
