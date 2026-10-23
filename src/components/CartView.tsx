"use client";

import { useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  getCartServerSnapshot,
  getCartSnapshot,
  removeFromCart,
  saveCheckoutSelection,
  subscribeCart,
  updateQuantity,
} from "@/lib/cart";
import { useClientReady } from "@/lib/client-ready";
import { formatPrice } from "@/lib/products";
import {
  formatMinOrderHint,
  formatMinOrderNotMet,
  getProductName,
  getProductSpec,
} from "@/lib/i18n";
import { MinOrderHint } from "@/components/MinOrderHint";
import { ProductImage } from "@/components/ProductImage";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";
import { useProducts } from "@/providers/ProductCatalogProvider";
import type { CartItem } from "@/types/order";

interface CartViewProps {
  minOrderAmount?: number;
}

function SwipeToDelete({
  label,
  onDelete,
  children,
}: {
  label: string;
  onDelete: () => void;
  children: ReactNode;
}) {
  const width = 76;
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; y: number; base: number; active: boolean } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, label")) return;
    drag.current = { x: event.clientX, y: event.clientY, base: dx, active: false };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current) return;
    const mx = event.clientX - current.x;
    const my = event.clientY - current.y;
    if (!current.active) {
      if (Math.abs(mx) < 8) return;
      if (Math.abs(my) > Math.abs(mx)) {
        drag.current = null;
        return;
      }
      current.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDx(Math.min(0, Math.max(-width, current.base + mx)));
  };

  const finish = () => {
    if (!drag.current) return;
    drag.current = null;
    setDx((value) => (value < -width / 2 ? -width : 0));
  };

  return (
    <div className="relative overflow-hidden border-b border-surface-2 last:border-b-0">
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 flex w-[76px] items-center justify-center bg-red-600 px-2 text-sm font-semibold text-white"
      >
        {label}
      </button>
      <div
        className="relative bg-white touch-pan-y"
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {children}
      </div>
    </div>
  );
}

export function CartView({ minOrderAmount: minOrderAmountProp }: CartViewProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const ready = useClientReady();
  const storeSettings = useStoreSettings();
  const minOrderAmount = minOrderAmountProp ?? storeSettings.minOrderAmount;
  const { getProductById } = useProducts();
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [trackedItems, setTrackedItems] = useState(items);

  const enriched = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean) as Array<CartItem & { product: NonNullable<ReturnType<typeof getProductById>> }>;

  if (items !== trackedItems) {
    const known = new Set(trackedItems.map((item) => item.productId));
    const next = new Set<string>();
    for (const item of items) {
      const isNew = !known.has(item.productId);
      if (selected == null || isNew || selected.has(item.productId)) next.add(item.productId);
    }
    setTrackedItems(items);
    setSelected(next);
  }

  const selectedIds = selected ?? new Set(enriched.map((item) => item.productId));

  const chosen = enriched.filter((item) => selectedIds.has(item.productId));
  const total = chosen.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const allSelected = enriched.length > 0 && chosen.length === enriched.length;
  const meetsMinimum = chosen.length > 0 && (minOrderAmount <= 0 || total >= minOrderAmount);
  const remaining = Math.max(0, minOrderAmount - total);

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(enriched.map((item) => item.productId)));
  };

  const toggleOne = (productId: string) => {
    setSelected((prev) => {
      const next = new Set(prev ?? selectedIds);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const goCheckout = () => {
    if (!meetsMinimum) return;
    saveCheckoutSelection(chosen.map((item) => item.productId));
    router.push("/checkout");
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-accent">{t("cartTitle")}</h1>
      <MinOrderHint />
      {!ready ? (
        <div className="rounded-2xl border border-surface-2 bg-white p-10 text-center text-sm text-muted">...</div>
      ) : !enriched.length ? (
        <div className="rounded-2xl border border-surface-2 bg-white p-10 text-center">
          <p className="text-lg text-muted">{t("cartEmpty")}</p>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
          <label className="flex items-center gap-2 px-1 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 accent-brand"
            />
            {t("selectAll")}
            <span className="font-normal text-muted">
              {chosen.length}/{enriched.length}
            </span>
          </label>

          <div className="overflow-hidden rounded-2xl border border-surface-2 bg-white">
            {enriched.map((item) => {
              const name = getProductName(locale, item.product);
              const spec = getProductSpec(locale, item.product);
              const lineTotal = item.product.price * item.quantity;
              return (
                <SwipeToDelete
                  key={item.productId}
                  label={t("remove")}
                  onDelete={() => {
                    removeFromCart(item.productId);
                  }}
                >
                  <div className="flex items-start gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.productId)}
                      onChange={() => toggleOne(item.productId)}
                      aria-label={name}
                      className="mt-1 h-4 w-4 shrink-0 accent-brand"
                    />
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
                      <ProductImage image={item.product.image} alt={name} className="object-contain p-1" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{name}</p>
                      <p className="text-xs text-muted">
                        {t("specLabel")} {spec || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {t("unitPrice")} {formatPrice(item.product.price)}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">{t("quantity")}</span>
                          <button
                            type="button"
                            disabled={item.quantity <= 1}
                            onClick={() => {
                              updateQuantity(item.productId, item.quantity - 1);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-2 text-muted hover:bg-surface disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              updateQuantity(item.productId, item.quantity + 1);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-2 text-muted hover:bg-surface"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-brand">
                            {t("lineTotal")} {formatPrice(lineTotal)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              removeFromCart(item.productId);
                            }}
                            className="hidden text-xs font-semibold text-brand hover:underline md:inline"
                          >
                            {t("remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwipeToDelete>
              );
            })}
          </div>
          </div>

          <div className="rounded-2xl border border-surface-2 bg-white p-5 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">{t("total")}</span>
              <span className="font-display text-xl font-bold text-brand">{formatPrice(total)}</span>
            </div>
            {minOrderAmount > 0 && (
              <p className="mt-2 text-sm text-muted">{formatMinOrderHint(locale, minOrderAmount)}</p>
            )}
            {chosen.length === 0 && <p className="mt-1 text-sm font-medium text-amber-700">{t("nothingSelected")}</p>}
            {chosen.length > 0 && !meetsMinimum && minOrderAmount > 0 && (
              <p className="mt-1 text-sm font-medium text-amber-700">{formatMinOrderNotMet(locale, remaining)}</p>
            )}
            <button
              type="button"
              disabled={!meetsMinimum}
              onClick={goCheckout}
              className="mt-5 w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("goCheckout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
