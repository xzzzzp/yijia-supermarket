"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";

interface SearchBarProps {
  variant?: "section" | "hero";
}

function SearchForm({ className }: { className?: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex overflow-hidden rounded-full border border-surface-2 bg-white shadow-sm transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-light">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("search")}
          className="min-h-12 min-w-0 flex-1 bg-transparent px-5 text-sm text-ink outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label={t("search")}
          className="flex min-h-12 min-w-12 items-center justify-center bg-brand px-4 text-white transition hover:bg-brand-dark"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </button>
      </div>
    </form>
  );
}

export function SearchBar({ variant = "section" }: SearchBarProps) {
  const { t } = useLanguage();

  if (variant === "hero") {
    return <SearchForm className="w-full" />;
  }

  return (
    <section aria-labelledby="product-search-heading" className="px-5 py-8">
      <div className="mx-auto max-w-6xl">
        <h2 id="product-search-heading" className="font-display text-xl font-semibold text-accent">
          {t("search")}
        </h2>
        <div className="mt-4 max-w-xl">
          <SearchForm />
        </div>
      </div>
    </section>
  );
}
