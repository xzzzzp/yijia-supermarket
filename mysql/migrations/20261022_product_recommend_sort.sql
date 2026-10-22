-- 已有库升级：新品推荐的手动排序。
-- 在业务库执行本文件即可。可重复执行。
-- 用 mysql 客户端整文件执行（需要 DELIMITER）。
-- 新库也可以直接执行 mysql/schema.sql，其中已包含 recommend_sort。
-- 新品池只看 is_new = 1 且已上架，不按上架时间或创建时间进出。
-- recommend_sort 越小越靠前。已有新品默认 0，顺序相同再按 created_at、id。

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS yijia_products_recommend_sort;

DELIMITER $$
CREATE PROCEDURE yijia_products_recommend_sort()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'recommend_sort'
  ) THEN
    ALTER TABLE products
      ADD COLUMN recommend_sort INT NOT NULL DEFAULT 0 AFTER is_new;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND INDEX_NAME = 'products_recommend_idx'
  ) THEN
    ALTER TABLE products
      ADD KEY products_recommend_idx (is_new, is_published, recommend_sort);
  END IF;
END$$
DELIMITER ;

CALL yijia_products_recommend_sort();
DROP PROCEDURE IF EXISTS yijia_products_recommend_sort;
