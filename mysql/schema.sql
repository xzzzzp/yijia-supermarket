-- 亿佳超市 MySQL 结构
-- 目标版本：MySQL 8.0.16+（JSON 列与 CHECK 约束）。
-- 在业务库中执行本文件即可建表。可重复执行（CREATE TABLE IF NOT EXISTS）。
-- 没有在线支付。completed = 配送员回店并交回货款之后，只有该状态计入营收。
--
-- 履约顺序（仅相邻 ±1）：
--   pending     待确认
--   confirmed   已确认
--   delivering  配送中（出门、送达、当面收款；尚未回店交款）
--   completed   已完成（回店并交回货款）
--
-- 另有 product_categories（商品分类）、order_notifications（站内接单通知，仅 in_app）
-- 和 audit_logs（后台操作日志）。
--
-- 下面的种子含中文和西里尔字母。先固定本次会话的客户端字符集，
-- 避免 mysql 客户端默认 latin1 时把 UTF-8 字节写成乱码。

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- 商品分类。slug 对应 products.category，不建外键，删除/停用由应用拦截仍有商品的分类。
-- show_on_home = 0 时首页热门分类不展示，商品表单仍可选。
-- enabled = 0 时首页和商品表单都不可用。
CREATE TABLE IF NOT EXISTS product_categories (
  slug VARCHAR(64) NOT NULL PRIMARY KEY,
  name_zh VARCHAR(255) NOT NULL,
  name_ru VARCHAR(255) NOT NULL,
  name_uz VARCHAR(255) NOT NULL,
  description VARCHAR(512) NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  show_on_home TINYINT(1) NOT NULL DEFAULT 1,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY product_categories_sort_idx (sort_order, slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO product_categories
  (slug, name_zh, name_ru, name_uz, description, sort_order, show_on_home, enabled)
VALUES
  ('drinks', '饮料', 'Напитки', 'Ichimliklar', 'Напитки · соки · чай', 10, 1, 1),
  ('snacks', '零食', 'Снеки', 'Gazaklar', 'Печенье · чипсы · закуски', 20, 1, 1),
  ('noodles', '泡面', 'Быстрая лапша', 'Tez tayyor lag''mon', 'Лапша · готовые блюда', 30, 1, 1),
  ('specialty', '特色食品', 'Китайские продукты', 'Xitoy mahsulotlari', 'Популярные товары из Китая', 40, 1, 1),
  ('hot-drinks', '热饮/茶', 'Китайский чай', 'Xitoy choyi', 'Чай · горячие напитки', 50, 1, 1),
  ('seasonings', '调料', 'Приправы', 'Ziravorlar', 'Соусы · специи · приправы', 60, 1, 1),
  ('side-dishes', '配菜', 'Закуски', 'Garnirlar', 'Овощи · консервы · тофу', 70, 1, 1),
  ('drygoods', '干货', 'Бакалея', 'Quruq mahsulotlar', 'Лапша · водоросли · фучжу', 80, 1, 1),
  ('frozen', '冷冻', 'Замороженное тесто', 'Muzlatilgan', 'Пельмени · вонтоны · танъюань', 90, 1, 1),
  ('seafood', '海鲜', 'Морепродукты', 'Dengiz mahsulotlari', 'Рыба · креветки · морепродукты', 100, 1, 1),
  ('daily-essentials', '日用百货', 'Бытовые товары', 'Kundalik buyumlar', 'Уход · бумага · уборка', 110, 1, 1),
  ('shoes', '鞋类特卖', 'Распродажа обуви', 'Oyoq kiyim chegirmasi', 'Избранная обувь · скидки', 120, 1, 1),
  ('case-discount', '整箱优惠', 'Выгодно коробкой', 'Quti bo''yicha arzon', 'Коробками дешевле', 130, 1, 1);

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
  CONSTRAINT orders_status_chk CHECK (status IN ('pending', 'confirmed', 'delivering', 'completed')),
  UNIQUE KEY orders_request_token_unique (request_token),
  KEY orders_status_idx (status),
  KEY orders_created_at_idx (created_at)
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

-- 站内订单通知。P0 只有 in_app，不接 Telegram 或其他外部渠道。
-- 同一订单、同一收件人、同一渠道只保留一条，重复派发会被忽略。
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
