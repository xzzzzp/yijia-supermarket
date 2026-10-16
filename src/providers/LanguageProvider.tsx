"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: Parameters<typeof t>[1]) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LOCALE_KEY = "yijia-locale";
const LOCALE_EVENT = "yijia-locale";

function isLocale(value: string | null): value is Locale {
  return value === "ru" || value === "uz" || value === "zh";
}

function subscribeLocale(onStoreChange: () => void): () => void {
  window.addEventListener(LOCALE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    return isLocale(saved) ? saved : "ru";
  } catch {
    return "ru";
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, () => "ru" as Locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // 隐私模式无法写入时，本次点击仍通过事件更新当前标签页
    }
    window.dispatchEvent(new Event(LOCALE_EVENT));
  };

  const value: LanguageContextValue = {
    locale,
    setLocale,
    t: (key) => t(locale, key),
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
