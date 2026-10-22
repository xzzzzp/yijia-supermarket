"use client";

import { useSyncExternalStore } from "react";
import {
  addToCart,
  getCartServerSnapshot,
  getCartSnapshot,
  removeFromCart,
  subscribeCart,
  updateQuantity,
} from "@/lib/cart";
import { useLanguage } from "@/providers/LanguageProvider";

interface AddToCartControlProps {
  productId: string;
  inStock: boolean;
  compact?: boolean;
}

export function AddToCartControl({
  productId,
  inStock,
  compact = false,
}: AddToCartControlProps) {
  const { t } = useLanguage();
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const quantity = items.find((item) => item.productId === productId)?.quantity ?? 0;

  if (!inStock) {
    return (
      <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
        {t("outOfStock")}
      </span>
    );
  }

  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => addToCart(productId)}
        className={`rounded-lg bg-brand font-semibold text-white transition hover:bg-brand-dark active:scale-95 ${
          compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-1.5 text-xs"
        }`}
      >
        {t("addToCart")}
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-lg border border-surface-2 bg-white ${
        compact ? "h-8" : "h-9"
      }`}
    >
      <button
        type="button"
        aria-label={t("quantity")}
        onClick={() => {
          if (quantity <= 1) {
            removeFromCart(productId);
          } else {
            updateQuantity(productId, quantity - 1);
          }
        }}
        className={`flex items-center justify-center font-bold text-brand transition hover:bg-brand-light ${
          compact ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"
        }`}
      >
        −
      </button>
      <span
        className={`min-w-8 select-none text-center font-bold text-ink ${
          compact ? "px-1 text-xs" : "px-1.5 text-sm"
        }`}
      >
        {quantity}
      </span>
      <button
        type="button"
        aria-label={t("quantity")}
        onClick={() => updateQuantity(productId, quantity + 1)}
        className={`flex items-center justify-center font-bold text-brand transition hover:bg-brand-light ${
          compact ? "h-8 w-8 text-sm" : "h-9 w-9 text-base"
        }`}
      >
        +
      </button>
    </div>
  );
}
