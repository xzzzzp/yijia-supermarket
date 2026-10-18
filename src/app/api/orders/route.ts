import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/products.server";
import { saveOrderRecord } from "@/lib/orders.server";
import { fetchStoreSettings } from "@/lib/settings.server";
import {
  buildOrderItems,
  buildOrderText,
  getRedirectUrl,
  validateOrderRequest,
} from "@/lib/orders";
import type { CreateOrderRequest } from "@/types/order";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderRequest;
    const validationError = validateOrderRequest(body);

    if (validationError) {
      return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
    }

    const products = await fetchProducts();
    const orderItems = buildOrderItems(body.items, products, body.channel === "wechat" ? "zh" : "ru");

    if (!orderItems.length) {
      return NextResponse.json({ ok: false, message: "商品无效或已下架，请清空购物车后重新添加。" }, { status: 400 });
    }

    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const settings = await fetchStoreSettings();

    if (settings.minOrderAmount > 0 && total < settings.minOrderAmount) {
      return NextResponse.json(
        {
          ok: false,
          message: `订单金额未达到最低起送 ${settings.minOrderAmount.toLocaleString("ru-RU")} UZS。`,
        },
        { status: 400 },
      );
    }

    const locale = body.channel === "wechat" ? "zh" : "ru";
    const orderText = buildOrderText(orderItems, locale, {
      name: body.customerName,
      phone: body.customerPhone,
      address: body.customerAddress,
      note: body.note,
    });

    const saved = await saveOrderRecord({
      channel: body.channel,
      items: orderItems,
      total,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      note: body.note,
      orderText,
      requestToken: body.requestToken,
    });

    const redirectUrl = getRedirectUrl(body.channel, saved.orderText, saved.id);

    return NextResponse.json({
      ok: true,
      orderId: saved.id,
      orderText: saved.orderText,
      redirectUrl,
    });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    return NextResponse.json({ ok: false, message: "服务器错误。" }, { status: 500 });
  }
}
