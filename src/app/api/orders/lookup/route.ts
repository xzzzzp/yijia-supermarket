import { NextResponse } from "next/server";
import { lookupOrders, toPublicOrder, type LookupErrorCode } from "@/lib/order-lookup";
import { fetchOrderRecords } from "@/lib/orders.server";

export const runtime = "nodejs";

const STATUS: Record<LookupErrorCode, number> = {
  need_query: 400,
  not_found: 404,
  mismatch: 422,
};

export async function POST(request: Request) {
  let body: { phone?: unknown; orderId?: unknown } = {};
  try {
    body = (await request.json()) as { phone?: unknown; orderId?: unknown };
  } catch {
    return NextResponse.json({ ok: false, code: "need_query" satisfies LookupErrorCode }, { status: 400 });
  }

  const phone = typeof body.phone === "string" ? body.phone : "";
  const orderId = typeof body.orderId === "string" ? body.orderId : "";
  const result = lookupOrders(await fetchOrderRecords(), { phone, orderId });

  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.code }, { status: STATUS[result.code] });
  }

  return NextResponse.json({
    ok: true,
    orders: result.orders.map(toPublicOrder),
  });
}
