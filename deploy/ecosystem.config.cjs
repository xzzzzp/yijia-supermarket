/** PM2 配置 — 端口 3001，与 noodle-website(3000) 隔离 */
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