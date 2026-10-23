import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { formatTashkentDate, tashkentHour } from "../src/lib/tashkent-time.ts";

const require = createRequire(import.meta.url);
const sqlEscaper = require("sql-escaper") as {
  format: (sql: string, values: unknown[], stringifyObjects: boolean, timezone: string) => string;
};

test("mysql timezone Z stores the UTC wall clock", () => {
  const sql = sqlEscaper.format("?", [new Date("2026-10-23T12:14:05.678Z")], false, "Z");
  assert.equal(sql, "'2026-10-23 12:14:05.678'");
});

test("formatTashkentDate shows Tashkent time for a UTC instant", () => {
  // 塔什干 17:14 = UTC 12:14。上海手机若按本地时区会显示 20:14。
  assert.equal(formatTashkentDate("2026-10-23T12:14:00.000Z"), "2026/10/23 17:14");
  assert.equal(formatTashkentDate("2026-10-23T12:14:05.000Z", { withSeconds: true }), "2026/10/23 17:14:05");

  // 上海 22:14 = UTC 14:14 = 塔什干 19:14。
  assert.equal(formatTashkentDate("2026-10-23T14:14:00.000Z"), "2026/10/23 19:14");

  // 跨日：UTC 20:14 = 塔什干次日 01:14。
  assert.equal(formatTashkentDate("2026-10-23T20:14:00.000Z"), "2026/10/24 01:14");
});

test("formatTashkentDate does not follow the process timezone", () => {
  const iso = "2026-10-23T12:14:00.000Z";
  const tashkent = formatTashkentDate(iso);
  const local = new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  assert.equal(tashkent, "2026/10/23 17:14");
  if (local !== "2026/10/23 17:14") {
    assert.notEqual(tashkent, local);
  }
});

test("formatTashkentDate keeps the storefront locale", () => {
  assert.equal(formatTashkentDate("2026-10-23T12:14:00.000Z", { locale: "ru-RU" }), "23.10.2026, 17:14");
  assert.equal(formatTashkentDate("2026-10-23T12:14:00.000Z", { locale: "uz-UZ" }), "23/10/2026, 17:14");
  assert.equal(formatTashkentDate(null), "—");
  assert.equal(formatTashkentDate(""), "—");
  assert.equal(formatTashkentDate("not-a-date"), "not-a-date");
});

test("tashkentHour stays on the store clock when Shanghai is a different hour", () => {
  // UTC 01:14 = 塔什干 06:14 = 上海 09:14。营业时间 09:00 时，上海手机会误判为已开门。
  assert.equal(tashkentHour(new Date("2026-10-23T01:14:00.000Z")), 6);
  assert.equal(tashkentHour(new Date("2026-10-23T12:14:00.000Z")), 17);
  assert.equal(tashkentHour(new Date("2026-10-23T19:00:00.000Z")), 0);
});
