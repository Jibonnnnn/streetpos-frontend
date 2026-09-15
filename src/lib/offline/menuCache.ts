import {
  idbGet,
  idbPut,
  STORE_MENU_CACHE,
  STORE_PROMO_CACHE,
  type MenuCacheEntry,
  type PromoCacheEntry,
} from "./db";

const MENU_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function saveMenuCache(items: unknown[]): Promise<void> {
  const entry: MenuCacheEntry = {
    id: "menu",
    updatedAt: new Date().toISOString(),
    items,
  };
  await idbPut(STORE_MENU_CACHE, entry);
}

export async function loadMenuCache(): Promise<unknown[] | null> {
  const entry = await idbGet<MenuCacheEntry>(STORE_MENU_CACHE, "menu");
  if (!entry?.items?.length) return null;
  const age = Date.now() - new Date(entry.updatedAt).getTime();
  if (age > MENU_MAX_AGE_MS) return null;
  return entry.items;
}

export async function savePromoCache(items: unknown[]): Promise<void> {
  const entry: PromoCacheEntry = {
    id: "promos",
    updatedAt: new Date().toISOString(),
    items,
  };
  await idbPut(STORE_PROMO_CACHE, entry);
}

export async function loadPromoCache(): Promise<unknown[] | null> {
  const entry = await idbGet<PromoCacheEntry>(STORE_PROMO_CACHE, "promos");
  if (!entry?.items) return null;
  return entry.items;
}