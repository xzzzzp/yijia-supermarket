# 亿佳超市上线前缺口

审查范围：当前仓库（Next.js 16 App Router）。对照的生产形态是 `basePath=/yijia`、PM2 监听 `127.0.0.1:3001`、nginx 反代 `http://<host>/yijia/`、数据层为 Supabase。仓库里的部署模板和这段形态并不一致，下面每一条都标了代码位置。

结论：还不能当成可稳定接单的生产站。中文/俄语下单在 `/yijia` 下会打到错误 URL；鉴权在两种配置下都不安全；订单和商品在 Supabase 失败时会假装成功或退回示例数据；`deploy/` 里的脚本仍是 CRLF，而且不会装上真正在用的反代。

## P0 必须先修

### 1. `/yijia` 下单链路会打到站点根路径

`next/link` 和 `router.push` 会自动加 `basePath`。下面三处是浏览器原生 URL，不会加：

- `src/components/CartView.tsx` 的 `fetch("/api/orders")`。页面在 `/yijia/cart/` 时，请求发到 `http://<host>/api/orders`。nginx 只反代 `/yijia/`（见 `deploy/patch-nginx.sh`），这个 POST 会落到同机的其他站点。
- `src/lib/orders.ts` 的 `getRedirectUrl()` 在微信渠道返回 `/order/success?channel=wechat&text=...`。`CartView` 把它赋给 `window.location.href`，跳转到 `http://<host>/order/success`，同样不在 `/yijia` 下。
- `src/components/admin/AdminNav.tsx` 的 `<form action="/admin/logout">` 会 POST 到 `/admin/logout`，生产环境退出登录 404。

`src/lib/paths.ts` 已有 `getBasePath()`，目前只给开发 cookie 和 `src/lib/assets.ts` 用。修的时候让下单 API、成功页跳转、退出表单都走它。`next.config.ts` 在有 `basePath` 时还开了 `trailingSlash: true`，成功页路径要带尾部斜杠，否则多一次重定向。

### 2. 后台鉴权不能用于公网

两条配置路径都不安全：

- 未配置 Supabase 时走开发登录。`src/lib/dev-auth.ts` 把 cookie `yijia-dev-admin` 设成字面量 `"1"`，无签名、无 `secure`。知道 cookie 名即可伪造后台会话。`src/app/admin/login/page.tsx` 把 `ADMIN_DEV_EMAIL` / `ADMIN_DEV_PASSWORD` 传给客户端组件，`AdminLoginClient.tsx` 把账号密码渲染进登录页 HTML。
- `deploy/env.production.example` 默认就是这条路径：`ADMIN_DEV_PASSWORD=admin123`，Supabase 三行被注释。`deploy/deploy.sh` 在服务器没有 `.env.local` 时会 `cp` 这份文件。按仓库模板做首次部署，公网登录页会显示 `admin123`。
- 配置了 Supabase 时，`src/lib/admin-auth.ts` 的 `requireAdmin()` 只检查 `auth.getUser()` 有没有用户，不检查邮箱白名单或 `app_metadata` 角色。Supabase 项目若开着公开注册，任何人注册后都能进 `/admin` 并使用 service role 做增删改。

上线要求：生产环境禁止开发登录；cookie 必须签名且 `Secure`；管理员必须是显式白名单。service role 只留在服务器。

### 3. 订单和商品失败时仍对顾客返回成功

`src/lib/orders.server.ts` 的 `saveOrderRecord()`：Supabase 插入失败只 `console.warn`，再写本地 `data/orders.json`；本地也失败就 `return randomUUID()`。`src/app/api/orders/route.ts` 不看是否真的落库，一律 `{ ok: true }`。后台 `fetchOrderRecords()` 只要 Supabase 查询成功就忽略本地文件，于是顾客看到下单成功，后台列表里没有这单。

`src/lib/products.server.ts` 的 `fetchProducts()` 在查询失败或结果为空时返回 `SEED_PRODUCTS`（`src/lib/products.ts` 里 6 个占位商品）。空库或短暂故障会把假商品卖出去。

修法：Supabase 已配置时，写入失败返回 500；禁止用 seed 顶替线上目录；`request_token` 做唯一约束并在插入前去重（现在只校验长度 ≥ 8，见 `validateOrderRequest`）。

