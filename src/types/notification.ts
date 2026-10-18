export const IN_APP_CHANNEL = "in_app" as const;

export type NotificationChannel = typeof IN_APP_CHANNEL;

export interface OrderNotificationRecord {
  notificationId: string;
  orderId: string;
  recipientStaffId: string;
  channel: NotificationChannel;
  createdAt: string;
  readAt: string | null;
}

export interface OrderNotificationView extends OrderNotificationRecord {
  customerName: string | null;
}
