"use client";

import type { Product } from "@/types/product";
import { pickLocalized } from "@/lib/store-settings-defaults";
import { useLanguage } from "@/providers/LanguageProvider";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";
import { BusinessHours } from "@/components/BusinessHours";
import { SearchBar } from "@/components/SearchBar";
import { NewProductsCarousel } from "@/components/NewProductsCarousel";
import { CategoryGrid } from "@/components/CategoryGrid";
import {
  ContactSection,
  LocationSection,
  ServicesSection,
} from "@/components/ContactSection";

export function HomePage({ newProducts }: { newProducts: Product[] }) {
  const { locale, t } = useLanguage();
  const settings = useStoreSettings();

  return (
    <main className="min-h-screen">
      {/* Hero：左文案 + 右搜索/营业时间，与参考站全宽色块完全不同 */}
      <section className="relative overflow-hidden border-b border-surface-2 bg-white">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-light/60 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/5 blur-2xl"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              Tashkent · Chinese Grocery
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-accent sm:text-4xl lg:text-5xl">
              {t("siteName")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted sm:text-base">
              {pickLocalized(settings.siteTagline, locale)}
            </p>
          </div>
          <div className="space-y-4">
            <SearchBar variant="hero" />
            <BusinessHours />
          </div>
        </div>
      </section>

      <CategoryGrid />
      <NewProductsCarousel products={newProducts} />

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ServicesSection />
          <ContactSection />
        </div>
      </div>

      <LocationSection />
    </main>
  );
}
