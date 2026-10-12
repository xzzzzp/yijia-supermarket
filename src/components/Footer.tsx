"use client";

import { STORE_CONFIG } from "@/lib/config";
import { useStoreSettings } from "@/providers/StoreSettingsProvider";

export function Footer() {
  const settings = useStoreSettings();

  return (
    <footer className="mt-auto border-t border-surface-2 bg-white px-6 py-10">
      <div className="mx-auto max-w-6xl text-center">
        <p className="font-display text-lg font-semibold text-accent">{settings.storeName}</p>
        <p className="mt-1 text-sm text-muted">
          {STORE_CONFIG.city} · {STORE_CONFIG.country}
        </p>
        <p className="mt-4 text-xs text-muted/80">
          © {new Date().getFullYear()} {settings.storeName}
        </p>
      </div>
    </footer>
  );
}
