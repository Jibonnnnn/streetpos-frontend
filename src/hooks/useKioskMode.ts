import { useEffect, useRef } from "react";

/**
 * Keeps the POS screen fullscreen and awake while mounted.
 *
 * - Requests fullscreen on mount (best-effort; browsers require a user
 *   gesture for this to succeed, so it also re-requests on the first
 *   click/tap if the initial silent attempt was blocked).
 * - Acquires a Screen Wake Lock so the display doesn't sleep mid-transaction.
 * - Re-acquires the wake lock automatically if the tab regains visibility
 *   (the lock is released by the browser when the tab is hidden).
 * - Cleans up (exits fullscreen, releases the lock) on unmount, so leaving
 *   the Cashier page doesn't leave the rest of the app stuck in kiosk mode.
 *
 * Safe to call even in browsers that don't support these APIs — every call
 * is guarded and failures are swallowed, since kiosk mode is a nice-to-have,
 * not something that should ever break the POS.
 */
export function useKioskMode(enabled: boolean = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const requestFullscreen = async () => {
      if (document.fullscreenElement) return;
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        // Blocked (usually because there was no user gesture yet).
        // We fall back to requesting on the next user interaction below.
      }
    };

    const requestWakeLock = async () => {
      if (!("wakeLock" in navigator)) return;
      try {
        const lock = await (navigator as any).wakeLock.request("screen");
        if (cancelled) {
          lock.release();
          return;
        }
        wakeLockRef.current = lock;
      } catch {
        // Wake lock can fail if the tab isn't visible yet; harmless.
      }
    };

    const handleFirstInteraction = () => {
      requestFullscreen();
      window.removeEventListener("pointerdown", handleFirstInteraction);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    requestFullscreen();
    requestWakeLock();

    window.addEventListener("pointerdown", handleFirstInteraction, {
      once: true,
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", handleFirstInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled]);
}