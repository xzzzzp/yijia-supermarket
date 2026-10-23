import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import {
  fileImageKey,
  nameSpecImageKey,
  parsePriceCell,
  parseProductSheet,
  parseStockCell,
  planProductImport,
  type ImportCatalogCategory,
  type ImportCatalogProduct,
} from "../src/lib/excel-products.ts";
import { stableUploadFiles } from "../src/lib/upload-files.ts";
import { readSpreadsheet } from "../src/lib/excel-workbook.ts";

const categories: ImportCatalogCategory[] = [
  { slug: "drinks", nameZh: "饮料", nameRu: "Напитки", nameUz: "Ichimliklar", enabled: true },
  { slug: "snacks", nameZh: "零食", nameRu: "Снеки", nameUz: "Gazaklar", enabled: false },
];

function sheet(rows: string[][]): string[][] {
  return rows;
}

test("price and stock cells", () => {
  assert.deepEqual(parsePriceCell("12,000"), { price: 12000 });
  assert.deepEqual(parsePriceCell("12.000"), { price: 12000 });
  assert.equal("error" in parsePriceCell("12.5"), true);
  assert.deepEqual(parseStockCell(""), { inStock: null });
  assert.deepEqual(parseStockCell("0"), { inStock: false });
  assert.deepEqual(parseStockCell("缺货"), { inStock: false });
  assert.deepEqual(parseStockCell("3"), { inStock: true });
  assert.equal("error" in parseStockCell("也许"), true);
});

test("missing required columns fail the file", () => {
  const parsed = parseProductSheet([
    ["名称", "规格"],
    ["可乐", "330ml"],
  ]);
  assert.equal(parsed.error, "缺少必填列：单价");
  assert.deepEqual(parsed.rows, []);
});

test("same name and spec updates, otherwise creates, and bad rows stay in the summary", () => {
  const products: ImportCatalogProduct[] = [
    {
      id: "old",
      name: "可乐",
      spec: "330ml",
      category: "drinks",
      inStock: true,
      createdAt: "2020-01-01T00:00:00.000Z",
    },
  ];
  const parsed = parseProductSheet(
    sheet([
      ["名称", "规格", "单价", "分类", "库存"],
      ["可乐", "330ml", "9000", "", "0"],
      ["雪碧", "500ml", "7000", "饮料", ""],
      ["雪碧", "500ml", "7500", "", ""],
      ["果汁", "1L", "1", "没有这种分类", ""],
      ["", "1L", "1", "饮料", ""],
      ["薯片", "大包", "1", "零食", ""],
    ]),
  );
  assert.equal(parsed.error, null);
  const plans = planProductImport(parsed.rows, products, categories);
  assert.equal(plans[0]?.kind, "update");
  if (plans[0]?.kind === "update") {
    assert.equal(plans[0].productId, "old");
    assert.equal(plans[0].price, 9000);
    assert.equal(plans[0].inStock, false);
    assert.equal(plans[0].category, null);
  }
  assert.equal(plans[1]?.kind, "create");
  assert.equal(plans[2]?.kind, "update");
  if (plans[2]?.kind === "update") assert.equal(plans[2].productId, "pending:3");
  assert.deepEqual(
    plans.slice(3).map((item) => (item.kind === "fail" ? item.message : item.kind)),
    ["分类「没有这种分类」不存在", "名称为空", "分类「零食」已停用"],
  );
});

test("duplicate name and spec updates only the earliest product", () => {
  const plans = planProductImport(
    [
      {
        ok: true,
        rowNumber: 2,
        name: "可乐",
        spec: "330ml",
        price: 1,
        category: null,
        inStock: null,
      },
    ],
    [
      { id: "b", name: "可乐", spec: "330ml", category: "drinks", inStock: true, createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "a", name: " 可乐 ", spec: "330ml", category: "drinks", inStock: true, createdAt: "2021-01-01T00:00:00.000Z" },
    ],
    categories,
  );
  assert.equal(plans[0]?.kind, "update");
  if (plans[0]?.kind === "update") {
    assert.equal(plans[0].productId, "a");
    assert.match(plans[0].warning ?? "", /2 条/);
  }
});

