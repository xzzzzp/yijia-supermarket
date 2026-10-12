"use client";

import { createContext, useContext } from "react";
import type { StoreSettings } from "@/types/settings";
import { DEFAULT_STORE_SETTINGS } from "@/lib/store-settings-defaults";

const StoreSettingsContext = createContext<StoreSettings>(DEFAULT_STORE_SETTINGS);

export function StoreSettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings(): StoreSettings {
  return useContext(StoreSettingsContext);
}
