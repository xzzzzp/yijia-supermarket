import assert from "node:assert/strict";
import test from "node:test";
import { categoryIconError, categoryMark } from "../src/lib/category-mark.ts";
import { LOCALES, formatMinOrderHint, t } from "../src/lib/i18n.ts";
import { validateCustomerContact } from "../src/lib/order-contact.ts";
import { formatPrice } from "../src/lib/price.ts";
import {
  isLookupRateLimited,
  lookupOrders,
  lookupRateKey,
  normalizeLookupPhone,
  toPublicOrder,
} from "../src/lib/order-lookup.ts";
import { getRedirectUrl } from "../src/lib/order-redirect.ts";
import { activeStorefrontTab } from "../src/lib/storefront-nav.ts";
import type { OrderRecord } from "../src/types/order.ts";

function order(partial: Partial<OrderRecord> & Pick<OrderRecord, "id">): OrderRecord {
  return {
    id: partial.id,
    channel: partial.channel ?? "wechat",
    status: partial.status ?? "pending",
    items: partial.items ?? [
      { productId: "p1", name: "可乐", spec: "330ml", price: 8000, quantity: 2 },
    ],
    total: partial.total ?? 16000,
    customerName: partial.customerName ?? "阿强",
    customerPhone: partial.customerPhone ?? "+998 90 123-45-67",
    customerAddress: partial.customerAddress ?? "塔什干",
    note: partial.note ?? "不要敲门",
    orderText: partial.orderText ?? "text",
    createdAt: partial.createdAt ?? "2026-10-01T00:00:00.000Z",
    completedAt: partial.completedAt ?? null,
    requestToken: partial.requestToken ?? "secret-token",
  };
}

test("normalizeLookupPhone strips separators and a leading plus", () => {
  assert.equal(normalizeLookupPhone(" +998 (90) 123-45-67 "), "998901234567");
});

test("lookup requires order id and checkout phone, and failures look the same", () => {
  const orders = [
    order({ id: "ABC-1", customerPhone: "+998 90 123-45-67", customerName: "阿强" }),
    order({ id: "b", customerPhone: "998901234567" }),
  ];
  const phoneOnly = lookupOrders(orders, { phone: "998 90 123 45 67" });
  const orderOnly = lookupOrders(orders, { orderId: "abc-1" });
  const empty = lookupOrders(orders, {});
  const missingOrder = lookupOrders(orders, { orderId: "missing", phone: "998901234567" });
  const wrongPhone = lookupOrders(orders, { orderId: "abc-1", phone: "998900000000" });

  assert.deepEqual(phoneOnly, { ok: false, code: "not_found" });
  assert.deepEqual(orderOnly, phoneOnly);
  assert.deepEqual(empty, phoneOnly);
  assert.deepEqual(missingOrder, phoneOnly);
  assert.deepEqual(wrongPhone, phoneOnly);

  const match = lookupOrders(orders, { orderId: "abc-1", phone: "+998 (90) 123-45-67" });
  assert.equal(match.ok, true);
  if (match.ok) {
    assert.deepEqual(match.orders.map((item) => item.id), ["ABC-1"]);
    assert.equal(match.orders[0]?.customerName, "阿强");
  }
});

test("lookup rate limit is per ip and order id", () => {
  const buckets = new Map();
  const key = lookupRateKey(" 203.0.113.5 ", "ABC-1");
  assert.equal(key, lookupRateKey("203.0.113.5", "abc-1"));
  for (let i = 0; i < 10; i += 1) {
    assert.equal(isLookupRateLimited(buckets, key, 1_000), false);
  }
  assert.equal(isLookupRateLimited(buckets, key, 1_000), true);
  assert.equal(isLookupRateLimited(buckets, lookupRateKey("203.0.113.5", "other"), 1_000), false);
  assert.equal(isLookupRateLimited(buckets, key, 1_000 + 60_000), false);
});

test("success redirect query carries only orderId", () => {
  const orderId = "6f1c1b9a-2d3e-4f5a-8b7c-9d0e1f2a3b4c";
  const url = getRedirectUrl(orderId);
  const parsed = new URL(url, "https://shop.local");
  assert.equal(parsed.pathname, "/order/success");
  assert.deepEqual([...parsed.searchParams.keys()], ["orderId"]);
  assert.equal(parsed.searchParams.get("orderId"), orderId);
  assert.equal(parsed.searchParams.has("text"), false);
  assert.equal(parsed.searchParams.has("channel"), false);
});

test("public order omits the request token and adds line totals", () => {
  const pub = toPublicOrder(order({ id: "abc" }));
  assert.equal("requestToken" in pub, false);
  assert.equal(pub.items[0]?.lineTotal, 16000);
  assert.equal(pub.note, "不要敲门");
});

test("checkout contact fields are required and the note may be empty", () => {
  assert.equal(validateCustomerContact({ customerName: " ", customerPhone: "1", customerAddress: "a" }), "请填写姓名");
  assert.equal(validateCustomerContact({ customerName: "a", customerPhone: " ", customerAddress: "a" }), "请填写电话");
  assert.equal(validateCustomerContact({ customerName: "a", customerPhone: "1", customerAddress: " " }), "请填写配送地址");
  assert.equal(
    validateCustomerContact({ customerName: "阿强", customerPhone: "99890", customerAddress: "塔什干", note: "" }),
    null,
  );
});

test("category icon wins and a blank icon falls back to the first letter", () => {
  assert.deepEqual(categoryMark("饮料", ""), { kind: "letter", letter: "饮" });
  assert.deepEqual(categoryMark(" 零食 ", "  "), { kind: "letter", letter: "零" });
  assert.deepEqual(categoryMark("饮料", "/products/category-icons/icon-1.png"), {
    kind: "icon",
    src: "/products/category-icons/icon-1.png",
  });
  assert.equal(categoryIconError(""), null);
  assert.equal(categoryIconError("https://example.com/a.png"), "分类图标地址无效");
  assert.equal(categoryIconError("/products/category-icons/icon.png"), null);
});

test("language buttons use full names and customer prices say som", () => {
  assert.deepEqual(
    LOCALES.map((item) => item.label),
    ["Русский", "O\u02BBbekcha", "中文"],
  );
  assert.equal(LOCALES.some((item) => item.label === "ZH" || item.short === "ZH"), false);
  assert.equal(t("zh", "orderSaveHint"), "订单已提交，请复制或截图保存订单信息");
  assert.equal(t("zh", "copied"), "已复制");
  assert.match(formatMinOrderHint("zh", 15000), /som/);
  assert.doesNotMatch(formatMinOrderHint("ru", 15000), /UZS/);
  assert.match(formatPrice(8000), /som$/);
  assert.doesNotMatch(formatPrice(8000), /UZS/);
});

test("storefront tabs stay on the four entry points", () => {
  assert.equal(activeStorefrontTab("/"), "home");
  assert.equal(activeStorefrontTab("/categories/"), "categories");
  assert.equal(activeStorefrontTab("/products/drinks"), "categories");
  assert.equal(activeStorefrontTab("/cart"), "cart");
  assert.equal(activeStorefrontTab("/checkout/"), "cart");
  assert.equal(activeStorefrontTab("/orders"), "orders");
  assert.equal(activeStorefrontTab("/order/success"), "orders");
  assert.equal(activeStorefrontTab("/search"), null);
});
