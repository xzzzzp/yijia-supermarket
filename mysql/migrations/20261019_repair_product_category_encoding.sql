-- 修复 product_categories 里被 latin1 客户端写坏的中文 / 俄文。
-- 现象：UTF-8 字节被 MySQL latin1（即 cp1252）解读后存进 utf8mb4 列。
--   饮料 → é¥®æ–™，零食 → é›¶é£Ÿ，Напитки → ÐÐ°Ð¿Ð¸Ñ‚ÐºÐ¸。
-- 表结构本身已是 utf8mb4（见 schema.sql）。应用连接读到的就是这些错误字符，
-- 不是页面再次编错。后台用 utf8mb4 连接保存的中文不在此列，本脚本不会改它们。
--
-- 只处理「能无损往返 latin1，且按 latin1 字节重新当作 UTF-8 后仍然是合法 UTF-8，
-- 并且结果和原值不同」的文本。café、含 en dash 的正确字符串、纯 ASCII 会跳过。
-- 可重复执行。文本列若不是 utf8 / utf8mb4，直接失败，避免把汉字写成问号。
--
-- 在业务库执行：
--   mysql --default-character-set=utf8mb4 库名 < mysql/migrations/20261019_repair_product_category_encoding.sql

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS yijia_repair_product_category_encoding;

DELIMITER $$
CREATE PROCEDURE yijia_repair_product_category_encoding()
BEGIN
  DECLARE bad_charset INT DEFAULT 0;
  DECLARE saved_sql_mode TEXT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    IF saved_sql_mode IS NOT NULL THEN
      SET SESSION sql_mode = saved_sql_mode;
    END IF;
    RESIGNAL;
  END;

  IF (
    SELECT COUNT(*)
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_categories'
  ) = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'product_categories 不存在，请先执行分类建表迁移或 schema.sql';
  END IF;

  SELECT COUNT(*) INTO bad_charset
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_categories'
    AND COLUMN_NAME IN ('name_zh', 'name_ru', 'name_uz', 'description')
    AND CHARACTER_SET_NAME NOT IN ('utf8mb4', 'utf8', 'utf8mb3');

  IF bad_charset > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'product_categories 文本列不是 utf8mb4，已中止，避免把汉字写成问号';
  END IF;

  -- 例程创建时的 sql_mode 可能含 STRICT。先关掉，CONVERT 到 latin1 才会给出
  -- 替换字符而不是中断整条 UPDATE；下面的字节比较仍会跳过替换后的行。
  SET saved_sql_mode = @@SESSION.sql_mode;
  SET SESSION sql_mode = '';

  UPDATE product_categories
  SET name_zh = CONVERT(CAST(CONVERT(name_zh USING latin1) AS BINARY) USING utf8mb4)
  WHERE CAST(name_zh AS BINARY) = CAST(CONVERT(CONVERT(name_zh USING latin1) USING utf8mb4) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(name_zh USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        = CAST(CONVERT(name_zh USING latin1) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(name_zh USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        <> CAST(name_zh AS BINARY);

  UPDATE product_categories
  SET name_ru = CONVERT(CAST(CONVERT(name_ru USING latin1) AS BINARY) USING utf8mb4)
  WHERE CAST(name_ru AS BINARY) = CAST(CONVERT(CONVERT(name_ru USING latin1) USING utf8mb4) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(name_ru USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        = CAST(CONVERT(name_ru USING latin1) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(name_ru USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        <> CAST(name_ru AS BINARY);

  UPDATE product_categories
  SET name_uz = CONVERT(CAST(CONVERT(name_uz USING latin1) AS BINARY) USING utf8mb4)
  WHERE CAST(name_uz AS BINARY) = CAST(CONVERT(CONVERT(name_uz USING latin1) USING utf8mb4) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(name_uz USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        = CAST(CONVERT(name_uz USING latin1) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(name_uz USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        <> CAST(name_uz AS BINARY);

  UPDATE product_categories
  SET description = CONVERT(CAST(CONVERT(description USING latin1) AS BINARY) USING utf8mb4)
  WHERE CAST(description AS BINARY) = CAST(CONVERT(CONVERT(description USING latin1) USING utf8mb4) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(description USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        = CAST(CONVERT(description USING latin1) AS BINARY)
    AND CAST(CONVERT(CAST(CONVERT(description USING latin1) AS BINARY) USING utf8mb4) AS BINARY)
        <> CAST(description AS BINARY);

  SET SESSION sql_mode = saved_sql_mode;
END$$
DELIMITER ;

CALL yijia_repair_product_category_encoding();
DROP PROCEDURE IF EXISTS yijia_repair_product_category_encoding;
