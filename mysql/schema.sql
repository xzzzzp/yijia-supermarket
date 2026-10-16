-- 亿佳超市 MySQL 结构
-- 目标版本：MySQL 8.0.16+（JSON 列与 CHECK 约束）。
-- 在业务库中执行本文件即可建表。可重复执行（CREATE TABLE IF NOT EXISTS）。
-- 没有在线支付。completed = 配送员回店回款之后，只有该状态计入营收。
--
-- 履约顺序：
--   pending              待电话确认
--   confirmed            已确认待配送
--   delivering           配送中
--   awaiting_remittance  已收款待回款（当面已收款，货款尚未交回店铺）
--   completed            已回店回款

CREATE TABLE IF NOT EXISTS products (
  id CHAR(36) NOT NULL PRIMARY KEY,
  source_key VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ru VARCHAR(255) NOT NULL DEFAULT '',
  name_uz VARCHAR(255) NOT NULL DEFAULT '',
  spec VARCHAR(255) NOT NULL DEFAULT '',
  spec_ru VARCHAR(255) NOT NULL DEFAULT '',
  spec_uz VARCHAR(255) NOT NULL DEFAULT '',
  image VARCHAR(512) NOT NULL DEFAULT '/products/placeholder.png',
  price INT NOT NULL DEFAULT 0,
  in_stock TINYINT(1) NOT NULL DEFAULT 1,
  is_new TINYINT(1) NOT NULL DEFAULT 0,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  category VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY products_source_key (source_key),
  KEY products_category_idx (category),
  KEY products_published_idx (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id CHAR(36) NOT NULL PRIMARY KEY,
  channel VARCHAR(16) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  items JSON NOT NULL,
  total INT NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_phone VARCHAR(64) NULL,
  customer_address TEXT NULL,
  note TEXT NULL,
  order_text TEXT NOT NULL,
  request_token VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  CONSTRAINT orders_channel_chk CHECK (channel IN ('wechat', 'telegram')),
  CONSTRAINT orders_status_chk CHECK (status IN ('pending', 'confirmed', 'delivering', 'awaiting_remittance', 'completed')),
  KEY orders_status_idx (status),
  KEY orders_created_at_idx (created_at),
  UNIQUE KEY orders_request_token_uidx (request_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_settings (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  min_order_amount INT NOT NULL DEFAULT 0,
  payload JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO store_settings (id, min_order_amount, payload)
VALUES ('default', 0, JSON_OBJECT());

-- 店员。登录密码存在 password_hash，不使用 Supabase Auth。
-- is_owner = 1 的店主拥有全部能力。
-- order_notifications 接单通知，view_stats 查看收益/统计，
-- fulfillment 配货（改订单状态），manage_products 商品上架。
CREATE TABLE IF NOT EXISTS staff (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  is_owner TINYINT(1) NOT NULL DEFAULT 0,
  order_notifications TINYINT(1) NOT NULL DEFAULT 0,
  view_stats TINYINT(1) NOT NULL DEFAULT 0,
  fulfillment TINYINT(1) NOT NULL DEFAULT 0,
  manage_products TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY staff_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
