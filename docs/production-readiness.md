# 亿佳超市上线缺口（更新）

对照形态：`basePath=/yijia`、PM2 `127.0.0.1:3001`、nginx 反代 `/yijia/`、Supabase。

本地已用 `NEXT_PUBLIC_BASE_PATH=/yijia` 构建并启动生产模式。浏览器从分类页加入购物车、填写联系方式后，中文订单打开 `/yijia/order/success/`，俄语订单跳到 `t.me`。数量为 0、缺少联系方式会返回 400。相同 `requestToken` 不会生成第二张订单。

## 已完成

1. **basePath。** `src/lib/paths.ts` 的 `appPath()` 给 `fetch` 和微信跳转加上 `/yijia` 和尾部斜杠。退出登录改为 Server Action（`src/components/admin/AdminNav.tsx`），不再 POST 到站点根路径的 `/admin/logout`。
2. **后台登录。** `NODE_ENV=production` 时开发密码无效，登录页不再渲染密码。Supabase 用户必须出现在 `ADMIN_EMAILS`。开发 cookie 改为 HMAC，不再是字面量 `1`。Supabase cookie 的 path 与 `basePath` 一致。`deploy/env.production.example` 已去掉默认密码。
3. **订单落库。** Supabase 已配置时，写入失败返回 500，不再退回本地文件或随机 UUID。`request_token` 在代码里去重，`supabase/schema.sql` 增加唯一索引 `orders_request_token_uidx`。前台目录查询失败会抛错，不再用 6 条 seed 顶替；只有完全没配 Supabase 的本地开发才用 seed。
4. **后台商品。** `fetchAllProducts` / `fetchProductById` 走 service role，未上架商品可以继续编辑。
5. **部署脚本。** `deploy/*.sh` 和同目录配置已是 LF。`deploy/deploy.sh` 会调用 `deploy/patch-nginx.sh`，注入 `/yijia/` 反代并 `nginx -t` + reload。缺少 Supabase 或 `ADMIN_EMAILS`、或仍是占位符时部署会停。HTTPS 没有自动申请证书，脚本末尾有说明。
6. **下单校验和通知。** 数量 1–99，必须有货，姓名/电话/地址必填。配置 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID` 后，保存成功会给店铺发 Telegram；未配置时订单仍保存，响应里 `notified: false`。乌兹别克语订单正文不再套俄语标签。
7. **营业时间和字体。** 营业状态用 `Asia/Tashkent`。正文加载 Source Sans 3 的 `cyrillic`；标题字体缺字时回退到正文字体。
8. **CI。** `.github/workflows/ci.yml` 跑 `lint`、`typecheck`、`next build`。本地这三项已通过。

## 仍要处理

- **现有 Supabase 要补索引。** 在 SQL Editor 执行 `create unique index if not exists orders_request_token_uidx on orders(request_token);`。若已有重复 `request_token`，先去重。`schema.sql` 里其他 `CREATE POLICY` 仍不能重复执行。
- **服务器 `.env.local`。** 按 `deploy/env.production.example` 填入真实 Supabase 和 `ADMIN_EMAILS`。旧环境若只有 `ADMIN_DEV_PASSWORD`，下次 `deploy.sh` 会拒绝部署，生产进程也不会接受开发登录。
- **HTTPS。** 站点仍是 HTTP，订单电话和地址会明文经过网络。有域名后用 certbot，把 `NEXT_PUBLIC_SITE_URL` 改成 https 再重新构建。脚本不申请证书。
- **nginx 注入依赖现有站点。** `patch-nginx.sh` 只改 `/etc/nginx/sites-enabled/noodle-website` 里匹配 `server_name chopchopuz.com 47.84.229.230` 的 server。文件或 `server_name` 变了会失败并停部署。
- **SSH。** `deploy.sh` 仍是 `root@` 和 `StrictHostKeyChecking=no`。
- **店铺设置双写。** `src/lib/settings.server.ts` 先写本地 JSON，Supabase 失败时后台仍可能显示保存成功。
- **图片上传。** 没有大小、MIME、文件头限制；公开桶 `upsert` 可覆盖同名文件。批量导入仍受 Server Action 大约 1MB 的限制。
- **没有频率限制。** 公开下单接口可以反复提交不同 token。
- **微信成功页仍把订单正文放在 query string 里**，会进入访问日志和浏览器历史。这是当前“复制到微信”的实现方式。
- **顾客仍要自己把微信/Telegram 消息发出去。** Bot 通知只在配置了 token 和 chat id 时发给店铺。
- **没有业务单测。** CI 只做 lint、类型检查和构建。

## 建议的下一步

1. 在 Supabase 执行唯一索引，并把生产 `.env.local` 换成真实 key 和 `ADMIN_EMAILS`。
2. 配 Telegram Bot 后下一张测试单，确认店铺收到消息。
3. 有域名后上 HTTPS 并重新构建。
