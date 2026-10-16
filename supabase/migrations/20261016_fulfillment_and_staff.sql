-- 已停用。订单和店员改由 MySQL 保存，请执行 mysql/schema.sql。
-- 本文件是原先 Supabase 升级脚本，只作对照。

-- 已有库升级：订单履约状态 + 店员权限
-- 在 Supabase SQL Editor 执行本文件，或重新执行 supabase/schema.sql 中对应段落。
-- 旧订单 pending / completed 保持原义，无需改写行数据。
-- completed 仍表示配送员回店回款，营收只统计该状态。

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'delivering', 'awaiting_remittance', 'completed'));

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  display_name text not null default '',
  is_owner boolean not null default false,
  order_notifications boolean not null default false,
  view_stats boolean not null default false,
  fulfillment boolean not null default false,
  manage_products boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists staff_email_lower_idx on staff (lower(email));

alter table staff enable row level security;
drop policy if exists "Service role full access staff" on staff;
create policy "Service role full access staff"
  on staff for all
  using (auth.role() = 'service_role');
