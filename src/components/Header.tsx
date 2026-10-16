"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/cart";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Header() {
  const { t } = useLanguage();
  const count = useCartCount();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-2 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display min-w-0 truncate text-base font-semibold tracking-tight text-accent transition hover:text-brand sm:text-lg"
        >
          {t("siteName")}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12z" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
              <path d="M6 6 5 3H2" />
            </svg>
            <span className="hidden sm:inline">{t("cart")}</span>
            <span className="rounded-full bg-white/20 px-1.5 text-xs">{count}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
