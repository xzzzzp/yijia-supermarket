-- 已有库升级：商品分类（首页热门分类 + 商品表单下拉）
-- 在业务库执行本文件即可。可重复执行（CREATE TABLE IF NOT EXISTS + INSERT IGNORE）。
-- 新库也可以直接执行 mysql/schema.sql，其中已包含本表和种子数据。
-- 不使用 Supabase。
-- slug 与原先写死的分类一致，已有 products.category 不用改值。
-- 描述种子沿用原来的俄语简介。
-- 种子含中文和西里尔字母。先固定会话字符集，避免客户端默认 latin1 时写坏。
-- 已经写坏的库不会被 INSERT IGNORE 改回来，请再执行
-- mysql/migrations/20261019_repair_product_category_encoding.sql。

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

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
