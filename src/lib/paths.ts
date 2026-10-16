/** 应用 basePath，生产环境为 /yijia。必须在构建时注入。 */
export function getBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
}

/** Cookie 作用路径，子路径部署时必须与 basePath 一致 */
export function getCookiePath(): string {
  const base = getBasePath();
  return base || "/";
}

/**
 * 浏览器要请求的路径。
 * next/link 会自动加 basePath；fetch、location 和原生 form action 不会。
 * 配置了 basePath 时 next.config 同时打开 trailingSlash，这里一并补上尾部斜杠。
 */
export function appPath(path: string): string {
  const raw = path.startsWith("/") ? path : `/${path}`;
  const queryIndex = raw.indexOf("?");
  const pathname = queryIndex === -1 ? raw : raw.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : raw.slice(queryIndex);
  const base = getBasePath();

  let withBase = pathname;
  if (base && pathname !== base && !pathname.startsWith(`${base}/`)) {
    withBase = `${base}${pathname}`;
  }

  if (base && !withBase.endsWith("/")) {
    withBase = `${withBase}/`;
  }

  return `${withBase}${query}`;
}

/** 站内带 basePath 的地址，以及 Telegram 等站外地址，都走这里跳转。 */
export function redirectBrowser(url: string): void {
  window.location.assign(url);
}
