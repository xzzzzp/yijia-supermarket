import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/products.server";
import { OrderPersistError, saveOrderRecord } from "@/lib/orders.server";
import { notifyStore } from "@/lib/notify";
import { fetchStoreSettings } from "@/lib/settings.server";
import {
  buildOrderItems,
  buildOrderText,
  getRedirectUrl,
  resolveOrderLocale,
  validateOrderRequest,
} from "@/lib/orders";
import type { CreateOrderRequest } from "@/types/order";

export const runtime = "nodejs";

const MAX_ORDER_TOTAL = 2_000_000_000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderRequest;
    const locale = resolveOrderLocale(body);
    const validationError = validateOrderRequest(body, locale);

    if (validationError) {
      return NextResponse.json({ ok: false, message: validationError }, { status: 400 });
    }

    const products = await fetchProducts();
    const orderItems = buildOrderItems(body.items, products, locale);

    if (!orderItems.length) {
      return NextResponse.json(
        {
          ok: false,
          message:
            locale === "zh"
              ? "商品无效、已下架或缺货，请清空购物车后重新添加。"
              : locale === "uz"
                ? "Mahsulot yaroqsiz, sotuvdan olingan yoki tugagan. Savatni tozalab qayta qo'shing."
                : "Товар недоступен или закончился. Очистите корзину и добавьте товары снова.",
        },
        { status: 400 },
      );
    }

    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (!Number.isSafeInteger(total) || total < 0 || total > MAX_ORDER_TOTAL) {
      return NextResponse.json(
        {
          ok: false,
          message:
            locale === "zh"
              ? "订单金额异常。"
              : locale === "uz"
                ? "Buyurtma summasi noto'g'ri."
                : "Некорректная сумма заказа.",
        },
        { status: 400 },
      );
    }

    const settings = await fetchStoreSettings();

    if (settings.minOrderAmount > 0 && total < settings.minOrderAmount) {
      const formatted = settings.minOrderAmount.toLocaleString("ru-RU");
      return NextResponse.json(
        {
          ok: false,
          message:
            locale === "zh"
              ? `订单金额未达到最低起送 ${formatted} UZS。`
              : locale === "uz"
                ? `Minimal buyurtma summasi: ${formatted} UZS.`
                : `Минимальная сумма заказа: ${formatted} UZS.`,
        },
        { status: 400 },
      );
    }

    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim();
    const customerAddress = body.customerAddress?.trim();
    const note = body.note?.trim();
    const orderText = buildOrderText(orderItems, locale, {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      note,
    });

    const saved = await saveOrderRecord({
      channel: body.channel,
      items: orderItems,
      total,
      customerName,
      customerPhone,
      customerAddress,
      note,
      orderText,
      requestToken: body.requestToken,
    });

    const redirectUrl = getRedirectUrl(body.channel, saved.orderText, saved.id);
    const notified = await notifyStore(saved.orderText);

    return NextResponse.json({
      ok: true,
      orderId: saved.id,
      orderText: saved.orderText,
      redirectUrl,
      notified,
    });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    const message =
      err instanceof OrderPersistError ? "订单保存失败，请稍后再试。" : "服务器错误。";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
