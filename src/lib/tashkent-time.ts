/** 门店在塔什干。库里的时间是 UTC，界面一律换算到这时区，不跟浏览器本地时区。 */
export const TASHKENT_TIME_ZONE = "Asia/Tashkent";

interface FormatTashkentDateOptions {
  locale?: string;
  withSeconds?: boolean;
}

export function formatTashkentDate(
  iso: string | null | undefined,
  options?: FormatTashkentDateOptions,
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const format: Intl.DateTimeFormatOptions = {
    timeZone: TASHKENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  if (options?.withSeconds) format.second = "2-digit";

  try {
    return new Intl.DateTimeFormat(options?.locale ?? "zh-CN", format).format(date);
  } catch {
    return iso;
  }
}

/** 塔什干当前小时（0–23）。乌兹别克斯坦无夏令时，固定 UTC+5。 */
export function tashkentHour(date: Date = new Date()): number {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: TASHKENT_TIME_ZONE,
    hour: "numeric",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;
  const hour = Number(value);
  if (!Number.isInteger(hour)) {
    return new Date(date.getTime() + 5 * 60 * 60 * 1000).getUTCHours();
  }
  return hour % 24;
}
