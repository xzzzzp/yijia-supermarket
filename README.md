# Yijia Supermarket

塔什干华人超市网站 — 架构对标 [yijiasupermarket.net](https://www.yijiasupermarket.net/)

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + RSC) |
| 样式 | Tailwind CSS 4 |
| 数据库 | MySQL（未配置时订单/店员回退本地 JSON，商品用内置示例） |
| 认证 | 店员邮箱密码（MySQL）或 `ADMIN_DEV` 开发账号；会话为签名 Cookie |
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
│   ├── mysql.ts            # MySQL 连接
│   ├── products.ts         # 商品数据
│   ├── cart.ts             # 购物车 (localStorage)
│   ├── orders.ts           # 订单生成
│   └── i18n.ts             # 三语翻译
└── types/                  # TypeScript 类型
```

## MySQL

订单、店员、商品和店铺设置在配置了 `MYSQL_HOST`、`MYSQL_DATABASE`、`MYSQL_USER`（以及 `MYSQL_PASSWORD` / `MYSQL_PORT`，或单一 `MYSQL_URL`）后写入 MySQL。未配置这些变量时，订单和店员回退到 `data/*.json`，商品使用内置示例，后台用 `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` 登录。

1. 在 MySQL 8.0.16+ 里执行 `mysql/schema.sql`（需要 JSON 类型和 CHECK 约束）
2. 复制 `.env.example` 为 `.env.local`，填入连接信息。不要把真实密码提交到仓库
3. 启动 `npm run dev`，打开 `/admin/login`
4. `staff` 表为空时，用 `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` 登录。只有店主行写入成功才会进入后台
5. 之后在 `/admin/staff` 为店员设置邮箱、密码和能力。店员用这套邮箱密码登录

本地确认写入：配置好连接后提交一笔订单，再在 MySQL 里 `SELECT id, status FROM orders ORDER BY created_at DESC LIMIT 5;`。把订单推进到已完成，`completed_at` 应有值，营收只计这一状态。

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
| `/admin/notifications` | 站内接单通知；需要「接单通知」（店主始终有） |
| `/admin/settings` | 店铺设置（仅店主） |
| `/admin/staff` | 店员权限（仅店主） |
| `/admin/audit-logs` | 操作日志（仅店主） |

支付仍是配送当面线下收款，没有在线支付。订单标成「已完成（回店回款）」的时刻是配送员回店并把货款交回店铺之后。

### 订单履约状态

`pending` 待电话确认 → `confirmed` 已确认待配送 → `delivering` 配送中 → `awaiting_remittance` 已收款待回款 → `completed` 已完成（回店回款）。

后台订单页可以按这个顺序前进一步或退回一步。只有 `completed` 会写入 `completed_at`，也只有 `completed` 计入营收和热销。旧数据里的 `pending`、`completed` 含义不变。未配置 MySQL 时，订单写在 `data/orders.json`。

### 店员权限

店主在 `/admin/staff` 配置店员。能力至少包括：

| 能力 | 作用 |
|------|------|
| 接单通知 `order_notifications` | 新订单给店主和打开该开关的店员写站内通知。右上角铃铛显示未读数 |
| 查看收益/统计 `view_stats` | 看已完成营收和热销。没有该权限时仍可看订单列表 |
| 配货 `fulfillment` | 推进或退回订单状态 |
| 商品上架 `manage_products` | 人工新增、编辑、删除商品，以及可选的批量导图 |

店主拥有全部能力。店铺设置不在上述开关里，只有店主能改。

MySQL 已配置时，读库失败不会把当前登录者升成店主；第一名店主只有在 `staff` 为空、并且用 `ADMIN_DEV_*` 登录且插入成功之后才存在。未配置 MySQL 时，开发账号写入 `data/staff.json` 成功后才是店主，其他店员不能登录。

### 应用数据库变更

在 MySQL 客户端执行 `mysql/schema.sql`。已有库再执行 `mysql/migrations/20261018_notifications_and_audit.sql` 和 `mysql/migrations/20261018_orders_request_token_unique.sql`（都可重复执行），补上通知、操作日志，以及 `orders.request_token` 唯一索引。若唯一索引因历史重复 token 失败，先每个 token 只留一笔订单再执行。`supabase/` 下的 SQL 已停用。未配置 MySQL 时，通知和操作日志写在 `data/notifications.json`、`data/audit-logs.json`。同一 `request_token` 重复提交会返回已有订单，不会再插一笔。

### 商品 CRUD

- 支持中/俄/乌三语名称与规格
- 单张图片上传到 `public/products/`
- 上架 / 下架、新品、库存、排序

### 批量导入图片

1. 进入 `/admin/import`
2. 选择分类目录（如 `drinks`、`noodles`）
3. 拖拽或选择多张图片
4. 开启「自动匹配」：按文件名匹配已有商品的 `image` 或 `source_key`，自动更新图片 URL

**匹配示例：**

- 图片 `kangshifu-braised-cup.png`
- 匹配 `source_key` 含 `kangshifu-braised-cup` 的商品

商品图片保存在服务器的 `public/products/`。

