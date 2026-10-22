import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_ORDER_HINT_POLL_MS,
  adminPathNeedsLiveRefresh,
  inAppHintChanged,
} from "../src/lib/notification-hint.ts";

test("poll interval stays inside the five-second hint window", () => {
  assert.ok(ADMIN_ORDER_HINT_POLL_MS > 0);
  assert.ok(ADMIN_ORDER_HINT_POLL_MS <= 5000);
});

test("hint changes when unread count or newest notification changes", () => {
  const base = { unreadCount: 1, newestNotificationId: "a" };
  assert.equal(inAppHintChanged(base, base), false);
  assert.equal(
    inAppHintChanged(base, { unreadCount: 2, newestNotificationId: "a" }),
    true,
  );
  assert.equal(
    inAppHintChanged(base, { unreadCount: 1, newestNotificationId: "b" }),
    true,
  );
  assert.equal(
    inAppHintChanged(
      { unreadCount: 0, newestNotificationId: null },
      { unreadCount: 0, newestNotificationId: null },
    ),
    false,
  );
});

test("only orders and notifications pages refresh their lists", () => {
  assert.equal(adminPathNeedsLiveRefresh("/admin/orders"), true);
  assert.equal(adminPathNeedsLiveRefresh("/admin/orders/"), true);
  assert.equal(adminPathNeedsLiveRefresh("/admin/notifications"), true);
  assert.equal(adminPathNeedsLiveRefresh("/admin/notifications/"), true);
  assert.equal(adminPathNeedsLiveRefresh("/admin"), false);
  assert.equal(adminPathNeedsLiveRefresh("/admin/stats"), false);
  assert.equal(adminPathNeedsLiveRefresh("/admin/orders-archive"), false);
});
