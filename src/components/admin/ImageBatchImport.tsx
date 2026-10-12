"use client";

import { useRef, useState, useTransition } from "react";
import { CATEGORIES } from "@/types/product";
import { batchImportImages } from "@/app/admin/actions";
import type { BatchImportResult } from "@/types/admin";

export function ImageBatchImport() {
  const [category, setCategory] = useState("drinks");
  const [autoMatch, setAutoMatch] = useState(true);
  const [results, setResults] = useState<BatchImportResult[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const processFiles = (files: FileList | File[]) => {
    const formData = new FormData();
    formData.append("category", category);
    if (autoMatch) formData.append("autoMatch", "on");
    Array.from(files).forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await batchImportImages(formData);
      setMessage(result.message ?? "");
      if (result.results) setResults(result.results);
    });
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">批量导入商品图片</h2>
        <p className="mt-2 text-sm text-slate-600">
          支持拖拽或选择多张图片。开启「自动匹配」后，会按文件名匹配商品的 image 路径或
          source_key 并自动更新图片。
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="import-category" className="block text-sm font-medium text-slate-700">
              上传分类目录
            </label>
            <select
              id="import-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nameZh} ({c.slug})
                </option>
              ))}
              <option value="misc">其他 (misc)</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={autoMatch}
              onChange={(e) => setAutoMatch(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-red-600"
            />
            自动匹配已有商品并更新图片
          </label>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-4 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition ${
            dragOver
              ? "border-red-400 bg-red-50"
              : "border-slate-200 bg-slate-50 hover:border-red-200"
          }`}
          onClick={() => fileRef.current?.click()}
        >
          <p className="text-3xl">📁</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            拖拽图片到此处，或点击选择文件
          </p>
          <p className="mt-1 text-xs text-slate-500">支持 PNG、JPG、WEBP，可多选</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) processFiles(e.target.files);
            }}
          />
        </div>

        {pending && (
          <p className="mt-4 text-sm text-slate-600">正在上传并匹配，请稍候…</p>
        )}
        {message && (
          <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {message}
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">文件名</th>
                <th className="px-4 py-3 font-semibold">状态</th>
                <th className="px-4 py-3 font-semibold">匹配商品</th>
                <th className="px-4 py-3 font-semibold">说明</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.filename} className="border-b border-slate-50 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-xs">{r.filename}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">{r.productName ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.message ?? r.imageUrl ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">匹配规则说明</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-800">
          <li>文件名（不含扩展名）与商品 image 路径末尾一致</li>
          <li>或文件名出现在商品的 source_key 中</li>
          <li>例：图片 kangshifu-braised-cup.png 可匹配 source_key 含 kangshifu-braised-cup 的商品</li>
        </ul>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: BatchImportResult["status"] }) {
  const styles = {
    matched: "bg-emerald-50 text-emerald-700",
    unmatched: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
  };
  const labels = {
    matched: "成功",
    unmatched: "未匹配",
    error: "失败",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
