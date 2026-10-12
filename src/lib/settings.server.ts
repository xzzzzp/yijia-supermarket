import "server-only";

import { createAdminClient, hasSupabaseAdmin } from "@/lib/supabase/admin";
import { readLocalSettings, writeLocalSettings } from "@/lib/local-data";
import {
  DEFAULT_STORE_SETTINGS,
  mergeStoreSettings,
} from "@/lib/store-settings-defaults";
import type { StoreSettings } from "@/types/settings";

export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (hasSupabaseAdmin()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("store_settings")
        .select("min_order_amount, payload")
        .eq("id", "default")
        .maybeSingle();

      if (!error && data) {
        const payload = (data.payload ?? {}) as Partial<StoreSettings>;
        return mergeStoreSettings({
          ...payload,
          minOrderAmount: data.min_order_amount ?? payload.minOrderAmount,
        });
      }
    } catch (err) {
      console.warn("Failed to fetch store settings from Supabase:", err);
    }
  }

  return readLocalSettings();
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const normalized = mergeStoreSettings(settings);
  const { minOrderAmount, ...payload } = normalized;

  await writeLocalSettings(normalized);

  if (hasSupabaseAdmin()) {
    try {
      const admin = createAdminClient();
      const { error } = await admin.from("store_settings").upsert({
        id: "default",
        min_order_amount: minOrderAmount,
        payload,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Failed to save store settings to Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Failed to save store settings to Supabase:", err);
    }
  }
}

export { DEFAULT_STORE_SETTINGS };
