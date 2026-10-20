-- 已有库升级：订单状态从五态收成四态。
-- pending → confirmed → delivering → completed。
-- 用 mysql 客户端整文件执行（需要 DELIMITER）。可重复执行。需要 MySQL 8.0.19+（DROP CHECK）。
-- 部署去掉「已收款待回款」的应用之前执行。
--
-- awaiting_remittance（已收款待回款）改成 delivering，不改成 completed，
-- 避免这些订单被算进营收。这些行的 completed_at 一并清空，
-- 因为回款时间只在进入 completed 时写入。
--
-- 不更新 audit_logs。历史操作日志里的「已收款待回款」原文保留。

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE orders
SET status = 'delivering',
    completed_at = NULL
WHERE status = 'awaiting_remittance';

DROP PROCEDURE IF EXISTS yijia_orders_status_four_state;

DELIMITER $$
CREATE PROCEDURE yijia_orders_status_four_state()
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'orders'
      AND CONSTRAINT_NAME = 'orders_status_chk'
  ) THEN
    ALTER TABLE orders DROP CHECK orders_status_chk;
  END IF;

  ALTER TABLE orders
    ADD CONSTRAINT orders_status_chk
    CHECK (status IN ('pending', 'confirmed', 'delivering', 'completed'));
END$$
DELIMITER ;

CALL yijia_orders_status_four_state();
DROP PROCEDURE IF EXISTS yijia_orders_status_four_state;
