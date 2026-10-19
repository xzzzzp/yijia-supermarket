/** PM2 配置 — 端口 3001，与 noodle-website(3000) 隔离
 *  这里只设置 NODE_ENV / PORT。Next 在 `npm run build` 时读取应用目录的 `.env.local`。
 *  `/admin/login` 会在 build 时预渲染；改登录相关变量后必须重新 build，只 `pm2 restart` 不会更新该静态页。
 */
module.exports = {
  apps: [
    {
      name: "yijia-supermarket",
      cwd: "/var/www/yijia-supermarket",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3001 -H 127.0.0.1",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
      },
      max_memory_restart: "768M",
      exp_backoff_restart_delay: 200,
    },
  ],
};