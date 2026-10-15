-- Supabase schema for yijia-supermarket
-- Run in Supabase SQL Editor

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  source_key text unique not null,
  name text not null,
  name_ru text not null default '',
  name_uz text not null default '',
  spec text not null default '',
  spec_ru text not null default '',
  spec_uz text not null default '',
  image text not null default '/products/placeholder.png',
  price integer not null default 0,
  in_stock boolean not null default true,
  is_new boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  category text not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('wechat', 'telegram')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  items jsonb not null,
  total integer not null,
  customer_name text,
  customer_phone text,
  customer_address text,
  note text,
  order_text text not null,
  request_token text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists orders_status_idx on orders(status);

create index if not exists products_category_idx on products(category);
create index if not exists products_published_idx on products(is_published);
create index if not exists orders_created_at_idx on orders(created_at desc);

create table if not exists store_settings (
  id text primary key default 'default',
  min_order_amount integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into store_settings (id, min_order_amount) values ('default', 0)
on conflict (id) do nothing;

-- 已有库升级：订单状态
alter table orders add column if not exists status text not null default 'pending';
alter table orders add column if not exists completed_at timestamptz;
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('pending', 'completed'));
create index if not exists orders_status_idx on orders(status);

-- 已有库升级：店铺设置 payload
alter table store_settings add column if not exists payload jsonb not null default '{}'::jsonb;

alter table products enable row level security;
alter table orders enable row level security;
alter table store_settings enable row level security;

create policy "Public read published products"
  on products for select
  using (is_published = true);

create policy "Service role full access products"
  on products for all
  using (auth.role() = 'service_role');

create policy "Service role full access orders"
  on orders for all
  using (auth.role() = 'service_role');

create policy "Service role full access store_settings"
  on store_settings for all
  using (auth.role() = 'service_role');

-- Storage bucket for product images
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "Service role upload product images"
  on storage.objects for all
  using (bucket_id = 'products' and auth.role() = 'service_role');
