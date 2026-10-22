"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
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

function subscribeLocale(onChange: () => void): () => void {
  window.addEventListener(LOCALE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // 隐私模式或禁用 localStorage 时用默认语言
  }
  return "ru";
}

function readServerLocale(): Locale {
  return "ru";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, readLocale, readServerLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (next: Locale) => {
    try {
      localStorage.setItem(LOCALE_KEY, next);
    } catch {
      // ignore
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
