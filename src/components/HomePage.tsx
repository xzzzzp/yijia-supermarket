"use client";

import type { Product, CategoryInfo } from "@/types/product";
import { BusinessHours } from "@/components/BusinessHours";
import { SearchBar } from "@/components/SearchBar";
import { NewProductsCarousel } from "@/components/NewProductsCarousel";
import { CategoryGrid } from "@/components/CategoryGrid";
import { MinOrderHint } from "@/components/MinOrderHint";
import {
  ContactSection,
  LocationSection,
  StoreIntroSection,
} from "@/components/ContactSection";

export function HomePage({
  newProducts,
  categories,
}: {
  newProducts: Product[];
  categories: CategoryInfo[];
}) {
  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden border-b border-surface-2 bg-white">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-light/60 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/5 blur-2xl"
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-5 sm:px-6 lg:py-8">
          <SearchBar variant="hero" />
          <BusinessHours />
          <MinOrderHint />
        </div>
      </section>

      <CategoryGrid categories={categories} />
      <NewProductsCarousel products={newProducts} />

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <StoreIntroSection />
          <ContactSection />
        </div>
      </div>

      <LocationSection />
    </main>
  );
}
