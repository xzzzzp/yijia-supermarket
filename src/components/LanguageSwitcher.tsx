"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALES } from "@/lib/i18n";
import { useLanguage } from "@/providers/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen(!open)}
        className="inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-surface-2 bg-white px-3 text-xs font-semibold text-accent transition hover:border-brand sm:text-sm"
      >
        {current.label}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-surface-2 bg-white shadow-lg">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-brand-light ${
                locale === l.code ? "font-semibold text-brand" : "text-ink"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
