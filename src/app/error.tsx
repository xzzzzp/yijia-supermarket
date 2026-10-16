"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-2xl font-semibold text-accent">页面暂时无法加载</h1>
      <p className="mt-3 text-sm text-muted">
        商品或订单数据没有读到。请稍后再试。如果这是后台页面，请确认 MySQL 已配置并且可以连接。
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white"
      >
        重试
      </button>
    </main>
  );
}
