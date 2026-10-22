"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { getTelegramShareUrl } from "@/lib/orders";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // HTTP 站点上 Clipboard API 会失败，改用选区复制。
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const settings = useStoreSettings();
  const { t } = useLanguage();
  const channel = searchParams.get("channel");
  const orderId = searchParams.get("orderId") ?? "";
  const orderText = searchParams.get("text") ?? "";
  const [copied, setCopied] = useState(false);
  const isWechat = channel === "wechat";
  const isTelegram = channel === "telegram";

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
        <h1 className="font-display mt-4 text-2xl font-semibold text-accent">订单已生成</h1>
        <p className="mt-1 text-sm text-muted">Заказ создан</p>

        {orderId && (
          <p className="mt-4 text-sm text-ink">
            订单号{" "}
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
              {copied ? "已复制 ✓" : "复制订单内容"}
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

          {isWechat && settings.wechat && (
            <p className="rounded-lg border border-surface-2 px-4 py-3 text-sm text-ink">
              微信：<strong>{settings.wechat}</strong>
            </p>
          )}

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
