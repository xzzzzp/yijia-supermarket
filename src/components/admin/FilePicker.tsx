"use client";

import { useRef, useState } from "react";
import { stableUploadFiles } from "@/lib/upload-files";

function assignFiles(input: HTMLInputElement, files: File[]) {
  try {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
  } catch {
    // 浏览器不允许改写已选文件时，仍提交原列表。服务端会再按文件名排序。
  }
}

export function FilePicker({
  name,
  accept,
  multiple = false,
}: {
  name: string;
  accept: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center md:gap-3">
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          const input = event.currentTarget;
          const sorted = stableUploadFiles(Array.from(input.files ?? []));
          assignFiles(input, sorted);
          setNames(sorted.map((file) => file.name));
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-red-300 hover:bg-red-50 md:min-h-0 md:w-auto"
      >
        选择文件
      </button>
      <p className="w-full min-w-0 text-sm text-slate-600 max-md:break-words md:w-auto md:break-all">
        {names.length === 0 ? "未选择文件" : names.join("、")}
      </p>
    </div>
  );
}
