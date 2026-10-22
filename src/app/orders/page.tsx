import { LanguageProvider } from "@/providers/LanguageProvider";
import { OrderLookup } from "@/components/OrderLookup";
import { StorefrontShell } from "@/components/StorefrontShell";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; id?: string }>;
}) {
  const { phone = "", id = "" } = await searchParams;

  return (
    <LanguageProvider>
      <StorefrontShell>
        <OrderLookup initialPhone={phone} initialOrderId={id} />
      </StorefrontShell>
    </LanguageProvider>
  );
}
