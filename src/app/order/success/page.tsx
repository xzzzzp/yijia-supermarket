import { Suspense } from "react";
import OrderSuccessContent from "./OrderSuccessContent";

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">加载中…</p>
        </main>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
