"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getCartServerSnapshot, getCartSnapshot, subscribeCart } from "@/lib/cart";
import { activeStorefrontTab, type StorefrontTab } from "@/lib/storefront-nav";
import { useLanguage } from "@/providers/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const LINKS: { id: StorefrontTab; href: string; labelKey: "navHome" | "navCategories" | "cart" | "navOrders" }[] = [
  { id: "home", href: "/", labelKey: "navHome" },
  { id: "categories", href: "/categories", labelKey: "navCategories" },
  { id: "cart", href: "/cart", labelKey: "cart" },
  { id: "orders", href: "/orders", labelKey: "navOrders" },
];

export function Header() {
  const pathname = usePathname() || "/";
  const { t } = useLanguage();
  const active = activeStorefrontTab(pathname);
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-2 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="font-display min-w-0 truncate text-base font-semibold tracking-tight text-accent transition hover:text-brand sm:text-lg"
        >
          {t("siteName")}
        </Link>
        <nav aria-label={t("navHome")} className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const selected = active === link.id;
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={selected ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  selected ? "bg-accent text-white" : "text-ink hover:bg-white"
                }`}
              >
                {t(link.labelKey)}
                {link.id === "cart" && (
                  <span
                    className={`rounded-full px-1.5 text-xs ${
                      selected ? "bg-white/20" : "bg-accent text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
