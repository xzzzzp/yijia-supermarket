import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { fetchStoreSettings } from "@/lib/settings.server";
import { StoreSettingsProvider } from "@/providers/StoreSettingsProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yijia Chinese Supermarket",
  description: "塔什干中国商品超市，支持微信/Telegram 下单",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const settings = await fetchStoreSettings();

  return (
    <html lang="ru" className={`h-full antialiased ${outfit.variable} ${sourceSans.variable}`}>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <StoreSettingsProvider settings={settings}>{children}</StoreSettingsProvider>
      </body>
    </html>
  );
}
