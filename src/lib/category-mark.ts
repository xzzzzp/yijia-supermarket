/** 有图标用图标，否则用名称首字母。空白图标视为没有图标。 */
export function categoryMark(
  name: string,
  icon: string | null | undefined,
): { kind: "icon"; src: string } | { kind: "letter"; letter: string } {
  const src = icon?.trim() ?? "";
  if (src) return { kind: "icon", src };
  return { kind: "letter", letter: name.trim().charAt(0).toUpperCase() };
}

export function categoryIconError(icon: string): string | null {
  if (!icon) return null;
  if (icon.length > 512) return "分类图标地址过长";
  if (!icon.startsWith("/products/") || icon.includes("..") || icon.includes("\\") || icon.includes("\0")) {
    return "分类图标地址无效";
  }
  return null;
}
