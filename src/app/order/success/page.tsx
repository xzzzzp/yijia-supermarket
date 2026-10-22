import { Suspense } from "react";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import OrderSuccessContent from "./OrderSuccessContent";

export default function OrderSuccessPage() {
  return (
    <LanguageProvider>
      <StorefrontShell>
        <Suspense
          fallback={
            <main className="flex min-h-[50vh] items-center justify-center">
              <p className="text-gray-500">加载中…</p>
            </main>
          }
        >
          <OrderSuccessContent />
        </Suspense>
      </StorefrontShell>
    </LanguageProvider>
  );
}
