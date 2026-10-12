import { ImageBatchImport } from "@/components/admin/ImageBatchImport";

export default function ImportPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">批量导入图片</h1>
      <ImageBatchImport />
    </>
  );
}
