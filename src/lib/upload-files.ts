export interface NamedUpload {
  name: string;
  size: number;
  lastModified?: number;
}

/** 多选文件按文件名、大小、修改时间排序，避免浏览器选择顺序导致主图结果飘。 */
export function stableUploadFiles<T extends NamedUpload>(files: T[]): T[] {
  return [...files].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "zh");
    if (byName !== 0) return byName;
    if (a.size !== b.size) return a.size - b.size;
    return (a.lastModified ?? 0) - (b.lastModified ?? 0);
  });
}
