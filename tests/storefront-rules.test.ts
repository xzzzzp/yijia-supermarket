import assert from "node:assert/strict";
import test from "node:test";
import { validateCustomerContact } from "../src/lib/order-contact.ts";
import { lookupOrders, normalizeLookupPhone, toPublicOrder } from "../src/lib/order-lookup.ts";
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

test("phone only returns every order for that phone", () => {
  const orders = [
    order({ id: "a", customerPhone: "998901234567" }),
    order({ id: "b", customerPhone: "+998 90 123-45-67" }),
    order({ id: "c", customerPhone: "998900000000" }),
  ];
  const result = lookupOrders(orders, { phone: "998 90 123 45 67" });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.orders.map((item) => item.id), ["a", "b"]);
});

test("order number only returns that order", () => {
  const result = lookupOrders([order({ id: "ABC-1" })], { orderId: "abc-1" });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.orders[0]?.id, "ABC-1");
});

test("phone and order number must match", () => {
  const orders = [order({ id: "abc", customerPhone: "998901111111" })];
  const mismatch = lookupOrders(orders, { phone: "998902222222", orderId: "abc" });
  assert.deepEqual(mismatch, { ok: false, code: "mismatch" });
  const match = lookupOrders(orders, { phone: "+998 90 111-11-11", orderId: "abc" });
  assert.equal(match.ok, true);
});

test("missing order and empty query have distinct errors", () => {
  assert.deepEqual(lookupOrders([], { orderId: "missing" }), { ok: false, code: "not_found" });
  assert.deepEqual(lookupOrders([], {}), { ok: false, code: "need_query" });
});

test("phone with no orders is an empty list, not an error", () => {
  const result = lookupOrders([order({ id: "a" })], { phone: "998900000000" });
  assert.deepEqual(result, { ok: true, orders: [] });
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
