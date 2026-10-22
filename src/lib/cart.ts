"use client";

import type { CartItem } from "@/types/order";

const CART_KEY = "yijia-cart";
const TOKEN_KEY = "yijia-order-token";
let memoryOrderToken = "";

function generateOrderToken(): string {
  try {
    const randomUUID = globalThis.crypto?.randomUUID;
    if (typeof randomUUID === "function") {
      return randomUUID.call(globalThis.crypto);
    }
  } catch {
    // HTTP 等非安全上下文中 randomUUID 不可用
  }
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 隐私模式或禁用 localStorage 时忽略
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const EMPTY_CART: CartItem[] = [];
let cartSnapshotRaw: string | null = null;
let cartSnapshot: CartItem[] = EMPTY_CART;

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return parseCart(readStorage(CART_KEY));
}

export function subscribeCart(onChange: () => void): () => void {
  window.addEventListener("cart-updated", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("cart-updated", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** 返回值在购物车文本没变时保持同一引用，供 useSyncExternalStore 使用。 */
export function getCartSnapshot(): CartItem[] {
  const raw = readStorage(CART_KEY) ?? "";
  if (raw === cartSnapshotRaw) return cartSnapshot;
  cartSnapshotRaw = raw;
  cartSnapshot = parseCart(raw);
  return cartSnapshot;
}

export function getCartServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

export function saveCart(items: CartItem[]): void {
  writeStorage(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function addToCart(productId: string, quantity = 1): CartItem[] {
  const cart = getCart();
  const existing = cart.find((i) => i.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }

  saveCart(cart);
  return cart;
}

export function updateQuantity(productId: string, quantity: number): CartItem[] {
  const cart = getCart().map((item) =>
    item.productId === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
  );
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter((i) => i.productId !== productId);
  saveCart(cart);
  return cart;
}

export function removeFromCartMany(productIds: string[]): CartItem[] {
  const drop = new Set(productIds);
  const cart = getCart().filter((item) => !drop.has(item.productId));
  saveCart(cart);
  return cart;
}

const CHECKOUT_IDS_KEY = "yijia-checkout-ids";

export function saveCheckoutSelection(productIds: string[]): void {
  writeStorage(CHECKOUT_IDS_KEY, JSON.stringify(productIds));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("yijia-checkout"));
  }
}

/** 没有写入过选择时返回 null，结算页据此结算购物车里的全部商品。 */
export function readCheckoutSelection(): string[] | null {
  if (typeof window === "undefined") return null;
  const raw = readStorage(CHECKOUT_IDS_KEY);
  if (raw == null) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return null;
  }
}

export function clearCheckoutSelection(): void {
  removeStorage(CHECKOUT_IDS_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("yijia-checkout"));
  }
}

let selectionSnapshotKey = "";
let selectionSnapshot: string[] | null = null;

export function subscribeCheckoutSelection(onChange: () => void): () => void {
  window.addEventListener("yijia-checkout", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("yijia-checkout", onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** null 表示购物车页还没有写入选择，结算时应包含全部商品。 */
export function getCheckoutSelectionSnapshot(): string[] | null {
  const raw = readStorage(CHECKOUT_IDS_KEY);
  const key = raw ?? "\0";
  if (key === selectionSnapshotKey) return selectionSnapshot;
  selectionSnapshotKey = key;
  if (raw == null) {
    selectionSnapshot = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    selectionSnapshot = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string" && id.length > 0)
      : null;
  } catch {
    selectionSnapshot = null;
  }
  return selectionSnapshot;
}

export function getCheckoutSelectionServerSnapshot(): string[] | null {
  return null;
}

export function clearCart(): void {
  removeStorage(CART_KEY);
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function getOrCreateOrderToken(): string {
  if (typeof window === "undefined") return generateOrderToken();

  let token = readStorage(TOKEN_KEY) || memoryOrderToken;
  if (!token) {
    token = generateOrderToken();
    writeStorage(TOKEN_KEY, token);
    memoryOrderToken = token;
  }
  return token;
}

export function rotateOrderToken(): string {
  const token = generateOrderToken();
  writeStorage(TOKEN_KEY, token);
  memoryOrderToken = token;
  return token;
}
