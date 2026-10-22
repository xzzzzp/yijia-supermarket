import assert from "node:assert/strict";
import test from "node:test";
import { displayOrDash, formatDeliveryBlock } from "../src/lib/delivery-block.ts";

test("missing delivery fields render as a dash", () => {
  assert.equal(displayOrDash("  "), "—");
  assert.equal(displayOrDash(null), "—");
  assert.equal(displayOrDash("塔什干"), "塔什干");
});

test("delivery block copies name, phone, and address together", () => {
  assert.equal(
    formatDeliveryBlock({
      customerName: "阿强",
      customerPhone: "",
      customerAddress: "  ",
    }),
    "姓名：阿强\n电话：—\n地址：—",
  );
});
