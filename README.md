# Yijia Supermarket

塔什干华人超市网站 — 架构对标 [yijiasupermarket.net](https://www.yijiasupermarket.net/)

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + RSC) |
| 样式 | Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) |
| 认证 | Supabase Auth |
| 部署 | Vercel |
| 购物车 | localStorage |
| 下单 | 华人 → WeChat / 本地人 → Telegram |

## 快速开始

```bash
# 安装依赖
npm install

# 复制环境变量（可选，不配置则使用内置 seed 数据）
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
src/
├── app/                    # Next.js 页面 & API
│   ├── page.tsx            # 首页
│   ├── cart/               # 购物车
│   ├── products/[category] # 分类页
│   ├── search/             # 搜索
│   ├── admin/              # 后台管理
│   └── api/orders/         # 下单 API
├── components/             # UI 组件
├── providers/              # ProductCatalog + Language Context
├── lib/                    # 工具函数
│   ├── supabase/           # Supabase 客户端
│   ├── products.ts         # 商品数据
│   ├── cart.ts             # 购物车 (localStorage)
│   ├── orders.ts           # 订单生成
│   └── i18n.ts             # 三语翻译
└── types/                  # TypeScript 类型
```

## Supabase 配置

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 中执行 `supabase/schema.sql`
3. 在 Authentication 中创建管理员账号
4. 将 URL 和 Key 填入 `.env.local`

## 下单流程

```
选商品 → 加购物车 → 填写信息 → 提交
  ├── 中文界面 → 生成订单 → 复制 → WeChat 发送
  └── 俄语/乌兹别克语 → 生成订单 → 跳转 Telegram
```

## 部署到 Vercel

```bash
npm i -g vercel
vercel
```

在 Vercel 项目设置中添加环境变量（同 `.env.example`）。

## 后台管理

| 路径 | 功能 |
|------|------|
| `/admin` | 商品列表（编辑 / 删除），需要「商品上架」 |
| `/admin/products/new` | 人工新增商品 |
| `/admin/products/[id]/edit` | 人工编辑商品 |
| `/admin/import` | 可选辅助：批量导入图片 |
| `/admin/orders` | 订单履约、交易记录；营收统计需「查看收益/统计」 |
| `/admin/settings` | 店铺设置（仅店主） |
| `/admin/staff` | 店员权限（仅店主） |

支付仍是配送当面线下收款，没有在线支付。订单标成「已完成」的时刻是配送员回店并把货款交回店铺之后。

### 订单履约状态

`pending` 待电话确认 → `confirmed` 已确认待配送 → `delivering` 配送中 → `awaiting_remittance` 已收款待回款 → `completed` 已完成（已回款）。

后台订单页可以按这个顺序前进一步或退回一步。只有 `completed` 会写入 `completed_at`，也只有 `completed` 计入营收和热销。旧数据里的 `pending`、`completed` 含义不变。本地未配置 Supabase 时，订单写在 `data/orders.json`。

### 店员权限

店主在 `/admin/staff` 配置店员。能力至少包括：

| 能力 | 作用 |
|------|------|
| 接单通知 `order_notifications` | 保存开关。新订单落库时调用通知钩子，推送和铃声尚未接入 |
| 查看收益/统计 `view_stats` | 看已完成营收和热销。没有该权限时仍可看订单列表 |
| 配货 `fulfillment` | 推进或退回订单状态 |
| 商品上架 `manage_products` | 人工新增、编辑、删除商品，以及可选的批量导图 |

店主拥有全部能力。店铺设置不在上述开关里，只有店主能改。

第一个登录后台的账号，在 `staff` 表为空时会自动写成店主。之后用邮箱添加店员：已配置 Supabase 时会关联现有 Auth 用户，没有则发送邀请邮件；也可以直接填写 Auth User UID。未配置 Supabase 时，开发账号 `ADMIN_DEV_EMAIL` 就是店主，店员写在 `data/staff.json`，其他店员还不能登录。

### 应用数据库变更

新项目：在 Supabase SQL Editor 执行整个 `supabase/schema.sql`。

已有项目：执行 `supabase/migrations/20261016_fulfillment_and_staff.sql`（或 schema.sql 里「已有库升级」那一段）。执行后重新登录后台，空的 `staff` 表会把当前账号建成店主，再到 `/admin/staff` 添加店员。

### 商品 CRUD

- 支持中/俄/乌三语名称与规格
- 单张图片上传（Supabase Storage 或本地 `public/products/`）
- 上架 / 下架、新品、库存、排序

### 批量导入图片

1. 进入 `/admin/import`
2. 选择分类目录（如 `drinks`、`noodles`）
3. 拖拽或选择多张图片
4. 开启「自动匹配」：按文件名匹配已有商品的 `image` 或 `source_key`，自动更新图片 URL

**匹配示例：**

- 图片 `kangshifu-braised-cup.png`
- 匹配 `source_key` 含 `kangshifu-braised-cup` 的商品

### Supabase Storage

在 SQL Editor 执行 `supabase/schema.sql` 后会创建 `products` 存储桶。生产环境图片走 Supabase CDN；本地开发可写入 `public/products/`。

