# Yijia Supermarket

塔什干华人超市网站 — 架构对标 [yijiasupermarket.net](https://www.yijiasupermarket.net/)

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + RSC) |
| 样式 | Tailwind CSS 4 |
| 数据库 | MySQL（未配置时订单/店员回退本地 JSON，商品用内置示例） |
| 认证 | 店员邮箱密码（MySQL）或本地 `ADMIN_DEV`；会话为签名 Cookie |
| 部署 | PM2 + nginx，`basePath=/yijia`（见 `deploy/`） |
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
2. 已有库若还没有 `orders_request_token_uidx`，再执行 `mysql/migrations/20261016_orders_request_token_uidx.sql`。有重复 `request_token` 时先去重
3. 复制 `.env.example` 为 `.env.local`，填入连接信息。不要把真实密码提交到仓库
4. 启动 `npm run dev`，打开 `/admin/login`
5. `staff` 表为空时，用 `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` 登录。只有店主行写入成功才会进入后台
6. 之后在 `/admin/staff` 为店员设置邮箱、密码和能力。店员用这套邮箱密码登录

本地确认写入：配置好连接后提交一笔订单，再在 MySQL 里 `SELECT id, status FROM orders ORDER BY created_at DESC LIMIT 5;`。把订单推进到已完成，`completed_at` 应有值，营收只计这一状态。相同 `request_token` 不会生成第二张订单。

## 下单流程

```
选商品 → 加购物车 → 填写信息 → 提交
  ├── 中文界面 → 生成订单 → 复制 → WeChat 发送
  └── 俄语/乌兹别克语 → 生成订单 → 跳转 Telegram
```

## 部署

生产环境用 `deploy/deploy.sh`：同步代码、`npm ci && npm run build`、PM2 监听 `127.0.0.1:3001`，并调用 `deploy/patch-nginx.sh` 把 `/yijia/` 反代写入 nginx 后 reload。

服务器 `.env.local` 以 `deploy/env.production.example` 为准，必须填写 MySQL 连接、`ADMIN_SESSION_SECRET`，以及第一名店主的邮箱和密码。`NEXT_PUBLIC_BASE_PATH` 在构建时打进前端。生产环境签发会话不会回退到 `ADMIN_DEV_PASSWORD`；未配置 MySQL 时开发登录也不会生效。

HTTPS 需在有域名后用 certbot 单独配置，本仓库的脚本不申请证书。

可选：配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID` 后，下单成功会给店铺 Telegram 发一条通知。未配置时订单仍会保存。

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

后台订单页可以按这个顺序前进一步或退回一步。只有 `completed` 会写入 `completed_at`，也只有 `completed` 计入营收和热销。旧数据里的 `pending`、`completed` 含义不变。未配置 MySQL 时，订单写在 `data/orders.json`。

### 店员权限

店主在 `/admin/staff` 配置店员。能力至少包括：

| 能力 | 作用 |
|------|------|
| 接单通知 `order_notifications` | 保存开关。新订单落库时调用通知钩子，推送和铃声尚未接入 |
| 查看收益/统计 `view_stats` | 看已完成营收和热销。没有该权限时仍可看订单列表 |
| 配货 `fulfillment` | 推进或退回订单状态 |
| 商品上架 `manage_products` | 人工新增、编辑、删除商品，以及可选的批量导图 |

店主拥有全部能力。店铺设置不在上述开关里，只有店主能改。

MySQL 已配置时，读库失败不会把当前登录者升成店主；第一名店主只有在 `staff` 为空、并且用 `ADMIN_DEV_*` 登录且插入成功之后才存在。未配置 MySQL 时，开发账号写入 `data/staff.json` 成功后才是店主，其他店员不能登录。

### 应用数据库变更

在 MySQL 客户端执行 `mysql/schema.sql`。`supabase/` 下的 SQL 已停用。

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

