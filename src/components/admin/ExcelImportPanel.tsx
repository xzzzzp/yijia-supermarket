"use client";

import { useState, useTransition } from "react";
import { importImagesByNameSpec, importProductsFromExcel } from "@/app/admin/actions";
import { PRODUCT_IMAGE_UPLOAD_HINT } from "@/lib/product-image-hint";
import type { BatchImportResult, ExcelImportRowResult } from "@/types/admin";
import { FilePicker } from "@/components/admin/FilePicker";

function downloadTemplate() {
  const csv =
    "\uFEFF名称,俄语名称,乌兹别克语名称,规格,俄语规格,乌兹别克语规格,单价,分类,库存\n" +
    "可乐,Кола,Kola,330ml,330 мл,330 ml,8000,饮料,10\n" +
    "雪碧,,,500ml,,,7000,饮料,\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "商品导入模板.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function messageClass(tone: "info" | "error") {
  return tone === "error"
    ? "mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
    : "mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800";
}

export function ExcelImportPanel() {
  const [excelMessage, setExcelMessage] = useState("");
  const [excelTone, setExcelTone] = useState<"info" | "error">("info");
  const [excelRows, setExcelRows] = useState<ExcelImportRowResult[]>([]);
  const [imageMessage, setImageMessage] = useState("");
  const [imageTone, setImageTone] = useState<"info" | "error">("info");
  const [imageResults, setImageResults] = useState<BatchImportResult[]>([]);
  const [excelPending, startExcel] = useTransition();
  const [imagePending, startImages] = useTransition();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <h2 className="text-lg font-bold text-slate-900">Excel 新建或更新商品</h2>
        <p className="mt-2 text-sm leading-6 break-words text-slate-600">
          必填列：名称、规格、单价。可选列：俄语名称、乌兹别克语名称、俄语规格、乌兹别克语规格、分类、库存。
          只放中文名称和规格的旧表仍然可以导入；外语列空着或整列没有时，更新不会改掉已有译文，新建则留空。
          名称和规格都相同则更新单价（以及填写了的分类、库存、译文），否则新建。
          失败的行会列在下面，不会把整批悄悄丢掉。库存没有数量字段：大于 0 或「有货」为有货，0 或「缺货」为缺货，空着则新建时默认有货、更新时不改。
          新建必须能对应到已启用的分类（中文名或 slug）。
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className="mt-3 text-sm font-semibold text-red-700 hover:underline"
        >
          下载 CSV 模板
        </button>
        <form
          className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const file = data.get("file");
            if (!(file instanceof File) || file.size === 0) {
              setExcelTone("error");
              setExcelMessage("请选择 Excel 或 CSV 文件");
              setExcelRows([]);
              return;
            }
            startExcel(async () => {
              try {
                const result = await importProductsFromExcel(data);
                setExcelTone(result.ok ? "info" : "error");
                setExcelMessage(result.message ?? (result.ok ? "导入完成" : "导入失败"));
                setExcelRows(result.rows ?? []);
              } catch {
                setExcelTone("error");
                setExcelMessage("导入失败。请确认文件是 xlsx 或 csv，且没有损坏。");
                setExcelRows([]);
              }
            });
          }}
        >
          <FilePicker
            name="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          />
          <button
            type="submit"
            disabled={excelPending}
            className="min-h-11 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 md:min-h-0 md:w-auto"
          >
            {excelPending ? "导入中…" : "导入商品"}
          </button>
        </form>
        {excelMessage && <p className={messageClass(excelTone)}>{excelMessage}</p>}
        {excelRows.length > 0 && <ExcelRows rows={excelRows} />}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6">
        <h2 className="text-lg font-bold text-slate-900">按名称+规格设置主图</h2>
        <p className="mt-2 text-sm leading-6 break-words text-slate-600">
          文件名去掉扩展名后，等于商品名称和规格直接拼在一起，就设为该商品主图。例如名称「可乐」、规格「330ml」对应
          <span className="font-mono"> 可乐330ml.jpg</span>
          。空格会忽略。一次选多张时按文件名排序后依次设置；同一商品被多张图命中时，排序后的最后一张成为主图。
          对不上的图片只出现在列表里，不会导致整批失败，也不会写入磁盘。
        </p>
        <form
          className="mt-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const files = data.getAll("files").filter((file) => file instanceof File);
            if (!files.length) {
              setImageTone("error");
              setImageMessage("请选择至少一张图片");
              setImageResults([]);
              return;
            }
            startImages(async () => {
              try {
                const result = await importImagesByNameSpec(data);
                setImageTone(result.ok ? "info" : "error");
                setImageMessage(result.message ?? (result.ok ? "导入完成" : "导入失败"));
                setImageResults(result.results ?? []);
              } catch {
                setImageTone("error");
                setImageMessage("导入主图失败。请确认图片格式后重试。");
                setImageResults([]);
              }
            });
          }}
        >
          <FilePicker name="files" accept="image/*" multiple />
          <button
            type="submit"
            disabled={imagePending}
            className="min-h-11 w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 md:min-h-0 md:w-auto"
          >
            {imagePending ? "匹配中…" : "导入主图"}
          </button>
          <p className="basis-full text-xs text-slate-500">{PRODUCT_IMAGE_UPLOAD_HINT}</p>
        </form>
        {imageMessage && <p className={messageClass(imageTone)}>{imageMessage}</p>}
        {imageResults.length > 0 && <ImageRows results={imageResults} />}
      </section>
    </div>
  );
}

