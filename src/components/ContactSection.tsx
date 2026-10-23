"use client";

import { useState } from "react";
import { copyText } from "@/lib/copy-text";
import { pickLocalized } from "@/lib/store-settings-defaults";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";

export function CopyButton({
  text,
  label,
  variant = "light",
}: {
  text: string;
  label: string;
  variant?: "light" | "onDark";
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className={
        variant === "onDark"
          ? "shrink-0 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
          : "shrink-0 rounded-lg border border-surface-2 bg-surface px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-brand hover:text-brand"
      }
    >
      {copied ? t("copied") : label || t("copy")}
    </button>
  );
}

export function ContactSection() {
  const { locale, t } = useLanguage();
  const settings = useStoreSettings();

  const channels = [
    {
      key: "phone",
      label: t("phone"),
      value: settings.phoneDisplay,
      href: `tel:${settings.phone}`,
      copy: settings.phone,
      action: "copy" as const,
    },
    {
      key: "telegram",
      label: "Telegram",
      value: `@${settings.telegram}`,
      href: `https://t.me/${settings.telegram}`,
      action: "open" as const,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      value: settings.phoneDisplay,
      href: `https://wa.me/${settings.whatsapp}`,
      action: "open" as const,
    },
    {
      key: "wechat",
      label: "WeChat",
      value: settings.wechat,
      copy: settings.wechat,
      action: "copy" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-surface-2 bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-accent">{t("contactUs")}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        {pickLocalized(settings.contactDesc, locale)}
      </p>
      <ul className="mt-4 space-y-2">
        {channels.map((ch) => (
          <li
            key={ch.key}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">{ch.label}</p>
              {ch.href ? (
                <a
                  href={ch.href}
                  target={ch.key === "phone" ? undefined : "_blank"}
                  rel={ch.key === "phone" ? undefined : "noreferrer"}
                  className="mt-0.5 block truncate text-sm font-semibold text-ink hover:text-brand"
                >
                  {ch.value}
                </a>
              ) : (
                <p className="mt-0.5 truncate text-sm font-semibold text-ink">{ch.value}</p>
              )}
            </div>
            {ch.action === "copy" && ch.copy ? (
              <CopyButton text={ch.copy} label={t("copy")} />
            ) : (
              <a
                href={ch.href}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
              >
                {t("open")}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LocationSection() {
  const { t } = useLanguage();
  const settings = useStoreSettings();

  return (
    <section className="border-t border-surface-2 bg-accent px-5 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-xl font-semibold">{t("findUs")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {t("storeName")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 font-semibold">{settings.storeName}</p>
              <CopyButton text={settings.storeName} label={t("copy")} variant="onDark" />
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {t("address")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 font-semibold">{settings.address}</p>
              <CopyButton text={settings.address} label={t("copy")} variant="onDark" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function StoreIntroSection() {
  const { locale, t } = useLanguage();
  const settings = useStoreSettings();
  const intro = pickLocalized(settings.siteTagline, locale).trim();
  if (!intro) return null;

  return (
    <div className="rounded-2xl border border-surface-2 bg-white p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-accent">{t("storeIntro")}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink">{intro}</p>
    </div>
  );
}
