import "server-only";

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { OrderRecord, OrderStatus } from "@/types/order";
import type { StoreSettings } from "@/types/settings";
import { mergeStoreSettings } from "@/lib/store-settings-defaults";
import { normalizeOrderRecord } from "@/lib/order-stats";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

export async function readLocalSettings(): Promise<StoreSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreSettings>;
    return mergeStoreSettings(parsed);
  } catch {
    return mergeStoreSettings(null);
  }
}

export async function writeLocalSettings(settings: StoreSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

export async function readLocalOrders(): Promise<OrderRecord[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<OrderRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((order) =>
      normalizeOrderRecord({
        id: order.id!,
        channel: order.channel!,
        status: order.status,
        items: order.items ?? [],
        total: order.total ?? 0,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        note: order.note,
        orderText: order.orderText ?? "",
        createdAt: order.createdAt ?? new Date().toISOString(),
        completedAt: order.completedAt,
      }),
    );
  } catch {
    return [];
  }
}

export async function appendLocalOrder(
  order: Omit<OrderRecord, "id" | "createdAt" | "status" | "completedAt">,
): Promise<string> {
  const orders = await readLocalOrders();
  const id = randomUUID();
  const record: OrderRecord = normalizeOrderRecord({
    ...order,
    id,
    status: "pending",
    createdAt: new Date().toISOString(),
    completedAt: null,
  });
  orders.unshift(record);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return id;
}

export async function updateLocalOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<boolean> {
  const orders = await readLocalOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index === -1) return false;

  orders[index] = normalizeOrderRecord({
    ...orders[index],
    status,
    completedAt: status === "completed" ? new Date().toISOString() : null,
  });

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return true;
}
