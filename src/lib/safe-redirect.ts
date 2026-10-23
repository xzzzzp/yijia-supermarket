function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function isUnsafePath(value: string): boolean {
  return (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\") ||
    value.includes("\\") ||
    value.includes("://") ||
    hasControlChar(value)
  );
}

/**
 * 只接受站内相对路径（以单个 / 开头）。
 * 拒绝绝对 URL、协议相对 URL，以及解码后会变成它们的写法。
 */
export function sameOriginRelativePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const target = value.trim();
  if (!target || isUnsafePath(target)) return null;

  let decoded = target;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    return null;
  }
  if (isUnsafePath(decoded)) return null;

  try {
    const twice = decodeURIComponent(decoded);
    if (twice !== decoded && isUnsafePath(twice.startsWith("/") ? twice : `/${twice}`)) {
      return null;
    }
    if (twice.startsWith("//") || twice.includes("\\") || twice.includes("://")) return null;
  } catch {
    return null;
  }

  return target;
}
