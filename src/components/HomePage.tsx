"use client";

import type { Product, CategoryInfo } from "@/types/product";
import { BusinessHours } from "@/components/BusinessHours";
import { SearchBar } from "@/components/SearchBar";
import { NewProductsCarousel } from "@/components/NewProductsCarousel";
import { CategoryGrid } from "@/components/CategoryGrid";
import {
  ContactSection,
  LocationSection,
  ServicesSection,
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
        <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:py-16">
          <div className="ml-auto w-full max-w-xl space-y-4">
            <SearchBar variant="hero" />
            <BusinessHours />
          </div>
        </div>
      </section>

      <CategoryGrid categories={categories} />
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
