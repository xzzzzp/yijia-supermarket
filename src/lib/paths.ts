/** 应用 basePath，生产环境为 /yijia */
export function getBasePath(): string {
  return (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
}

/** Cookie 作用路径，子路径部署时必须与 basePath 一致 */
export function getCookiePath(): string {
  const base = getBasePath();
  return base || "/";
}
