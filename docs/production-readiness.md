# 亿佳超市上线缺口（更新）

对照形态：`basePath=/yijia`、PM2 `127.0.0.1:3001`、nginx 反代 `/yijia/`、MySQL、店员权限。`supabase/` 里的 SQL 已停用，只作旧结构对照。

下单成功后始终打开站内 `/order/success/`（带 `basePath`）。微信和 Telegram 深链在确认页上打开，不再由下单接口直接跳到 `t.me`。数量为 0、缺少联系方式会返回 400。相同 `requestToken` 不会生成第二张订单。

## 已完成

1. **basePath。** `src/lib/paths.ts` 的 `appPath()` 给 `fetch` 加上 `/yijia` 和尾部斜杠。购物车提交走 `appPath("/api/orders")`，站内确认页跳转用 `assetPath`，避免漏掉 `basePath`。退出登录改为 Server Action（`src/components/admin/AdminNav.tsx`），不再 POST 到站点根路径的 `/admin/logout`。店员导航和履约入口保持 main。
2. **后台登录。** 保留 main 的签名会话和店员权限，不恢复 `ADMIN_EMAILS` 白名单。生产环境必须配置 `ADMIN_SESSION_SECRET`，不会回退到 `ADMIN_DEV_PASSWORD`。未配置 MySQL 时，`NODE_ENV=production` 不接受开发登录。MySQL 已配置且 `staff` 为空时，仍用 `ADMIN_DEV_*` 创建第一名店主，写入失败不会登录成功。
3. **订单落库。** MySQL 已配置时，写入失败抛出 `OrderPersistError` 并返回 500，不再退回本地文件或随机 UUID。相同 `request_token` 返回已有订单，不重复通知。`mysql/schema.sql` 增加唯一索引 `orders_request_token_uidx`。未配置 MySQL 时才用本地 JSON；商品目录只有未配置 MySQL 时才用内置示例。
4. **后台商品和履约。** 商品、订单状态、店员能力保持 main 的 MySQL 实现。履约状态仍是待电话确认 → 已确认待配送 → 配送中 → 已收款待回款 → 已完成。
5. **部署脚本。** `deploy/*.sh` 为 LF。`deploy/deploy.sh` 会调用 `deploy/patch-nginx.sh`，注入 `/yijia/` 反代并 `nginx -t` + reload。缺少 MySQL 连接、`ADMIN_SESSION_SECRET`、店主账号，或仍是占位符时部署会停。HTTPS 没有自动申请证书，脚本末尾有说明。
6. **下单校验和通知。** 数量 1–99，必须有货且已上架，姓名/电话/地址必填。配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID` 后，新订单保存成功会给店铺发 Telegram；未配置或重复提交时订单仍保存，响应里 `notified: false`。俄语和乌兹别克语订单正文分开。店员接单通知钩子仍只记录收件人，不代替 Bot。
7. **营业时间和字体。** 营业状态用 `Asia/Tashkent`。正文加载 Source Sans 3 的 `cyrillic`；标题字体缺字时回退到正文字体。
8. **CI。** `.github/workflows/ci.yml` 跑 `lint`、`typecheck`、`next build`。

## 仍要处理

- **现有 MySQL 要补索引。** 已建过 `orders` 表的库执行 `mysql/migrations/20261016_orders_request_token_uidx.sql`。若已有重复 `request_token`，先去重。新库直接执行 `mysql/schema.sql`。
- **服务器 `.env.local`。** 按 `deploy/env.production.example` 填入真实 MySQL 密码、`ADMIN_SESSION_SECRET` 和第一名店主账号。示例里的 `change-me`、`admin123`、`admin@local.dev` 会被 `deploy.sh` 拒绝。
- **HTTPS。** 站点仍是 HTTP，订单电话和地址会明文经过网络。有域名后用 certbot，把 `NEXT_PUBLIC_SITE_URL` 改成 https 再重新构建。脚本不申请证书。
- **nginx 注入依赖现有站点。** `patch-nginx.sh` 只改 `/etc/nginx/sites-enabled/noodle-website` 里匹配 `server_name chopchopuz.com 47.84.229.230` 的 server。文件或 `server_name` 变了会失败并停部署。
- **SSH。** `deploy.sh` 仍是 `root@` 和 `StrictHostKeyChecking=no`。
- **图片上传。** 写到 `public/products/`，没有大小、MIME、文件头限制，同名文件会覆盖。批量导入仍受 Server Action 大约 1MB 的限制。
- **没有频率限制。** 公开下单接口可以反复提交不同 token。
- **确认页仍把订单正文放在 query string 里**，会进入访问日志和浏览器历史。这是当前站内确认页把正文交给微信/Telegram 按钮的方式。
- **顾客仍要自己把微信/Telegram 消息发出去。** Bot 通知只在配置了 token 和 chat id 时发给店铺。店员「接单通知」目前只是能力开关。
- **没有业务单测。** CI 只做 lint、类型检查和构建。

## 建议的下一步

1. 在现有 MySQL 执行唯一索引迁移，并把生产 `.env.local` 换成真实连接、会话密钥和店主账号。
2. 配 Telegram Bot 后下一张测试单，确认店铺收到消息；再用同一个 `requestToken` 提交，确认不会出现第二张订单。
3. 有域名后上 HTTPS 并重新构建。
