import { clearAdminSession } from "@/lib/dev-auth";
import { getBasePath } from "@/lib/paths";

export async function POST() {
  await clearAdminSession();
  // Route Handler 里的 redirect() 不会带上 basePath，Location 会变成 /admin/login，
  // 生产上这个路径不在 /yijia 反代后面。用相对 Location，浏览器按当前站点解析。
  const base = getBasePath();
  const path = base ? `${base}/admin/login/` : "/admin/login";
  return new Response(null, {
    status: 303,
    headers: { Location: path },
  });
}
