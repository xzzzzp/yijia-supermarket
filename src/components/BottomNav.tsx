"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getCartServerSnapshot, getCartSnapshot, subscribeCart } from "@/lib/cart";
import { activeStorefrontTab } from "@/lib/storefront-nav";
import { useLanguage } from "@/providers/LanguageProvider";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12z" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M6 6 5 3H2" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 3h8l4 4v14H7z" strokeLinejoin="round" />
      <path d="M15 3v5h5M9 13h6M9 17h6" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { id: "home" as const, href: "/", icon: HomeIcon, labelKey: "navHome" as const },
  { id: "categories" as const, href: "/categories", icon: GridIcon, labelKey: "navCategories" as const },
  { id: "cart" as const, href: "/cart", icon: CartIcon, labelKey: "cart" as const },
  { id: "orders" as const, href: "/orders", icon: OrdersIcon, labelKey: "navOrders" as const },
];

export function BottomNav() {
  const pathname = usePathname() || "/";
  const { t } = useLanguage();
  const active = activeStorefrontTab(pathname);
  const items = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav
      aria-label={t("navHome")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-2 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-6xl grid-cols-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.id;
          return (
            <li key={tab.id}>
              <Link
                href={tab.href}
                aria-current={selected ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold ${
                  selected ? "text-brand" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon />
                  {tab.id === "cart" && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-brand px-1 text-center text-[9px] leading-4 font-bold text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
