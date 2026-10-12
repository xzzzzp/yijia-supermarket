"use client";



import { useSearchParams } from "next/navigation";

import Link from "next/link";

import { useState } from "react";

import { useStoreSettings } from "@/providers/StoreSettingsProvider";



export default function OrderSuccessContent() {

  const searchParams = useSearchParams();

  const settings = useStoreSettings();

  const channel = searchParams.get("channel");

  const orderText = searchParams.get("text")

    ? decodeURIComponent(searchParams.get("text")!)

    : "";

  const [copied, setCopied] = useState(false);

  const isWechat = channel === "wechat";



  const handleCopy = async () => {

    if (orderText) {

      await navigator.clipboard.writeText(orderText);

      setCopied(true);

    }

  };



  return (

    <main className="flex min-h-screen items-center justify-center bg-surface px-5">

      <div className="w-full max-w-lg rounded-2xl border border-surface-2 bg-white p-8 text-center">

        <p className="text-4xl">✅</p>

        <h1 className="font-display mt-4 text-2xl font-semibold text-accent">订单已生成</h1>



        {isWechat ? (

          <>

            <p className="mt-3 text-sm text-muted">

              请复制下方订单内容，打开微信发送给{" "}

              <strong className="text-ink">{settings.wechat}</strong>

            </p>

            {orderText && (

              <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-surface p-4 text-left text-xs leading-5 text-ink">

                {orderText}

              </pre>

            )}

            <button

              type="button"

              onClick={handleCopy}

              className="mt-4 w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"

            >

              {copied ? "已复制 ✓" : "复制订单内容"}

            </button>

          </>

        ) : (

          <p className="mt-3 text-sm text-muted">订单已通过 Telegram 发送</p>

        )}



        <Link

          href="/"

          className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"

        >

          返回首页

        </Link>

      </div>

    </main>

  );

}

