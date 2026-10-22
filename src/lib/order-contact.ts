export function validateCustomerContact(input: {
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  note?: string | null;
}): string | null {
  const name = input.customerName?.trim() ?? "";
  const phone = input.customerPhone?.trim() ?? "";
  const address = input.customerAddress?.trim() ?? "";
  const note = input.note?.trim() ?? "";

  if (!name) return "请填写姓名";
  if (!phone) return "请填写电话";
  if (!address) return "请填写配送地址";
  if (name.length > 255) return "姓名过长";
  if (phone.length > 64) return "电话过长";
  if (address.length > 4000) return "地址过长";
  if (note.length > 4000) return "备注过长";
  return null;
}
