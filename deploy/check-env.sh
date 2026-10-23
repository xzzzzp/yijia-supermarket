#!/usr/bin/env bash
# 在 npm run build 之前检查应用目录的 .env.local。
# 缺登录相关变量时退出非 0，避免 /admin/login 被预渲染成 authMode=none。
# ADMIN_SESSION_SECRET 缺失、仍是占位符、或与登录密码相同时直接失败，不再只告警。
# 用法：在仓库根目录执行  bash deploy/check-env.sh
# 测试时可设 CHECK_ENV_FILE 指向另一份 env 文件。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${CHECK_ENV_FILE:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: 应用目录没有 ${ENV_FILE}，拒绝 build。" >&2
  echo "请先复制模板并填写生产值：cp deploy/env.production.example .env.local" >&2
  echo "必填：MYSQL_HOST + MYSQL_DATABASE + MYSQL_USER（或 MYSQL_URL）、独立的 ADMIN_SESSION_SECRET、ADMIN_DEV_EMAIL、ADMIN_DEV_PASSWORD、NEXT_PUBLIC_BASE_PATH=/yijia、NEXT_PUBLIC_SITE_URL、ALLOWED_DEV_ORIGINS。" >&2
  echo "/admin/login 在 next build 时预渲染。没有这些变量就 build，登录页会写死 authMode=none（黄框「尚未配置登录方式」）。事后只补 .env.local 再 pm2 restart 不会改掉该静态页，必须带 env 重新 build。" >&2
  exit 1
fi

# 取某个键在 .env.local 里的最后一次赋值，忽略注释行。不打印值。
read_env() {
  local key="$1"
  local line value
  line="$(grep -E -- "^[[:space:]]*(export[[:space:]]+)?${key}=" "$ENV_FILE" | tail -n 1 || true)"
  [ -n "$line" ] || return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  case "$value" in
    \"*\") value="${value#\"}"; value="${value%\"}" ;;
    \'*\') value="${value#\'}"; value="${value%\'}" ;;
  esac
  printf '%s' "$value"
}

if ! grep -q -- '^NEXT_PUBLIC_BASE_PATH=/yijia' "$ENV_FILE"; then
  echo "ERROR: .env.local 缺少 NEXT_PUBLIC_BASE_PATH=/yijia，静态资源会 404。" >&2
  echo "请编辑应用目录的 .env.local（模板 deploy/env.production.example）并保留生产配置。" >&2
  echo "改环境变量后必须重新 npm run build。只 pm2 restart 不会更新已预渲染的页面。" >&2
  exit 1
fi

mysql_url="$(read_env MYSQL_URL)"
mysql_host="$(read_env MYSQL_HOST)"
mysql_database="$(read_env MYSQL_DATABASE)"
mysql_user="$(read_env MYSQL_USER)"
admin_email="$(read_env ADMIN_DEV_EMAIL)"
admin_password="$(read_env ADMIN_DEV_PASSWORD)"
admin_secret="$(read_env ADMIN_SESSION_SECRET)"

mysql_ok=0
if [ -n "$mysql_url" ] || { [ -n "$mysql_host" ] && [ -n "$mysql_database" ] && [ -n "$mysql_user" ]; }; then
  mysql_ok=1
fi

dev_ok=0
if [ -n "$admin_email" ] && [ -n "$admin_password" ]; then
  dev_ok=1
fi

if [ "$mysql_ok" -ne 1 ] && [ "$dev_ok" -ne 1 ]; then
  echo "ERROR: .env.local 没有可用的登录方式，拒绝 build。" >&2
  echo "需要满足其一：" >&2
  echo "  - MySQL：MYSQL_URL，或同时有 MYSQL_HOST、MYSQL_DATABASE、MYSQL_USER" >&2
  echo "  - 或成对的 ADMIN_DEV_EMAIL 与 ADMIN_DEV_PASSWORD" >&2
  echo "同时还需要独立的 ADMIN_SESSION_SECRET，生产不能用登录密码代替会话签名。" >&2
  echo "/admin/login 在 next build 时预渲染。上面两项都没有时，静态页会写成 authMode=none（黄框「尚未配置登录方式」）。" >&2
  echo "请先改好应用目录的 .env.local（模板 deploy/env.production.example），再重新部署。" >&2
  echo "只补文件后 pm2 restart 不会改掉已经写进静态页的登录方式，必须重新 npm run build。" >&2
  exit 1
fi

if [ -z "$admin_secret" ]; then
  echo "ERROR: .env.local 缺少 ADMIN_SESSION_SECRET，拒绝 build。" >&2
  echo "生产不能回退到 ADMIN_DEV_PASSWORD。请设置一段与登录密码不同的长随机字符串。" >&2
  exit 1
fi

if [ "$admin_secret" = "replace-with-a-long-random-string" ]; then
  echo "ERROR: ADMIN_SESSION_SECRET 仍是模板占位符，拒绝 build。" >&2
  echo "请换成独立的长随机字符串，且不要与 ADMIN_DEV_PASSWORD 相同。" >&2
  exit 1
fi

if [ -n "$admin_password" ] && [ "$admin_secret" = "$admin_password" ]; then
  echo "ERROR: ADMIN_SESSION_SECRET 不能与 ADMIN_DEV_PASSWORD 相同，拒绝 build。" >&2
  echo "会话签名必须独立于登录密码。" >&2
  exit 1
fi

warn_if_placeholder() {
  local key="$1"
  local placeholder="$2"
  local value
  value="$(read_env "$key")"
  if [ "$value" = "$placeholder" ]; then
    echo "WARN: ${key} 仍是模板占位符。生产请换成真实值后再依赖这次 build。登录或数据库可能不可用。" >&2
  fi
}

warn_if_placeholder MYSQL_PASSWORD "change-me"
warn_if_placeholder ADMIN_DEV_PASSWORD "admin123"

site_url="$(read_env NEXT_PUBLIC_SITE_URL)"
allowed_origins="$(read_env ALLOWED_DEV_ORIGINS)"
if [ -z "$site_url" ]; then
  echo "WARN: .env.local 缺少 NEXT_PUBLIC_SITE_URL。生产应设为对外地址（例如 http://<主机>/yijia）。" >&2
fi
if [ -z "$allowed_origins" ]; then
  echo "WARN: .env.local 缺少 ALLOWED_DEV_ORIGINS。" >&2
fi

echo ">>> 登录相关环境变量检查通过。接下来的 npm run build 会按当前 .env.local 预渲染 /admin/login。"