### 4. 后台读商品用了 anon key，RLS 会藏掉未上架商品

写操作走 `src/lib/supabase/admin.ts` 的 service role。读操作 `fetchAllProducts()` / `fetchProductById()` 走 `src/lib/supabase/server.ts` 的用户会话。

`supabase/schema.sql` 的公开策略是 `is_published = true`。`auth.role() = 'service_role'` 那几条对用户 JWT 不生效，service role 本来也会绕过 RLS。结果：

- 未上架商品不出现在 `/admin` 列表。
- 新建时如果取消「已上架」，`createProduct` 重定向到编辑页后 `fetchProductById` 得到 null，页面 404。
- 后台无法再把下架商品改回上架。

后台读写都应使用 service role，并先经过 `requireAdmin()`。

### 5. 部署脚本和线上形态对不上，而且脚本仍是 CRLF

`file` 显示这些文件仍是 CRLF：`deploy/deploy.sh`、`deploy/patch-nginx.sh`、`deploy/nginx-yijia.conf`、`deploy/ecosystem.config.cjs`、`deploy/env.production.example`。在 Linux 上执行 bash 脚本会因 `pipefail\r` 直接失败。这是已经出现过的问题，仓库里还没修。

职责也是拆开的：

- `deploy/nginx-yijia.conf` 只在 8080 上 `return 301` 到 `/yijia/`，没有反代到 3001。
- 真正的反代写在 `deploy/patch-nginx.sh`，往 `/etc/nginx/sites-enabled/noodle-website` 注入 `location /yijia/`。`deploy/deploy.sh` 不调用它。脚本改完只 `nginx -t`，不 reload。
- `deploy.sh` 使用 `ssh -o StrictHostKeyChecking=no`、`root@<公网 IP>`、`rsync --delete`。主机和 root 登录写死在仓库里。
- 全站 HTTP，没有 TLS。订单里有电话和地址。
- `README.md` 仍写部署到 Vercel；`.env.example` 没有 `NEXT_PUBLIC_BASE_PATH`。`NEXT_PUBLIC_*` 在 `next build` 时打进包，改 env 后必须重新构建。

可重复部署要满足：脚本 LF、一份 nginx 配置同时完成 `/yijia/` 反代和旧端口跳转、改完 reload、生产 env 示例启用 Supabase 且不含开发密码、补 HTTPS。

## P1 应该修

### 下单校验

`src/app/api/orders/route.ts` 和 `src/lib/orders.ts`：

- 不检查 `inStock`。前台 `AddToCartControl` 会挡住缺货，API 仍接受。
- `quantity` 没有正整数和上限。负数或超大数会写进 `orders.total`（PostgreSQL `integer`，大约 21 亿封顶）。
- 姓名、电话、地址都可选。配送单可以没有联系方式。
- 没有频率限制。公开 POST 可被刷单。
- 微信成功页把整段订单（含电话、地址）放进 query string（`OrderSuccessContent.tsx`）。会出现在访问日志、浏览器历史和 Referer。
- 乌兹别克语下单走 Telegram，但 `buildOrderItems` 在非微信时写死 `locale = "ru"`，订单正文是俄语商品名。接口错误文案也全是中文。
- 店铺不会被主动通知。微信要顾客自己复制粘贴，Telegram 只是打开 `t.me` 预填文本，顾客不点发送就没有消息。后台要靠人盯 `/admin/orders`。

### 设置和图片

- `src/lib/settings.server.ts` 先写 `data/settings.json`，再 upsert Supabase。Supabase 失败只打日志，`updateStoreSettings` 仍返回「保存成功」。读路径优先 Supabase，所以后台显示成功、前台仍是旧值。两份存储在多实例时会分叉。
- `src/lib/storage.ts` 不限制大小、MIME、文件头。`contentType` 用客户端声明，`upsert: true` 可覆盖同名对象。公开桶 `products` 若接受 SVG/HTML，存在存储型 XSS。分类目录没有白名单，本地写入时 `category` 可带 `../`。
- Server Action 默认 body 约 1MB。`batchImportImages` 一次传多张图会在校验前被平台拒绝。
- `supabase/schema.sql` 的 `CREATE POLICY` 不能重复执行。第二次跑 SQL Editor 会在策略处失败。存储策略 `FOR ALL` 只有 `USING`，没有 `WITH CHECK`（当前上传走 service role，所以还没爆）。

