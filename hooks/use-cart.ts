"use client";

import { useSyncExternalStore } from "react";

export interface CartItemReference {
  sku: string;
  qty: number;
}

const CART_STORAGE_KEY = "nivi_cart";
const CART_EVENT = "nivi_cart_updated";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CART_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CART_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedRaw: string | null = null;
let cachedItems: CartItemReference[] = [];

function getSnapshot(): CartItemReference[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || "[]";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedItems = JSON.parse(raw);
    }
    return cachedItems;
  } catch {
    return cachedItems;
  }
}

const SERVER_SNAPSHOT: CartItemReference[] = [];
function getServerSnapshot(): CartItemReference[] {
  return SERVER_SNAPSHOT;
}

function writeCart(newItems: CartItemReference[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(newItems);
    cachedRaw = raw;
    cachedItems = newItems;
    localStorage.setItem(CART_STORAGE_KEY, raw);
    window.dispatchEvent(new Event(CART_EVENT));
  } catch {
    // LocalStorage error
  }
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addItem = (sku: string, qty = 1, maxStock?: number): boolean => {
    const current = getSnapshot();
    const existing = current.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
    const existingQty = existing ? existing.qty : 0;
    const targetQty = existingQty + qty;

    if (maxStock !== undefined && targetQty > maxStock) {
      return false;
    }

    let updated: CartItemReference[];
    if (existing) {
      updated = current.map((i) =>
        i.sku.toLowerCase() === sku.toLowerCase() ? { ...i, qty: targetQty } : i,
      );
    } else {
      updated = [...current, { sku, qty }];
    }
    writeCart(updated);
    return true;
  };

  const updateQuantity = (sku: string, qty: number, maxStock?: number): boolean => {
    if (qty <= 0) {
      removeItem(sku);
      return true;
    }

    if (maxStock !== undefined && qty > maxStock) {
      return false;
    }

    const current = getSnapshot();
    const updated = current.map((i) =>
      i.sku.toLowerCase() === sku.toLowerCase() ? { ...i, qty } : i,
    );
    writeCart(updated);
    return true;
  };

  const removeItem = (sku: string) => {
    const current = getSnapshot();
    const updated = current.filter((i) => i.sku.toLowerCase() !== sku.toLowerCase());
    writeCart(updated);
  };

  const clearCart = () => {
    writeCart([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

  return {
    items,
    totalCount,
    isLoaded: true,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
