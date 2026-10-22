/** 应用 basePath，生产环境为 /yijia */
export function getBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
}

/** Cookie 作用路径，子路径部署时必须与 basePath 一致 */
export function getCookiePath(): string {
  const base = getBasePath();
  return base || "/";
}

/**
 * 带 basePath 的接口地址。生产开启 trailingSlash 时补上末尾斜杠，
 * 否则 POST /api/orders 会被重定向，浏览器把请求体丢掉。
 */
export function apiPath(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = base && !normalized.endsWith("/") ? `${normalized}/` : normalized;
  return `${base}${withSlash}`;
}