### 营业时间和前台语言

- `src/lib/store-settings-defaults.ts` 的 `isStoreOpenNow()` 用 `new Date().getHours()`，即时区是浏览器本地时区，不是 `Asia/Tashkent`。国内打开网站会显示错误的营业状态。
- `src/app/layout.tsx` 只加载 `Outfit` / `Source_Sans_3` 的 `latin` subset。默认语言是俄语，西里尔字母会掉到系统后备字体。
- 语言存在 `localStorage`（`LanguageProvider`），首屏固定 `ru`，刷新后才切到用户语言。`<html lang>` 在服务端写死 `ru`。

### 会话和同机站点

`src/lib/supabase/server.ts` 没有把 cookie `path` 设成 `/yijia`。Supabase 默认 path 是 `/`。和 `chopchopuz.com` 上的 noodle 站共用主机时，`sb-*` cookie 会互相带上。开发 cookie 已经用了 `getCookiePath()`，Supabase 会话应对齐。

### 数据可恢复性

仓库商品只有 6 条 seed，图片全是 `public/products/placeholder.svg`。没有目录导入脚本、订单导出、或数据库备份说明。线上目录只存在于 Supabase，仓库无法重建。

### 工程化

没有测试、没有 `.github` CI、`package.json` 没有 `typecheck`。`npm run lint` 和 `next build` 都没有自动跑。没有 `error.tsx` / `not-found.tsx` / 健康检查。PM2 配置没有日志路径和启动后的健康探测。

## P2 可以随后做

- 登录页标题写成「宜家超市」（`AdminLoginClient.tsx`），店名是「亿佳」。
- 成功页文案只有中文；`channel` 不是 `wechat` 时显示「订单已通过 Telegram 发送」，即使请求没有真正发到 Telegram。
- 按名称排序固定 `nameRu`（`sortProducts`）。搜索未包含 `specUz`。
- 13 个分类始终展示，和实际有货无关。`public/` 里还留着 create-next-app 的 `vercel.svg`、`next.svg` 等。
- 订单列表一次把全部记录送到客户端，没有分页、导出、删除。
- Telegram 深链有 URL 长度上限，大订单预填文本会被截断。
- 没有 CSP、`X-Frame-Options`、`Referrer-Policy`。nginx 片段和 `next.config.ts` 都没加。
- 商品 `category` 在 `parseProductForm` 里直接断言，数据库没有分类 check 约束。
- 没有 sitemap、`metadataBase`、分享图。

## 建议的动手顺序

1. 把下单 `fetch`、微信跳转、退出登录改成带 `basePath` 的路径，并在 `/yijia/` 下实际走一遍加购到成功页。
2. 关掉开发登录，加上管理员白名单；从生产 env 示例删掉默认密码。
3. 订单写入失败即 500；`request_token` 唯一；前台目录查询失败时显示错误，不要回退 seed。
4. 后台商品读写改走 service role，确认下架商品还能编辑。
5. `deploy/*.sh` 转 LF；让 `deploy.sh` 安装并 reload `/yijia/` 反代；补 HTTPS。
6. 补数量、库存、联系方式校验，以及店铺侧通知（Telegram bot 或同类推送）。
7. 营业时间改用 `Asia/Tashkent`；字体加上 `cyrillic`。
8. 加一个最小 CI：`lint`、`tsc --noEmit`、`next build`。为订单校验和 `getBasePath` 路径各留几个单测。

## 已经对齐、不用重做的部分

- 成交价来自服务端商品表，不信任客户端价格。
- 订单表没有 anon 插入策略，写入集中在 service role。
- 购物车在 `localStorage`，和 README 描述一致。
- 前台中/俄/乌文案在 `src/lib/i18n.ts`，店铺文案可在后台设置里改。
- `rsync` 排除了 `.env.local` 和 `data/`，重复部署不会抹掉服务器上的 env 和本地订单文件。
- PM2 绑定 `127.0.0.1:3001`，不直接对公网暴露 Node。
