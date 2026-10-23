import { redirect } from "next/navigation";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { StorefrontShell } from "@/components/StorefrontShell";
import { fetchOrderById } from "@/lib/orders.server";
import OrderSuccessContent from "./OrderSuccessContent";

function firstParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawOrderId = firstParam(params.orderId);
  const hasExtraQuery = Object.keys(params).some((key) => key !== "orderId");
  if (hasExtraQuery) {
    const clean = rawOrderId
      ? `/order/success?${new URLSearchParams({ orderId: rawOrderId }).toString()}`
      : "/order/success";
    redirect(clean);
  }

  const order = rawOrderId ? await fetchOrderById(rawOrderId) : null;

  return (
    <LanguageProvider>
      <StorefrontShell>
        <OrderSuccessContent
          orderId={order?.id ?? ""}
          channel={order?.channel ?? null}
          orderText={order?.orderText ?? ""}
        />
      </StorefrontShell>
    </LanguageProvider>
  );
}
