import { NextResponse } from "next/server";
import {
  isLookupRateLimited,
  lookupOrders,
  lookupRateKey,
  toPublicOrder,
  type LookupAttemptBucket,
  type LookupErrorCode,
} from "@/lib/order-lookup";
import { fetchOrderRecords } from "@/lib/orders.server";

export const runtime = "nodejs";

const lookupBuckets = new Map<string, LookupAttemptBucket>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "";
  return candidate.slice(0, 64) || "unknown";
}

function denied() {
  return NextResponse.json({ ok: false, code: "not_found" satisfies LookupErrorCode }, { status: 404 });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  let body: { phone?: unknown; orderId?: unknown } = {};
  try {
    body = (await request.json()) as { phone?: unknown; orderId?: unknown };
  } catch {
    isLookupRateLimited(lookupBuckets, lookupRateKey(ip, ""), Date.now());
    return denied();
  }

  const phone = typeof body.phone === "string" ? body.phone : "";
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  if (isLookupRateLimited(lookupBuckets, lookupRateKey(ip, orderId), Date.now())) {
    return denied();
  }

  const orders = phone.trim() && orderId.trim() ? await fetchOrderRecords() : [];
  const result = lookupOrders(orders, { phone, orderId });
  if (!result.ok) return denied();

  return NextResponse.json({
    ok: true,
    orders: result.orders.map(toPublicOrder),
  });
}
