-- 已有库升级：站内订单通知 + 后台操作日志
-- 在业务库执行本文件即可。可重复执行（CREATE TABLE IF NOT EXISTS）。
-- 新库也可以直接执行 mysql/schema.sql，其中已包含这两张表。
-- 不使用 Supabase。

-- 站内订单通知。P0 只有 in_app。
-- 同一订单、同一收件人、同一渠道只保留一条。
CREATE TABLE IF NOT EXISTS order_notifications (
  notification_id CHAR(36) NOT NULL PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  recipient_staff_id CHAR(36) NOT NULL,
  channel VARCHAR(16) NOT NULL DEFAULT 'in_app',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  read_at DATETIME(3) NULL,
  CONSTRAINT order_notifications_channel_chk CHECK (channel = 'in_app'),
  UNIQUE KEY order_notifications_once (order_id, recipient_staff_id, channel),
  KEY order_notifications_recipient_idx (recipient_staff_id, read_at),
  KEY order_notifications_created_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 后台操作日志。列表里的「时间」对应 created_at。ip 可空。
CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) NOT NULL PRIMARY KEY,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actor_email VARCHAR(255) NOT NULL,
  actor_staff_id CHAR(36) NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id VARCHAR(255) NULL,
  summary VARCHAR(512) NOT NULL,
  ip VARCHAR(64) NULL,
  KEY audit_logs_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
