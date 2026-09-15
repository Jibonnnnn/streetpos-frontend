/**
 * Minimal IndexedDB helper for POS offline mode (no external deps).
 */

const DB_NAME = "streetpos-offline";
const DB_VERSION = 1;

export const STORE_ORDER_QUEUE = "orderQueue";
export const STORE_MENU_CACHE = "menuCache";
export const STORE_PROMO_CACHE = "promoCache";

export type OfflineOrderStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed";

export interface OfflineOrderItemSnapshot {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  selectedModifierOptionIds: number[];
  selectedOptionLabels?: string[];
  itemNotes?: string;
}

export interface OfflineCheckoutPayload {
  paymentMethod: string;
  amountTendered?: number;
  transactionId?: string;
  notes?: string;
  promotionId?: number | null;
  customerName?: string;
}

export interface OfflineOrderPayload {
  tableNumber?: string;
  customerNotes?: string;
  items: {
    menuItemId: number;
    quantity: number;
    selectedModifierOptionIds?: number[];
    itemNotes?: string;
  }[];
}

export interface QueuedOrder {
  id: string;
  localOrderNumber: string;
  createdAt: string;
  status: OfflineOrderStatus;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  orderPayload: OfflineOrderPayload;
  checkoutPayload: OfflineCheckoutPayload;
  itemsSnapshot: OfflineOrderItemSnapshot[];
  subtotal: number;
  discountAmount: number;
  total: number;
  serverOrderId?: number;
  serverOrderNumber?: string;
}

export interface MenuCacheEntry {
  id: "menu";
  updatedAt: string;
  items: unknown[];
}

export interface PromoCacheEntry {
  id: "promos";
  updatedAt: string;
  items: unknown[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () =>
      reject(req.error ?? new Error("Failed to open IndexedDB"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ORDER_QUEUE)) {
        const store = db.createObjectStore(STORE_ORDER_QUEUE, {
          keyPath: "id",
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MENU_CACHE)) {
        db.createObjectStore(STORE_MENU_CACHE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_PROMO_CACHE)) {
        db.createObjectStore(STORE_PROMO_CACHE, { keyPath: "id" });
      }
    };
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("IndexedDB transaction aborted"));
  });
}

export async function idbPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value as IDBValidKey & T);
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function idbGet<T>(
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).get(key);
    const result = await new Promise<T | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return result;
  } finally {
    db.close();
  }
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    const result = await new Promise<T[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
    return result;
  } finally {
    db.close();
  }
}

export async function idbDelete(
  storeName: string,
  key: IDBValidKey,
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
    await txDone(tx);
  } finally {
    db.close();
  }
}