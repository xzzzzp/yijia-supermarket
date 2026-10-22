"use client";

import { useState } from "react";
import { orderStatusLabel, type Locale } from "@/lib/i18n";
import { apiPath } from "@/lib/paths";
import { formatPrice } from "@/lib/products";
import type { LookupErrorCode, PublicOrder } from "@/lib/order-lookup";
import type { OrderStatus } from "@/types/order";
import { useLanguage } from "@/providers/LanguageProvider";

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  delivering: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
};

function dash(value: string): string {
  return value.trim() || "—";
}

function formatWhen(iso: string | null, locale: Locale): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const tag = locale === "zh" ? "zh-CN" : locale === "uz" ? "uz-UZ" : "ru-RU";
  return date.toLocaleString(tag, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderLookup({
  initialPhone = "",
  initialOrderId = "",
}: {
  initialPhone?: string;
  initialOrderId?: string;
}) {
  const { locale, t } = useLanguage();
  const [phone, setPhone] = useState(initialPhone);
  const [orderId, setOrderId] = useState(initialOrderId);
  const [orders, setOrders] = useState<PublicOrder[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const errorText = (code: LookupErrorCode | undefined) => {
    if (code === "not_found") return t("lookupNotFound");
    if (code === "mismatch") return t("lookupMismatch");
    return t("lookupNeedQuery");
  };

  const runLookup = async (nextPhone: string, nextOrderId: string) => {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await fetch(apiPath("/api/orders/lookup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: nextPhone, orderId: nextOrderId }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: LookupErrorCode; orders?: PublicOrder[] };
      if (!data.ok) {
        setOrders(null);
        setError(errorText(data.code));
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setOrders(null);
      setError(t("lookupNeedQuery"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-5 py-8">
      <h1 className="font-display text-2xl font-semibold text-accent">{t("orderLookupTitle")}</h1>
      <p className="text-sm text-muted">{t("orderLookupHint")}</p>

      <form
        className="space-y-3 rounded-2xl border border-surface-2 bg-white p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void runLookup(phone, orderId);
        }}
      >
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t("customerPhone")}
          aria-label={t("customerPhone")}
          className="w-full rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <input
          type="text"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder={t("orderNumber")}
          aria-label={t("orderNumber")}
          className="w-full rounded-lg border border-surface-2 px-4 py-3 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          {loading ? "..." : t("lookupSubmit")}
        </button>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </form>

      {searched && !error && orders?.length === 0 && (
        <p className="rounded-2xl border border-surface-2 bg-white px-6 py-10 text-center text-sm text-muted">
          {t("lookupEmpty")}
        </p>
      )}

      {orders?.map((order) => (
        <article key={order.id} className="space-y-3 rounded-2xl border border-surface-2 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              <span className="text-muted">{t("orderNumber")} </span>
              <code className="font-mono text-xs font-semibold">{order.id}</code>
            </p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status]}`}>
              {orderStatusLabel(locale, order.status)}
            </span>
          </div>
          <p className="text-sm text-muted">
            {t("statusLabel")}：{orderStatusLabel(locale, order.status)}
          </p>
          <p className="text-sm text-muted">
            {t("placedAt")}：{formatWhen(order.createdAt, locale)}
          </p>
          <p className="text-sm text-muted">
            {t("completedAt")}：{formatWhen(order.completedAt, locale)}
          </p>
          <p className="text-sm font-bold text-brand">
            {t("total")} {formatPrice(order.total)}
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 pr-3 font-semibold">{t("purchaseList")}</th>
                  <th className="py-1 pr-3 font-semibold">{t("specLabel")}</th>
                  <th className="py-1 pr-3 font-semibold">{t("quantity")}</th>
                  <th className="py-1 pr-3 font-semibold">{t("unitPrice")}</th>
                  <th className="py-1 font-semibold">{t("lineTotal")}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, index) => (
                  <tr key={`${order.id}-${index}`} className="border-t border-surface-2">
                    <td className="py-2 pr-3 font-semibold text-ink">{item.name}</td>
                    <td className="py-2 pr-3">{dash(item.spec)}</td>
                    <td className="py-2 pr-3">{item.quantity}</td>
                    <td className="py-2 pr-3">{formatPrice(item.price)}</td>
                    <td className="py-2">{formatPrice(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-surface px-4 py-3 text-sm">
            <p className="mb-1 font-semibold">{t("deliveryInfo")}</p>
            <p>
              {t("customerName")}：{dash(order.customerName)}
            </p>
            <p>
              {t("customerPhone")}：{dash(order.customerPhone)}
            </p>
            <p>
              {t("customerAddress")}：{dash(order.customerAddress)}
            </p>
            {order.note ? (
              <p>
                {t("note")}：{order.note}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </main>
  );
}
