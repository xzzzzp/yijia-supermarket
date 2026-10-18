-- 已有库升级：orders.request_token 唯一索引
-- 用 mysql 客户端整文件执行（需要 DELIMITER）。可重复执行。
-- 新库执行 mysql/schema.sql 时已经包含该索引。
-- 若失败提示重复键，先让每个 request_token 只保留一笔订单，再执行本文件。

DROP PROCEDURE IF EXISTS yijia_add_orders_request_token_unique;

DELIMITER $$
CREATE PROCEDURE yijia_add_orders_request_token_unique()
BEGIN
  IF (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'orders'
      AND index_name = 'orders_request_token_unique'
  ) = 0 THEN
    ALTER TABLE orders
      ADD UNIQUE KEY orders_request_token_unique (request_token);
  END IF;
END$$
DELIMITER ;

CALL yijia_add_orders_request_token_unique();
DROP PROCEDURE IF EXISTS yijia_add_orders_request_token_unique;
