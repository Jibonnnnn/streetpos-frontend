import { ordersService } from "@/services/orders.service";
import {
  getQueuedOrders,
  removeQueuedOrder,
  updateQueuedOrder,
} from "./orderQueue";
import type { QueuedOrder } from "./db";

export type SyncResult = {
  synced: number;
  failed: number;
  remaining: number;
  errors: { id: string; localOrderNumber: string; message: string }[];
};

let syncInFlight: Promise<SyncResult> | null = null;

function isNetworkError(err: unknown): boolean {
  const e = err as { code?: string; message?: string; response?: unknown };
  if (!e) return true;
  if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED") return true;
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (e.response === undefined && e.message) return true;
  return false;
}

function errorMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string; title?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.message ||
    e?.response?.data?.title ||
    e?.message ||
    "Unknown sync error"
  );
}

function isClientError(err: unknown): boolean {
  const status = (err as { response?: { status?: number } })?.response?.status;
  return typeof status === "number" && status >= 400 && status < 500;
}

async function syncOne(q: QueuedOrder): Promise<"synced" | "failed" | "retry"> {
  await updateQueuedOrder(q.id, {
    status: "syncing",
    attempts: q.attempts + 1,
    lastAttemptAt: new Date().toISOString(),
  });

  let serverOrderId = q.serverOrderId;

  try {
    if (!serverOrderId) {
      const createRes = await ordersService.createOrder(q.orderPayload);
      const data = createRes.data as { id?: number; orderNumber?: string };
      if (!data?.id) throw new Error("Server did not return an order id");
      serverOrderId = data.id;
      await updateQueuedOrder(q.id, {
        serverOrderId,
        serverOrderNumber: data.orderNumber,
      });
    }

    await ordersService.checkoutOrder({
      orderId: serverOrderId,
      paymentMethod: q.checkoutPayload.paymentMethod,
      amountTendered: q.checkoutPayload.amountTendered,
      transactionId: q.checkoutPayload.transactionId,
      notes: q.checkoutPayload.notes ?? "",
      promotionId: q.checkoutPayload.promotionId ?? undefined,
      customerName: q.checkoutPayload.customerName,
    });

    await updateQueuedOrder(q.id, { status: "synced", lastError: undefined });
    await removeQueuedOrder(q.id);
    return "synced";
  } catch (err) {
    if (isNetworkError(err)) {
      await updateQueuedOrder(q.id, {
        status: "pending",
        lastError: "Network error — will retry when online",
      });
      return "retry";
    }
    if (isClientError(err)) {
      await updateQueuedOrder(q.id, {
        status: "failed",
        lastError: errorMessage(err),
      });
      return "failed";
    }
    await updateQueuedOrder(q.id, {
      status: "pending",
      lastError: errorMessage(err),
    });
    return "retry";
  }
}

export async function syncOfflineOrderQueue(): Promise<SyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const remaining = (await getQueuedOrders()).filter(
      (q) => q.status !== "synced",
    ).length;
    return { synced: 0, failed: 0, remaining, errors: [] };
  }

  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const result: SyncResult = {
      synced: 0,
      failed: 0,
      remaining: 0,
      errors: [],
    };

    const queue = (await getQueuedOrders()).filter(
      (q) =>
        q.status === "pending" ||
        q.status === "failed" ||
        q.status === "syncing",
    );

    for (const q of queue) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      const outcome = await syncOne(q);
      if (outcome === "synced") result.synced += 1;
      else if (outcome === "failed") {
        result.failed += 1;
        const fresh = await getQueuedOrders();
        const row = fresh.find((x) => x.id === q.id);
        result.errors.push({
          id: q.id,
          localOrderNumber: q.localOrderNumber,
          message: row?.lastError || "Failed",
        });
      }
    }

    result.remaining = (await getQueuedOrders()).filter(
      (q) => q.status !== "synced",
    ).length;
    return result;
  })().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}