#!/usr/bin/env bash
# 本地一键部署到阿里云（与 noodle-website 隔离：8080 -> 3001）
# 远端 npm run build 前必须已有应用目录 .env.local（模板 deploy/env.production.example）。
# rsync 排除 .env.local，且没有 --delete-excluded，--delete 不会删掉服务器上的该文件。
# /admin/login 在 build 时预渲染；缺登录变量会把 authMode=none 写进静态页。只 pm2 restart 不够。
set -euo pipefail

SERVER="root@47.84.229.230"
REMOTE_DIR="/var/www/yijia-supermarket"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo ">>> 同步代码到服务器..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude data \
  --exclude .env.local \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$LOCAL_DIR/" "$SERVER:$REMOTE_DIR/"

echo ">>> 远程构建并启动..."
ssh -o StrictHostKeyChecking=no "$SERVER" bash -s << 'REMOTE'
set -euo pipefail
cd /var/www/yijia-supermarket

if [ ! -f .env.local ]; then
  cp deploy/env.production.example .env.local
  echo "ERROR: 服务器上没有 .env.local，已从 deploy/env.production.example 复制模板，但拒绝用占位符 build。" >&2
  echo "请编辑 /var/www/yijia-supermarket/.env.local，填好 MYSQL_*（或 MYSQL_URL）、ADMIN_SESSION_SECRET、ADMIN_DEV_EMAIL、ADMIN_DEV_PASSWORD、NEXT_PUBLIC_BASE_PATH=/yijia、NEXT_PUBLIC_SITE_URL、ALLOWED_DEV_ORIGINS 后重新执行部署。" >&2
  echo "/admin/login 在 next build 时预渲染。未填写就 build 会把登录方式写进静态页；事后只 pm2 restart 不会更新该页。" >&2
  exit 1
fi

# 缺 BASE_PATH、MySQL/ADMIN_DEV 或会话密钥时直接退出，不执行 npm run build。
bash deploy/check-env.sh

npm ci
npm run build

pm2 delete yijia-supermarket 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

cp deploy/nginx-yijia.conf /etc/nginx/sites-available/yijia-supermarket
ln -sf /etc/nginx/sites-available/yijia-supermarket /etc/nginx/sites-enabled/yijia-supermarket
nginx -t
systemctl reload nginx

echo ">>> 部署完成"
pm2 list
REMOTE

echo ""
echo "访问地址: http://47.84.229.230/yijia/"
echo "后台登录: http://47.84.229.230/yijia/admin/login/"
