"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getProduct } from "@/lib/products";

const STORAGE_KEY = "mobilia-cotizacion";
const CHANGE_EVENT = "mobilia-cotizacion-change";
const EMPTY: CartLine[] = [];

export type CartLine = {
  slug: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (slug: string) => void;
  ensure: (slug: string) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as CartLine;
  return (
    typeof line.slug === "string" &&
    getProduct(line.slug) !== undefined &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    line.quantity <= 8
  );
}

function parse(raw: string): CartLine[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const valid = parsed.filter(isLine);
    return valid.length > 0 ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

let cachedRaw = "";
let cachedLines: CartLine[] = EMPTY;

function subscribe(listener: () => void) {
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot() {
  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parse(raw);
  }
  return cachedLines;
}

function getServerSnapshot() {
  return EMPTY;
}

function write(next: CartLine[]) {
  const raw = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedLines = next.length > 0 ? next : EMPTY;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function update(recipe: (current: CartLine[]) => CartLine[]) {
  write(recipe(getSnapshot()));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((slug: string) => {
    if (!getProduct(slug)) return;
    update((current) => {
      const existing = current.find((line) => line.slug === slug);
      if (!existing) return [...current, { slug, quantity: 1 }];
      return current.map((line) =>
        line.slug === slug
          ? { ...line, quantity: Math.min(8, line.quantity + 1) }
          : line,
      );
    });
  }, []);

  const ensure = useCallback((slug: string) => {
    if (!getProduct(slug)) return;
    update((current) =>
      current.some((line) => line.slug === slug)
        ? current
        : [...current, { slug, quantity: 1 }],
    );
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    update((current) =>
      current.flatMap((line) => {
        if (line.slug !== slug) return [line];
        if (quantity <= 0) return [];
        return [{ ...line, quantity: Math.min(8, quantity) }];
      }),
    );
  }, []);

  const remove = useCallback((slug: string) => {
    update((current) => current.filter((line) => line.slug !== slug));
  }, []);

  const count = lines.reduce((total, line) => total + line.quantity, 0);

  const value = useMemo(
    () => ({ lines, count, add, ensure, setQuantity, remove }),
    [lines, count, add, ensure, setQuantity, remove],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
