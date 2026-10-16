#!/usr/bin/env bash
# 部署到阿里云：PM2 监听 127.0.0.1:3001，nginx 在 80 端口反代 /yijia/
# TLS 不在本脚本中配置。有域名后用 certbot 签发证书，并把 NEXT_PUBLIC_SITE_URL 改为 https 后重新构建。
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
  echo "ERROR: 已生成 .env.local 模板，请填入 MySQL、ADMIN_SESSION_SECRET 和店主账号后再部署"
  exit 1
fi

require_var() {
  if ! grep -Eq "^${1}=.+" .env.local; then
    echo "ERROR: .env.local 缺少 ${1}"
    exit 1
  fi
}

require_var NEXT_PUBLIC_BASE_PATH
require_var ADMIN_SESSION_SECRET
require_var ADMIN_DEV_EMAIL
require_var ADMIN_DEV_PASSWORD

if grep -Eq '^MYSQL_URL=.+' .env.local; then
  :
else
  require_var MYSQL_HOST
  require_var MYSQL_DATABASE
  require_var MYSQL_USER
  require_var MYSQL_PASSWORD
fi

if ! grep -q '^NEXT_PUBLIC_BASE_PATH=/yijia' .env.local; then
  echo "ERROR: .env.local 缺少 NEXT_PUBLIC_BASE_PATH=/yijia，静态资源会 404"
  exit 1
fi

if grep -Eq 'change-me|replace-with-a-long-random-string|admin123|admin@local.dev|your-project|your-anon-key' .env.local; then
  echo "ERROR: .env.local 仍含占位符，请填入真实 MySQL 密码、会话密钥和店主账号"
  exit 1
fi

npm ci
npm run build

pm2 delete yijia-supermarket 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save

cp deploy/nginx-yijia.conf /etc/nginx/sites-available/yijia-supermarket
ln -sf /etc/nginx/sites-available/yijia-supermarket /etc/nginx/sites-enabled/yijia-supermarket
bash deploy/patch-nginx.sh
nginx -t
systemctl reload nginx

echo ">>> 部署完成"
pm2 list
REMOTE

echo ""
echo "访问地址: http://47.84.229.230/yijia/"
echo "后台登录: http://47.84.229.230/yijia/admin/login/"
echo "HTTPS 尚未自动配置。有域名后用 certbot，并更新 NEXT_PUBLIC_SITE_URL 后重新部署。"
