"use client";

import { useEffect, useState } from "react";
import { isStoreOpenNow, pickLocalized } from "@/lib/store-settings-defaults";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";

/** 紧凑状态徽章，用于 Hero / Header 区域 */
export function BusinessStatusBadge() {
  const { t } = useLanguage();
  const settings = useStoreSettings();
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setOpen(isStoreOpenNow(settings));
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, [settings]);

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        open === null
          ? "bg-surface-2 text-muted"
          : open
            ? "bg-emerald-100 text-emerald-800"
            : "bg-orange-100 text-orange-800"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          open === null ? "bg-muted" : open ? "bg-emerald-500" : "bg-orange-500"
        }`}
      />
      {open === null ? t("checkingStatus") : open ? t("openNow") : t("closedNow")}
    </span>
  );
}

export function BusinessHours() {
  const { locale, t } = useLanguage();
  const settings = useStoreSettings();

  return (
    <div className="rounded-xl border border-surface-2 bg-white/80 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {t("businessHours")}
          </p>
          <p className="mt-1 font-display text-sm font-semibold text-accent">
            {pickLocalized(settings.businessHoursText, locale)}
          </p>
        </div>
        <BusinessStatusBadge />
      </div>
    </div>
  );
}
