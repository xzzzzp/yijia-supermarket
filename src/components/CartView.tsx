"use client";

import { useState } from "react";
import {
  clearCart,
  getOrCreateOrderToken,
  removeFromCart,
  rotateOrderToken,
  updateQuantity,
  useCart,
} from "@/lib/cart";
import { appPath } from "@/lib/paths";
import { formatPrice } from "@/lib/products";
import {
  formatMinOrderHint,
  formatMinOrderNotMet,
  getDefaultChannel,
  getProductName,
  getProductSpec,
} from "@/lib/i18n";
import { assetPath } from "@/lib/assets";
import { ProductImage } from "@/components/ProductImage";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";
import { useProducts } from "@/providers/ProductCatalogProvider";
import type { CartItem } from "@/types/order";

interface CartViewProps {
  minOrderAmount?: number;
}

export function CartView({ minOrderAmount: minOrderAmountProp }: CartViewProps) {
  const { locale, t } = useLanguage();
  const storeSettings = useStoreSettings();
  const minOrderAmount = minOrderAmountProp ?? storeSettings.minOrderAmount;
  const { getProductById } = useProducts();
  const items = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const enriched = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean) as Array<CartItem & { product: NonNullable<ReturnType<typeof getProductById>> }>;

  const total = enriched.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const channel = getDefaultChannel(locale);
  const meetsMinimum = minOrderAmount <= 0 || total >= minOrderAmount;
  const remaining = Math.max(0, minOrderAmount - total);
  const contactReady = Boolean(name.trim() && phone.trim() && address.trim());

  const handleSubmit = async () => {
    if (!enriched.length || !meetsMinimum || !contactReady) return;
    setLoading(true);
    setError("");

    const orderItems = enriched.map(({ productId, quantity }) => ({ productId, quantity }));

    try {
      const res = await fetch(appPath("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          channel,
          locale,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerAddress: address.trim(),
          note: note.trim() || undefined,
          requestToken: getOrCreateOrderToken(),
        }),
      });

      const raw = await res.text();
      let data: { ok?: boolean; message?: string; redirectUrl?: string } = {};

      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        setError(`提交失败（${res.status}），请刷新页面后重试`);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.message || `提交失败（${res.status}）`);
        return;
      }

      clearCart();
      try {
        rotateOrderToken();
      } catch {
        // token 轮换失败不影响跳转
      }

      if (data.redirectUrl) {
        const target = data.redirectUrl;
        if (target.startsWith("http://") || target.startsWith("https://")) {
          window.location.assign(target);
        } else {
          window.location.assign(assetPath(target));
        }
      }
    } catch (err) {
      console.error("Order submit failed:", err);
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  if (!enriched.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-surface-2 bg-white p-10 text-center">
        <p className="text-lg text-muted">{t("cartEmpty")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="overflow-hidden rounded-2xl border border-surface-2 bg-white">
        {enriched.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 border-b border-surface-2 p-4 last:border-b-0"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
              <ProductImage
                image={item.product.image}
                alt={getProductName(locale, item.product)}
                className="object-contain p-1"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                {getProductName(locale, item.product)}
              </p>
              <p className="text-xs text-muted">
                {getProductSpec(locale, item.product)}
              </p>
              <p className="mt-1 text-sm font-bold text-brand">
                {formatPrice(item.product.price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  updateQuantity(item.productId, item.quantity - 1);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-2 text-muted hover:bg-surface"
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
              <button
                type="button"
                onClick={() => {
                  removeFromCart(item.productId);
                }}
                className="ml-2 text-xs text-brand hover:underline"
              >
                {t("remove")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-surface-2 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            required
            maxLength={80}
            placeholder={t("customerName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            type="tel"
            required
            maxLength={32}
            placeholder={t("customerPhone")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            type="text"
            required
            minLength={4}
            maxLength={200}
            placeholder={t("customerAddress")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 sm:col-span-2"
          />
          <input
            type="text"
            maxLength={500}
            placeholder={t("note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-500 sm:col-span-2"
          />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-lg font-bold">{t("total")}</span>
          <span className="font-display text-xl font-bold text-brand">{formatPrice(total)}</span>
        </div>

        {minOrderAmount > 0 && (
          <p className="mt-2 text-sm text-muted">
            {formatMinOrderHint(locale, minOrderAmount)}
          </p>
        )}

        {!meetsMinimum && minOrderAmount > 0 && (
          <p className="mt-1 text-sm font-medium text-amber-700">
            {formatMinOrderNotMet(locale, remaining)}
          </p>
        )}

        {!contactReady && (
          <p className="mt-3 text-sm text-muted">{t("contactRequired")}</p>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading || !meetsMinimum || !contactReady}
            onClick={handleSubmit}
            className="flex-1 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "..." : t("submitMessage")}
          </button>
          <button
            type="button"
            onClick={() => {
              clearCart();
            }}
            className="rounded-lg border border-surface-2 px-6 py-3 text-sm font-semibold text-muted transition hover:bg-surface"
          >
            {t("clearCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
