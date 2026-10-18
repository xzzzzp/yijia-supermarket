import "server-only";

import { insertInAppOrderNotifications } from "@/lib/notifications.server";
import { listNotificationRecipients } from "@/lib/staff.server";

/**
 * 新订单站内通知。
 * 收件人是全部店主，以及打开了接单通知的店员。只写 channel = in_app。
 */
export async function dispatchNewOrderNotification(orderId: string): Promise<void> {
  try {
    const recipients = await listNotificationRecipients();
    const inserted = await insertInAppOrderNotifications(
      orderId,
      recipients.map((member) => member.id),
    );
    console.info("[order-notifications] in_app", {
      orderId,
      recipients: recipients.length,
      inserted,
    });
  } catch (err) {
    console.warn("[order-notifications] hook failed:", err);
  }
}
