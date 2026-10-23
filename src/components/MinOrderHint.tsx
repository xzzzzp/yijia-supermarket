"use client";

import { formatMinOrderHint } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";

export function MinOrderHint({ className = "" }: { className?: string }) {
  const { locale } = useLanguage();
  const { minOrderAmount } = useStoreSettings();
  if (!(minOrderAmount > 0)) return null;

  return (
    <p className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 ${className}`}>
      {formatMinOrderHint(locale, minOrderAmount)}
    </p>
  );
}
