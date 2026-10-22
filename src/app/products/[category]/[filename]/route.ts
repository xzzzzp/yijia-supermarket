import { readFile } from "fs/promises";
import { productImageContentType, resolveStoredProductImage } from "@/lib/product-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 商品图不走 public/ 静态目录。
 * next start 只登记进程启动时已经存在的 public 文件，后台稍后上传的图片会被记成预渲染 404。
 * 分类列表和首页新品都请求 /products/<分类>/<文件名>，由这里按磁盘现读。
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string; filename: string }> },
) {
  const { category, filename } = await params;
  const filePath = await resolveStoredProductImage(category, filename);
  if (!filePath) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const body = await readFile(filePath);
    const type = productImageContentType(filename) ?? "application/octet-stream";
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=0, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