test("chinese-only sheets still import, and ru/uz columns are optional", () => {
  const chinese = parseProductSheet([
    ["名称", "规格", "单价"],
    ["可乐", "330ml", "8000"],
  ]);
  assert.equal(chinese.error, null);
  assert.equal(chinese.rows[0]?.ok, true);
  if (chinese.rows[0]?.ok) {
    assert.equal(chinese.rows[0].name, "可乐");
    assert.equal(chinese.rows[0].nameRu, null);
    assert.equal(chinese.rows[0].nameUz, null);
    assert.equal(chinese.rows[0].specRu, null);
    assert.equal(chinese.rows[0].specUz, null);
  }

  const translated = parseProductSheet([
    ["nameZh", "nameRu", "nameUz", "spec", "specRu", "specUz", "价格", "分类"],
    ["可乐", "Кола", "Kola", "330ml", "330 мл", "330 ml", "9000", "饮料"],
    ["雪碧", "", "", "500ml", "", "", "7000", "饮料"],
  ]);
  assert.equal(translated.error, null);
  assert.equal(translated.rows[0]?.ok, true);
  if (translated.rows[0]?.ok) {
    assert.equal(translated.rows[0].nameRu, "Кола");
    assert.equal(translated.rows[0].nameUz, "Kola");
    assert.equal(translated.rows[0].specRu, "330 мл");
    assert.equal(translated.rows[0].specUz, "330 ml");
  }
  assert.equal(translated.rows[1]?.ok, true);
  if (translated.rows[1]?.ok) {
    assert.equal(translated.rows[1].name, "雪碧");
    assert.equal(translated.rows[1].nameRu, null);
    assert.equal(translated.rows[1].specUz, null);
  }

  const plans = planProductImport(translated.rows, [], categories);
  assert.equal(plans[0]?.kind, "create");
  if (plans[0]?.kind === "create") {
    assert.equal(plans[0].nameRu, "Кола");
    assert.equal(plans[0].specUz, "330 ml");
  }
  if (plans[1]?.kind === "create") assert.equal(plans[1].nameUz, null);
});

test("multi-select uploads keep a stable filename order", () => {
  const sorted = stableUploadFiles([
    { name: "b.jpg", size: 2, lastModified: 1 },
    { name: "a.jpg", size: 9, lastModified: 3 },
    { name: "b.jpg", size: 1, lastModified: 8 },
  ]);
  assert.deepEqual(
    sorted.map((file) => `${file.name}:${file.size}`),
    ["a.jpg:9", "b.jpg:1", "b.jpg:2"],
  );
});

test("image filename matches name plus spec with whitespace ignored", () => {
  assert.equal(fileImageKey("可乐330ml.jpg"), nameSpecImageKey("可乐", "330ml"));
  assert.equal(fileImageKey("可乐 330 ml.PNG"), nameSpecImageKey("可乐", "330 ml"));
  assert.notEqual(fileImageKey("可乐.jpg"), nameSpecImageKey("可乐", "330ml"));
});

test("xlsx and csv round-trip into sheet rows", () => {
  const shared = `<?xml version="1.0" encoding="UTF-8"?>
    <sst><si><t>名称</t></si><si><t>规格</t></si><si><t>单价</t></si></sst>`;
  const worksheet = `<?xml version="1.0" encoding="UTF-8"?>
    <worksheet><sheetData>
      <row r="1">
        <c r="A1" t="s"><v>0</v></c>
        <c r="B1" t="s"><v>1</v></c>
        <c r="C1" t="s"><v>2</v></c>
      </row>
      <row r="2">
        <c r="A2" t="inlineStr"><is><t>可乐</t></is></c>
        <c r="B2" t="inlineStr"><is><t>330ml</t></is></c>
        <c r="C2"><v>8000</v></c>
      </row>
    </sheetData></worksheet>`;
  const bytes = zipSync({
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="商品" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0"?><Relationships><Relationship Id="rId1" Type="worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    ),
    "xl/sharedStrings.xml": strToU8(shared),
    "xl/worksheets/sheet1.xml": strToU8(worksheet),
  });

  const xlsx = readSpreadsheet(bytes, "商品.xlsx");
  assert.equal("rows" in xlsx, true);
  if ("rows" in xlsx) {
    const parsed = parseProductSheet(xlsx.rows);
    assert.equal(parsed.error, null);
    assert.equal(parsed.rows[0]?.ok, true);
    if (parsed.rows[0]?.ok) {
      assert.equal(parsed.rows[0].name, "可乐");
      assert.equal(parsed.rows[0].price, 8000);
    }
  }

  const csv = readSpreadsheet(strToU8("名称,规格,单价\n\"可乐,冰\",330ml,8000\n"), "商品.csv");
  assert.equal("rows" in csv, true);
  if ("rows" in csv) {
    assert.equal(csv.rows[1]?.[0], "可乐,冰");
  }
});
