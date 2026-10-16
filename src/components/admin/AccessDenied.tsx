export function AccessDenied({
  title = "无权访问",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-950 shadow-sm">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </div>
  );
}
