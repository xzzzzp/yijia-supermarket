"use client";

import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col pb-16 md:pb-0">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
      <BottomNav />
    </div>
  );
}
