import "server-only";

import type { RowDataPacket } from "mysql2";
import { readLocalSettings, writeLocalSettings } from "@/lib/local-data";
import { isMysqlConfigured, mysqlExecute, mysqlQuery } from "@/lib/mysql";
import {
  DEFAULT_STORE_SETTINGS,
  mergeStoreSettings,
} from "@/lib/store-settings-defaults";
import type { StoreSettings } from "@/types/settings";

interface SettingsRow extends RowDataPacket {
  min_order_amount: number;
  payload: Partial<StoreSettings> | string | null;
}

function parsePayload(value: SettingsRow["payload"]): Partial<StoreSettings> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Partial<StoreSettings>;
    } catch {
      return {};
    }
  }
  return value;
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!isMysqlConfigured()) return readLocalSettings();

  const rows = await mysqlQuery<SettingsRow[]>(
    "SELECT min_order_amount, payload FROM store_settings WHERE id = 'default' LIMIT 1",
  );
  const row = rows[0];
  if (!row) return mergeStoreSettings(null);

  const payload = parsePayload(row.payload);
  return mergeStoreSettings({
    ...payload,
    minOrderAmount: row.min_order_amount ?? payload.minOrderAmount,
  });
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const normalized = mergeStoreSettings(settings);
  if (!isMysqlConfigured()) {
    await writeLocalSettings(normalized);
    return;
  }

  const { minOrderAmount, ...payload } = normalized;
  await mysqlExecute(
    `INSERT INTO store_settings (id, min_order_amount, payload, updated_at)
     VALUES ('default', ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       min_order_amount = VALUES(min_order_amount),
       payload = VALUES(payload),
       updated_at = VALUES(updated_at)`,
    [minOrderAmount, JSON.stringify(payload), new Date()],
  );
}

export { DEFAULT_STORE_SETTINGS };
