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
| `/admin` | 商品列表（编辑 / 删除） |
| `/admin/products/new` | 新增商品 |
| `/admin/products/[id]/edit` | 编辑商品 |
| `/admin/import` | 批量导入图片 |

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

