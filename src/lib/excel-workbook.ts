import { unzipSync } from "fflate";

function decodeXml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function stripNamespaces(xml: string): string {
  return xml.replace(/xmlns(:\w+)?="[^"]*"/g, "").replace(/<(\/?)[\w.-]+:/g, "<$1");
}

function readSharedStrings(xml: string): string[] {
  const items = stripNamespaces(xml).match(/<si\b[\s\S]*?<\/si>/g) ?? [];
  return items.map((item) => {
    const texts = [...item.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1] ?? ""));
    return texts.join("");
  });
}

function columnIndex(ref: string): number {
  const letters = ref.replace(/[0-9]/g, "").toUpperCase();
  let index = 0;
  for (const char of letters) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }
  return Math.max(0, index - 1);
}

function readSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  const source = stripNamespaces(xml);
  for (const rowXml of source.match(/<row\b[\s\S]*?<\/row>/g) ?? []) {
    const cells: string[] = [];
    for (const cellXml of rowXml.match(/<c\b[\s\S]*?<\/c>|<c\b[^>]*\/>/g) ?? []) {
      const ref = cellXml.match(/\br="([A-Z]+)\d+"/i)?.[1] ?? "";
      const index = ref ? columnIndex(ref) : cells.length;
      const type = cellXml.match(/\bt="([^"]+)"/)?.[1] ?? "";
      let value = "";
      if (type === "s") {
        const pointer = Number(cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
        value = shared[pointer] ?? "";
      } else if (type === "inlineStr") {
        value = [...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1] ?? "")).join("");
      } else {
        value = decodeXml(cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
      }
      cells[index] = value.trim();
    }
    rows.push(cells.map((cell) => cell ?? ""));
  }
  return rows;
}

function textOf(files: Record<string, Uint8Array>, path: string): string | null {
  const bytes = files[path];
  if (!bytes) return null;
  return new TextDecoder().decode(bytes);
}

function firstSheetPath(files: Record<string, Uint8Array>): string | null {
  const rels = textOf(files, "xl/_rels/workbook.xml.rels");
  const workbook = textOf(files, "xl/workbook.xml");
  if (rels && workbook) {
    const plainRels = stripNamespaces(rels);
    const plainBook = stripNamespaces(workbook);
    const firstSheetId = plainBook.match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1]
      ?? plainBook.match(/<sheet\b[^>]*\bid="([^"]+)"/)?.[1];
    if (firstSheetId) {
      const target = [...plainRels.matchAll(/<Relationship\b[^>]*>/g)]
        .map((match) => match[0])
        .find((tag) => tag.includes(`Id="${firstSheetId}"`))
        ?.match(/\bTarget="([^"]+)"/)?.[1];
      if (target) {
        const normalized = target.replace(/^\//, "");
        return normalized.startsWith("xl/") ? normalized : `xl/${normalized}`;
      }
    }
  }
  return Object.keys(files).find((path) => /^xl\/worksheets\/sheet\d+\.xml$/.test(path)) ?? null;
}

export function parseCsv(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}

export function readSpreadsheet(buffer: Uint8Array, filename: string): { rows: string[][] } | { error: string } {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    return { rows: parseCsv(new TextDecoder().decode(buffer)) };
  }
  if (!lower.endsWith(".xlsx")) {
    return { error: "请上传 .xlsx 或 .csv。旧版 .xls 请先在 Excel 里另存为 xlsx。" };
  }

  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(buffer);
  } catch {
    return { error: "无法读取这个 Excel 文件" };
  }

  const sheetPath = firstSheetPath(files);
  const sheetXml = sheetPath ? textOf(files, sheetPath) : null;
  if (!sheetXml) return { error: "文件里没有工作表" };

  const sharedXml = textOf(files, "xl/sharedStrings.xml");
  return { rows: readSheet(sheetXml, sharedXml ? readSharedStrings(sharedXml) : []) };
}
