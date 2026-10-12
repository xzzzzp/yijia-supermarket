#!/usr/bin/env bash
# 本地一键部署到阿里云（与 noodle-website 隔离：8080 -> 3001）
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
fi

if ! grep -q '^NEXT_PUBLIC_BASE_PATH=/yijia' .env.local; then
  echo "ERROR: .env.local 缺少 NEXT_PUBLIC_BASE_PATH=/yijia，静态资源会 404"
  echo "请执行: cp deploy/env.production.example .env.local 并保留生产配置"
  exit 1
fi

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
