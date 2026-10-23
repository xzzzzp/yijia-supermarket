"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "@/components/ContactSection";
import { copyText } from "@/lib/copy-text";
import { getTelegramShareUrl } from "@/lib/orders";
import { pickLocalized } from "@/lib/store-settings-defaults";
import type { OrderChannel } from "@/types/order";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";

export default function OrderSuccessContent({
  orderId,
  channel,
  orderText,
}: {
  orderId: string;
  channel: OrderChannel | null;
  orderText: string;
}) {
  const settings = useStoreSettings();
  const { locale, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const isWechat = channel === "wechat";
  const isTelegram = channel === "telegram";
  const intro = pickLocalized(settings.siteTagline, locale).trim();

  const shareText = [orderText.trim(), orderId ? `订单号: ${orderId}` : ""]
    .filter(Boolean)
    .join("\n");

  const telegramHref =
    isTelegram && settings.telegram
      ? getTelegramShareUrl(settings.telegram, shareText)
      : "";

  const handleCopy = async () => {
    if (!shareText) return;
    const ok = await copyText(shareText);
    if (ok) {
      setCopied(true);
      return;
    }
    window.prompt("复制失败，请手动复制订单内容：", shareText);
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-surface-2 bg-white p-8 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="font-display mt-4 text-xl font-semibold leading-7 text-accent sm:text-2xl">
          {t("orderSaveHint")}
        </h1>

        {orderId && (
          <p className="mt-4 text-sm text-ink">
            {t("orderNumber")}{" "}
            <code className="rounded bg-surface px-2 py-1 font-mono text-sm font-semibold">
              {orderId}
            </code>
          </p>
        )}

        <p className="mt-3 text-sm text-muted">
          {isWechat
            ? `请复制订单，打开微信发送给 ${settings.wechat}`
            : isTelegram
              ? "订单已保存在本站。可复制内容，或打开 Telegram 发给店铺。"
              : "订单已保存。请联系店铺确认。"}
        </p>

        {orderText && (
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-surface p-4 text-left text-xs leading-5 text-ink">
            {shareText}
          </pre>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {shareText && (
            <button
              type="button"
              onClick={handleCopy}
              className="w-full rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {copied ? t("copied") : t("copyOrder")}
            </button>
          )}

          {isTelegram && telegramHref && (
            <a
              href={telegramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg border border-surface-2 px-6 py-3 text-sm font-semibold text-ink hover:bg-surface"
            >
              打开 Telegram
            </a>
          )}

          {intro && (
            <div className="rounded-xl border border-surface-2 px-4 py-3 text-left">
              <p className="text-xs font-medium text-muted">{t("storeIntro")}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink">{intro}</p>
            </div>
          )}

          <div className="space-y-2 text-left">
            {settings.phone && (
              <CopyRow label={t("phone")} value={settings.phoneDisplay || settings.phone} copyValue={settings.phone} />
            )}
            {settings.wechat && <CopyRow label="WeChat" value={settings.wechat} copyValue={settings.wechat} />}
            {settings.storeName && (
              <CopyRow label={t("storeName")} value={settings.storeName} copyValue={settings.storeName} />
            )}
            {settings.address && (
              <CopyRow label={t("address")} value={settings.address} copyValue={settings.address} />
            )}
          </div>

          <Link
            href={orderId ? `/orders?id=${encodeURIComponent(orderId)}` : "/orders"}
            className="text-sm font-semibold text-brand hover:underline"
          >
            {t("orderLookupTitle")}
          </Link>
          <Link href="/" className="text-sm font-semibold text-brand hover:underline">
            {t("navHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}

function CopyRow({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: string;
  copyValue: string;
}) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl bg-surface px-4 py-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-semibold break-all text-ink">{value}</p>
        <CopyButton text={copyValue} label={t("copy")} />
      </div>
    </div>
  );
}
