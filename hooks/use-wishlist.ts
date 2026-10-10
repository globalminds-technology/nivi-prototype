"use client";

import { useSyncExternalStore } from "react";

const WISHLIST_STORAGE_KEY = "nivi_wishlist";
const WISHLIST_EVENT = "nivi_wishlist_updated";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

let cachedRaw: string | null = null;
let cachedWishlist: string[] = [];

function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedWishlist = JSON.parse(raw);
    }
    return cachedWishlist;
  } catch {
    return cachedWishlist;
  }
}

const SERVER_SNAPSHOT: string[] = [];
function getServerSnapshot(): string[] {
  return SERVER_SNAPSHOT;
}

function writeWishlist(newWishlist: string[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(newWishlist);
    cachedRaw = raw;
    cachedWishlist = newWishlist;
    localStorage.setItem(WISHLIST_STORAGE_KEY, raw);
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  } catch {
    // LocalStorage quota or access error
  }
}

export function useWishlist() {
  const wishlist = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleWishlist = (sku: string) => {
    const current = getSnapshot();
    const updated = current.includes(sku)
      ? current.filter((s) => s !== sku)
      : [...current, sku];
    writeWishlist(updated);
  };

  const isInWishlist = (sku: string) => wishlist.includes(sku);

  return {
    wishlist,
    count: wishlist.length,
    isLoaded: true,
    toggleWishlist,
    isInWishlist,
  };
}
