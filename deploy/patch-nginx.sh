#!/usr/bin/env bash
# 在 noodle-website 的 80 端口配置中注入 /yijia/ 反向代理（幂等）
set -euo pipefail

NGINX_FILE="/etc/nginx/sites-enabled/noodle-website"
MARKER="# yijia-supermarket proxy"

if grep -q "$MARKER" "$NGINX_FILE"; then
  echo "nginx: yijia location already configured"
  exit 0
fi

TMP=$(mktemp)
awk -v block="$MARKER" '
  /server_name chopchopuz.com 47\.84\.229\.230;/ { found=1 }
  found && /location \/ \{/ && !inserted {
    print "    " block
    print "    location = /yijia {"
    print "        return 301 /yijia/;"
    print "    }"
    print ""
    print "    location /yijia/ {"
    print "        proxy_pass http://127.0.0.1:3001/yijia/;"
    print "        proxy_http_version 1.1;"
    print "        proxy_set_header Upgrade $http_upgrade;"
    print "        proxy_set_header Connection \"upgrade\";"
    print "        proxy_set_header Host $host;"
    print "        proxy_set_header X-Real-IP $remote_addr;"
    print "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;"
    print "        proxy_set_header X-Forwarded-Proto $scheme;"
    print "        proxy_cache_bypass $http_upgrade;"
    print "        proxy_connect_timeout 60s;"
    print "        proxy_read_timeout 60s;"
    print "        proxy_send_timeout 60s;"
    print "    }"
    print ""
    inserted=1
  }
  { print }
' "$NGINX_FILE" > "$TMP"

mv "$TMP" "$NGINX_FILE"
echo "nginx: yijia location added to noodle-website"
nginx -t
