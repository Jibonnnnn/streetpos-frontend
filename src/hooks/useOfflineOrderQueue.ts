import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useOnlineStatus } from "./useOnlineStatus";
import {
  enqueueOfflineOrder,
  getPendingQueueCount,
  getQueuedOrders,
  type EnqueueOrderInput,
} from "@/lib/offline/orderQueue";
import {
  syncOfflineOrderQueue,
  type SyncResult,
} from "@/lib/offline/syncOrders";
import type { QueuedOrder } from "@/lib/offline/db";

/** POS-only. Mount only on Cashier — never on landing / public online order. */
export function useOfflineOrderQueue() {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [queue, setQueue] = useState<QueuedOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const wasOffline = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [count, items] = await Promise.all([
        getPendingQueueCount(),
        getQueuedOrders(),
      ]);
      setPendingCount(count);
      setQueue(items.filter((q) => q.status !== "synced"));
    } catch {
      /* IndexedDB unavailable */
    }
  }, []);

  const runSync = useCallback(async (): Promise<SyncResult | null> => {
    if (!navigator.onLine) return null;
    setIsSyncing(true);
    try {
      const result = await syncOfflineOrderQueue();
      await refresh();
      if (result.synced > 0) {
        toast.success(
          result.synced === 1
            ? "1 offline order synced to server"
            : `${result.synced} offline orders synced to server`,
        );
      }
      if (result.failed > 0) {
        toast.error(
          `${result.failed} offline order(s) could not sync — check queue`,
        );
      }
      return result;
    } catch (err) {
      console.error("[offline-sync]", err);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [refresh]);

  const enqueue = useCallback(
    async (input: EnqueueOrderInput) => {
      const record = await enqueueOfflineOrder(input);
      await refresh();
      return record;
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current || pendingCount > 0) {
      wasOffline.current = false;
      void runSync();
    }
  }, [isOnline, pendingCount, runSync]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void runSync();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [runSync]);

  return {
    isOnline,
    pendingCount,
    queue,
    isSyncing,
    enqueue,
    refresh,
    runSync,
  };
}