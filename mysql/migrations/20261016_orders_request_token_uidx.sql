-- 已有库补 request_token 唯一索引。新库直接执行 mysql/schema.sql 即可。
-- 若已有重复 request_token，先去重再执行。索引已存在时本语句会失败，可忽略。
ALTER TABLE orders
  ADD UNIQUE KEY orders_request_token_uidx (request_token);