function excelStatusLabel(status: ExcelImportRowResult["status"]): string {
  if (status === "created") return "新建";
  if (status === "updated") return "更新";
  return "失败";
}

function ExcelRows({ rows }: { rows: ExcelImportRowResult[] }) {
  return (
    <>
    <div className="mt-4 space-y-3 md:hidden">
      {rows.map((row) => (
        <article
          key={`${row.rowNumber}-${row.name}-${row.spec}`}
          className="rounded-xl border border-slate-100 bg-slate-50 p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">第 {row.rowNumber} 行</p>
            <p className={`text-sm font-semibold ${row.status === "failed" ? "text-red-700" : "text-slate-800"}`}>
              {excelStatusLabel(row.status)}
            </p>
          </div>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div>
              <dt className="text-slate-500">名称</dt>
              <dd className="mt-0.5 leading-6 break-words text-slate-900">{row.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">规格</dt>
              <dd className="mt-0.5 leading-6 break-words text-slate-900">{row.spec || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">说明</dt>
              <dd className={`mt-0.5 leading-6 break-words ${row.status === "failed" ? "text-red-700" : "text-slate-600"}`}>
                {row.message}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
    <div className="mt-4 hidden overflow-x-auto md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 text-slate-500">
          <tr>
            <th className="px-2 py-2 font-semibold">行</th>
            <th className="px-2 py-2 font-semibold">名称</th>
            <th className="px-2 py-2 font-semibold">规格</th>
            <th className="px-2 py-2 font-semibold">结果</th>
            <th className="px-2 py-2 font-semibold">说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.rowNumber}-${row.name}-${row.spec}`} className="border-b border-slate-50 last:border-b-0">
              <td className="px-2 py-2">{row.rowNumber}</td>
              <td className="px-2 py-2">{row.name || "—"}</td>
              <td className="px-2 py-2">{row.spec || "—"}</td>
              <td className="px-2 py-2 font-semibold">{excelStatusLabel(row.status)}</td>
              <td className={`px-2 py-2 ${row.status === "failed" ? "text-red-700" : "text-slate-600"}`}>
                {row.message}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

function imageStatusLabel(status: BatchImportResult["status"]): string {
  if (status === "matched") return "已绑定";
  if (status === "unmatched") return "未匹配";
  return "失败";
}

function ImageRows({ results }: { results: BatchImportResult[] }) {
  return (
    <>
    <div className="mt-4 space-y-3 md:hidden">
      {results.map((result, index) => (
        <article key={`${result.filename}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
          <p className="font-mono text-xs leading-5 break-all text-slate-800">{result.filename}</p>
          <p className={`mt-2 text-sm font-semibold ${result.status === "matched" ? "text-slate-800" : "text-red-700"}`}>
            {imageStatusLabel(result.status)}
          </p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div>
              <dt className="text-slate-500">商品</dt>
              <dd className="mt-0.5 leading-6 break-words text-slate-900">{result.productName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">说明</dt>
              <dd className={`mt-0.5 leading-6 break-words ${result.status === "matched" ? "text-slate-600" : "text-red-700"}`}>
                {result.message ?? result.imageUrl ?? "—"}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
    <div className="mt-4 hidden overflow-x-auto md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 text-slate-500">
          <tr>
            <th className="px-2 py-2 font-semibold">文件名</th>
            <th className="px-2 py-2 font-semibold">结果</th>
            <th className="px-2 py-2 font-semibold">商品</th>
            <th className="px-2 py-2 font-semibold">说明</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={`${result.filename}-${index}`} className="border-b border-slate-50 last:border-b-0">
              <td className="px-2 py-2 font-mono text-xs">{result.filename}</td>
              <td className="px-2 py-2 font-semibold">{imageStatusLabel(result.status)}</td>
              <td className="px-2 py-2">{result.productName ?? "—"}</td>
              <td className={`px-2 py-2 ${result.status === "matched" ? "text-slate-600" : "text-red-700"}`}>
                {result.message ?? result.imageUrl ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
