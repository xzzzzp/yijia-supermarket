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

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = readStorage(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
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

export function clearCart(): void {
  removeStorage(CART_KEY);
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getProductQuantity(productId: string): number {
  return getCart().find((i) => i.productId === productId)?.quantity ?? 0;
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
