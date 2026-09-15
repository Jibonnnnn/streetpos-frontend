/**
 * POS-only offline order queue. Do not use from landing / online order flows.
 */

import {
  idbDelete,
  idbGet,
  idbGetAll,
  idbPut,
  STORE_ORDER_QUEUE,
  type OfflineCheckoutPayload,
  type OfflineOrderItemSnapshot,
  type OfflineOrderPayload,
  type QueuedOrder,
} from "./db";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `off-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function nextLocalOrderNumber(): Promise<string> {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `OFF-${day}-`;
  const all = await idbGetAll<QueuedOrder>(STORE_ORDER_QUEUE);
  let max = 0;
  for (const q of all) {
    if (q.localOrderNumber?.startsWith(prefix)) {
      const n = parseInt(q.localOrderNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export type EnqueueOrderInput = {
  orderPayload: OfflineOrderPayload;
  checkoutPayload: OfflineCheckoutPayload;
  itemsSnapshot: OfflineOrderItemSnapshot[];
  subtotal: number;
  discountAmount?: number;
  total: number;
};

export async function enqueueOfflineOrder(
  input: EnqueueOrderInput,
): Promise<QueuedOrder> {
  const record: QueuedOrder = {
    id: uuid(),
    localOrderNumber: await nextLocalOrderNumber(),
    createdAt: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    orderPayload: input.orderPayload,
    checkoutPayload: input.checkoutPayload,
    itemsSnapshot: input.itemsSnapshot,
    subtotal: input.subtotal,
    discountAmount: input.discountAmount ?? 0,
    total: input.total,
  };
  await idbPut(STORE_ORDER_QUEUE, record);
  return record;
}

export async function getQueuedOrders(): Promise<QueuedOrder[]> {
  const all = await idbGetAll<QueuedOrder>(STORE_ORDER_QUEUE);
  return all.sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function getPendingQueueCount(): Promise<number> {
  const all = await getQueuedOrders();
  return all.filter((q) => q.status !== "synced").length;
}

export async function getQueuedOrder(
  id: string,
): Promise<QueuedOrder | undefined> {
  return idbGet<QueuedOrder>(STORE_ORDER_QUEUE, id);
}

export async function updateQueuedOrder(
  id: string,
  patch: Partial<QueuedOrder>,
): Promise<QueuedOrder | undefined> {
  const existing = await getQueuedOrder(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch, id: existing.id };
  await idbPut(STORE_ORDER_QUEUE, next);
  return next;
}

export async function removeQueuedOrder(id: string): Promise<void> {
  await idbDelete(STORE_ORDER_QUEUE, id);
}

export async function clearSyncedOrders(): Promise<number> {
  const all = await getQueuedOrders();
  let n = 0;
  for (const q of all) {
    if (q.status === "synced") {
      await removeQueuedOrder(q.id);
      n++;
    }
  }
  return n;
}