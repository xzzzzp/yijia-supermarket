-- 已有库：把「MySQL CURRENT_TIMESTAMP 按服务器上海墙钟写入」的 DATETIME 校准成 UTC 墙钟。
--
-- 背景：应用用 timezone 'Z' 读取 DATETIME，会把墙钟数字当成 UTC。
-- 阿里云上海的 CURRENT_TIMESTAMP 写进 orders.created_at 的是东八区墙钟，
-- 再被浏览器本地时区（上海手机再 +8）显示，订单时间会快 8 小时。
-- 新版本连接后执行 SET time_zone = '+00:00'，新行的 CURRENT_TIMESTAMP 已是 UTC。
-- 本文件只修正旧行。界面改为 Asia/Tashkent，不要在前端减 8 小时。
--
-- 执行前，用一个没有改过 time_zone 的 mysql 客户端核对（不要用已经 SET time_zone 的会话）：
--
--   SELECT @@global.system_time_zone AS system_time_zone,
--          @@global.time_zone AS global_time_zone,
--          @@session.time_zone AS session_time_zone,
--          NOW() AS now_session,
--          UTC_TIMESTAMP() AS utc_now,
--          TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW()) AS session_minus_utc_hours;
--
-- 阿里云中国区通常 system_time_zone 为 CST 或 Asia/Shanghai，
-- session time_zone 为 SYSTEM，session_minus_utc_hours 为 8。
-- 只有确认历史 CURRENT_TIMESTAMP 是按东八区墙钟写入时，才执行本文件。
-- 若偏移不是 8，先改下面的 INTERVAL，不要照抄 8 小时。
--
-- 部署顺序：先停写入（或确认没有新订单），执行本文件一次，再启动会 SET time_zone = '+00:00' 的新版本。
-- 新版本已经写过 UTC 的 created_at 之后再执行，会把新订单也减 8 小时。
-- schema_migrations 会挡住第二次执行。若误跑，把下面三张表加回 8 小时，再删掉标记行后才能重来：
--   DELETE FROM schema_migrations WHERE id = '20261023_utc_timestamps';
--
-- 要减 8 小时的列：INSERT 没有传入时间，值来自服务器 CURRENT_TIMESTAMP。
--   orders.created_at
--   products.created_at
--   product_categories.created_at
--   product_categories.updated_at（ON UPDATE CURRENT_TIMESTAMP，应用更新时不写这一列）
--
-- 不要改这些列。它们由应用 new Date() 写入，离散连接 timezone 'Z' 下已经是 UTC：
--   orders.completed_at
--   order_notifications.created_at、order_notifications.read_at
--   audit_logs.created_at
--   staff.created_at、staff.updated_at
--   store_settings.updated_at
--
-- 抽查：一笔已知在塔什干 20:00 完成的订单，completed_at 应约为 15:00（UTC），
-- 而不是 23:00（上海墙钟）或 20:00。若 completed_at 对得上 UTC，就不要减它。
--
--   SELECT id, created_at, completed_at
--   FROM orders
--   WHERE completed_at IS NOT NULL
--   ORDER BY completed_at DESC
--   LIMIT 5;
--
-- 需要 mysql 客户端（文件含 DELIMITER）。依赖已有的 orders、products、product_categories。

CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  applied_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS yijia_shift_shanghai_wall_clock_to_utc;

DELIMITER $$
CREATE PROCEDURE yijia_shift_shanghai_wall_clock_to_utc()
BEGIN
  DECLARE already INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT COUNT(*) INTO already
  FROM schema_migrations
  WHERE id = '20261023_utc_timestamps';

  IF already = 0 THEN
    START TRANSACTION;
    -- 只改上海墙钟。completed_at 等应用按 UTC 写入的列不在这里。
    UPDATE orders
      SET created_at = DATE_SUB(created_at, INTERVAL 8 HOUR);
    UPDATE products
      SET created_at = DATE_SUB(created_at, INTERVAL 8 HOUR);
    -- 显式赋值 updated_at，避免 ON UPDATE CURRENT_TIMESTAMP 把它改成 NOW()。
    UPDATE product_categories
      SET created_at = DATE_SUB(created_at, INTERVAL 8 HOUR),
          updated_at = DATE_SUB(updated_at, INTERVAL 8 HOUR);
    INSERT INTO schema_migrations (id, applied_at)
      VALUES ('20261023_utc_timestamps', UTC_TIMESTAMP(3));
    COMMIT;
  END IF;
END$$
DELIMITER ;

CALL yijia_shift_shanghai_wall_clock_to_utc();
DROP PROCEDURE IF EXISTS yijia_shift_shanghai_wall_clock_to_utc;
