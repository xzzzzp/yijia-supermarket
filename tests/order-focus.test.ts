import assert from "node:assert/strict";
import test from "node:test";
import {
  adminOrderFocusPath,
  orderVisibleInList,
  readFocusOrderId,
  resolveOrderFocus,
  type OrderListQuery,
  type OrderListFilter,
} from "../src/lib/order-focus.ts";

const STATUS_LABELS: Record<OrderListQuery["status"], string> = {
  pending: "待确认",
  confirmed: "已确认",
  delivering: "配送中",
  completed: "已完成",
};

function label(status: OrderListQuery["status"]): string {
  return STATUS_LABELS[status];
}

function order(partial: Partial<OrderListQuery> & Pick<OrderListQuery, "id" | "status">): OrderListQuery {
  return {
    customerName: "张三",
    customerPhone: "13800000000",
    customerAddress: "城东",
    note: "",
    orderText: "",
    channel: "wechat",
    ...partial,
  };
}

const pending = order({ id: "order-pending", status: "pending", customerName: "张三" });
const completed = order({ id: "order-done", status: "completed", customerName: "李四" });

test("focus query keeps a trimmed order id and ignores blanks", () => {
  assert.equal(readFocusOrderId("  abc  "), "abc");
  assert.equal(readFocusOrderId([" first ", "second"]), "first");
  assert.equal(readFocusOrderId(""), null);
  assert.equal(readFocusOrderId("   "), null);
  assert.equal(readFocusOrderId(undefined), null);
  assert.equal(readFocusOrderId([]), null);
});

test("order link points at orders with focus", () => {
  assert.equal(adminOrderFocusPath("order-1"), "/admin/orders?focus=order-1");
  assert.equal(adminOrderFocusPath("a b"), "/admin/orders?focus=a+b");
});

test("list query matches the same fields as the orders search box", () => {
  assert.equal(orderVisibleInList(pending, "all", "", label(pending.status)), true);
  assert.equal(orderVisibleInList(pending, "pending", "张三", label(pending.status)), true);
  assert.equal(orderVisibleInList(pending, "completed", "", label(pending.status)), false);
  assert.equal(orderVisibleInList(pending, "all", "不存在", label(pending.status)), false);
  assert.equal(orderVisibleInList(pending, "all", "待确认", label(pending.status)), true);
  assert.equal(orderVisibleInList(pending, "all", "order-pending", label(pending.status)), true);
});

test("focus clears filters that hide the order, and reports a missing id", () => {
  const orders = [pending, completed];
  const resolve = (
    focusOrderId: string,
    statusFilter: OrderListFilter,
    keyword: string,
    list: OrderListQuery[] = orders,
  ) => resolveOrderFocus(list, focusOrderId, statusFilter, keyword, label);

  assert.deepEqual(resolve("order-pending", "all", ""), {
    found: true,
    statusFilter: "all",
    keyword: "",
  });

  assert.deepEqual(resolve("order-pending", "completed", "李四"), {
    found: true,
    statusFilter: "all",
    keyword: "",
  });

  assert.deepEqual(resolve("order-pending", "pending", "张三"), {
    found: true,
    statusFilter: "pending",
    keyword: "张三",
  });

  assert.deepEqual(resolve("missing-order", "completed", "李四"), {
    found: false,
    statusFilter: "completed",
    keyword: "李四",
  });

  assert.deepEqual(resolve("missing-order", "all", "", []), {
    found: false,
    statusFilter: "all",
    keyword: "",
  });
});
