"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  clearCheckoutSelection,
  getCartServerSnapshot,
  getCartSnapshot,
  getCheckoutSelectionServerSnapshot,
  getCheckoutSelectionSnapshot,
  getOrCreateOrderToken,
  removeFromCartMany,
  rotateOrderToken,
  subscribeCart,
  subscribeCheckoutSelection,
} from "@/lib/cart";
import { useClientReady } from "@/lib/client-ready";
import { formatPrice } from "@/lib/products";
import {
  formatMinOrderHint,
  formatMinOrderNotMet,
  getDefaultChannel,
  getProductName,
  getProductSpec,
} from "@/lib/i18n";
import { apiPath } from "@/lib/paths";
import { assetPath } from "@/lib/assets";
import {
  clearSavedAddress,
  getSavedAddressServerSnapshot,
  getSavedAddressSnapshot,
  subscribeSavedAddress,
  writeSavedAddress,
  type SavedAddress,
} from "@/lib/saved-address";
import { useLanguage } from "@/providers/LanguageProvider";
import { useProducts } from "@/providers/ProductCatalogProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";
import type { CartItem } from "@/types/order";

export function CheckoutForm() {
  const ready = useClientReady();
  const { locale, t } = useLanguage();
  const { getProductById } = useProducts();
  const { minOrderAmount } = useStoreSettings();
  const cart = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const selection = useSyncExternalStore(
    subscribeCheckoutSelection,
    getCheckoutSelectionSnapshot,
    getCheckoutSelectionServerSnapshot,
  );
  const saved = useSyncExternalStore(
    subscribeSavedAddress,
    getSavedAddressSnapshot,
    getSavedAddressServerSnapshot,
  );
  const items =
    selection == null ? cart : cart.filter((item) => selection.includes(item.productId));
  const [appliedSaved, setAppliedSaved] = useState<SavedAddress | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (saved && saved !== appliedSaved) {
    setAppliedSaved(saved);
    setName(saved.name);
    setPhone(saved.phone);
    setAddress(saved.address);
    setRemember(true);
  }

  const enriched = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean) as Array<CartItem & { product: NonNullable<ReturnType<typeof getProductById>> }>;

  const total = enriched.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const meetsMinimum = minOrderAmount <= 0 || total >= minOrderAmount;
  const remaining = Math.max(0, minOrderAmount - total);
  const contactReady = Boolean(name.trim() && phone.trim() && address.trim());

  const handleSubmit = async () => {
    if (!enriched.length || !meetsMinimum) return;
    if (!contactReady) {
      setError(t("contactRequired"));
      return;
    }
    setLoading(true);
    setError("");

    const customerName = name.trim();
    const customerPhone = phone.trim();
    const customerAddress = address.trim();
    const customerNote = note.trim();

    try {
      const res = await fetch(apiPath("/api/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: enriched.map(({ productId, quantity }) => ({ productId, quantity })),
          channel: getDefaultChannel(locale),
          customerName,
          customerPhone,
          customerAddress,
          note: customerNote || undefined,
          requestToken: getOrCreateOrderToken(),
        }),
      });

      const raw = await res.text();
      let data: { ok?: boolean; message?: string; redirectUrl?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setError(`提交失败（${res.status}），请刷新页面后重试`);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.message || `提交失败（${res.status}）`);
        return;
      }

      if (remember) {
        writeSavedAddress({ name: customerName, phone: customerPhone, address: customerAddress });
      } else {
        clearSavedAddress();
      }

      removeFromCartMany(enriched.map((item) => item.productId));
      clearCheckoutSelection();
      try {
        rotateOrderToken();
      } catch {
        // token 轮换失败不影响跳转
      }

      if (data.redirectUrl) {
        const target = data.redirectUrl;
        window.location.assign(
          target.startsWith("http://") || target.startsWith("https://") ? target : assetPath(target),
        );
      }
    } catch (err) {
      console.error("Order submit failed:", err);
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="font-display text-2xl font-semibold text-accent">{t("checkoutTitle")}</h1>
        <p className="mt-6 text-sm text-muted">...</p>
      </main>
    );
  }

  if (!enriched.length) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-5 py-8">
        <h1 className="font-display text-2xl font-semibold text-accent">{t("checkoutTitle")}</h1>
        <div className="rounded-2xl border border-surface-2 bg-white p-10 text-center">
          <p className="text-lg text-muted">{t("cartEmpty")}</p>
          <Link href="/cart" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            {t("backToCart")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-accent">{t("checkoutTitle")}</h1>

      <section className="overflow-hidden rounded-2xl border border-surface-2 bg-white">
        <h2 className="border-b border-surface-2 px-4 py-3 text-sm font-semibold text-ink">{t("purchaseList")}</h2>
        <ul>
          {enriched.map((item) => {
            const lineTotal = item.product.price * item.quantity;
            return (
              <li key={item.productId} className="border-b border-surface-2 px-4 py-3 text-sm last:border-b-0">
                <p className="font-semibold">{getProductName(locale, item.product)}</p>
                <p className="text-xs text-muted">
                  {t("specLabel")} {getProductSpec(locale, item.product) || "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("unitPrice")} {formatPrice(item.product.price)} · {t("quantity")} {item.quantity}
                </p>
                <p className="mt-1 font-bold text-brand">
                  {t("lineTotal")} {formatPrice(lineTotal)}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-bold">{t("total")}</span>
          <span className="font-display text-lg font-bold text-brand">{formatPrice(total)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-2 bg-white p-5">
        <div className="grid gap-3">
          <input
            type="text"
            required
            aria-label={t("customerName")}
            placeholder={`${t("customerName")} *`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            type="tel"
            required
            aria-label={t("customerPhone")}
            placeholder={`${t("customerPhone")} *`}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            type="text"
            required
            aria-label={t("customerAddress")}
            placeholder={`${t("customerAddress")} *`}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <input
            type="text"
            aria-label={t("note")}
            placeholder={t("note")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            {t("rememberAddress")}
          </label>
        </div>

        {minOrderAmount > 0 && (
          <p className="mt-3 text-sm text-muted">{formatMinOrderHint(locale, minOrderAmount)}</p>
        )}
        {!meetsMinimum && minOrderAmount > 0 && (
          <p className="mt-1 text-sm font-medium text-amber-700">{formatMinOrderNotMet(locale, remaining)}</p>
        )}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={loading || !meetsMinimum || !contactReady}
          onClick={handleSubmit}
          className="mt-5 w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : t("submitOrder")}
        </button>
      </section>
    </main>
  );
}
