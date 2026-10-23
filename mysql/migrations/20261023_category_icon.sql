-- 已有库升级：分类图标。
-- 在业务库执行本文件即可。可重复执行。
-- 用 mysql 客户端整文件执行（需要 DELIMITER）。
-- 新库也可以直接执行 mysql/schema.sql，其中已包含 icon。
-- icon 为空时，首页热门分类显示名称首字母色块。

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS yijia_category_icon;

DELIMITER $$
CREATE PROCEDURE yijia_category_icon()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_categories'
      AND COLUMN_NAME = 'icon'
  ) THEN
    ALTER TABLE product_categories
      ADD COLUMN icon VARCHAR(512) NOT NULL DEFAULT '' AFTER description;
  END IF;
END$$
DELIMITER ;

CALL yijia_category_icon();
DROP PROCEDURE IF EXISTS yijia_category_icon;
