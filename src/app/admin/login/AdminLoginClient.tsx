"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { adminLogin } from "@/app/admin/actions";

type AuthMode = "mysql" | "dev" | "none";

function LoginForm() {
  return (
    <form action={adminLogin} className="mt-8 space-y-4">
      <EmailPasswordFields placeholder="name@example.com" />
      <SubmitButton />
      <p className="text-xs text-slate-500">
        使用服务端表单提交，即使 JS 未加载也可登录。
      </p>
    </form>
  );
}

function EmailPasswordFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  placeholder,
}: {
  email?: string;
  password?: string;
  onEmailChange?: (v: string) => void;
  onPasswordChange?: (v: string) => void;
  placeholder?: string;
}) {
  const controlled = onEmailChange !== undefined;

  return (
    <>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          邮箱
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={controlled ? email : undefined}
          defaultValue={controlled ? undefined : ""}
          onChange={controlled ? (e) => onEmailChange!(e.target.value) : undefined}
          placeholder={placeholder}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={controlled ? password : undefined}
          defaultValue={controlled ? undefined : ""}
          onChange={controlled ? (e) => onPasswordChange!(e.target.value) : undefined}
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-500"
        />
      </div>
    </>
  );
}

function SubmitButton({ loading }: { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {loading ? "登录中…" : "登录后台"}
    </button>
  );
}

function LoginContent({
  authMode,
  showDevHint,
}: {
  authMode: AuthMode;
  showDevHint?: boolean;
}) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const setupHint =
    urlError === "auth"
      ? "请先登录后再访问后台。"
      : urlError === "invalid"
        ? "邮箱或密码错误，请重试。"
        : urlError === "db"
          ? "店员数据没有读成或没有写成，登录已拒绝。请检查 MySQL 连接，并确认已执行 mysql/schema.sql。"
          : urlError === "session"
            ? "无法签发登录会话。请配置 ADMIN_SESSION_SECRET，或在开发环境保留 ADMIN_DEV_PASSWORD。"
            : urlError === "rate"
              ? "尝试过于频繁，请稍后再试。"
              : "";

  if (authMode === "none") {
    return (
      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">尚未配置登录方式</p>
        <p className="mt-2">
          请复制 <code className="rounded bg-amber-100 px-1">.env.example</code> 为{" "}
          <code className="rounded bg-amber-100 px-1">.env.local</code> 并重启 dev 服务器。
        </p>
      </div>
    );
  }

  return (
    <>
      {setupHint && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 break-words text-amber-800">
          {setupHint}
        </p>
      )}

      {showDevHint && authMode === "dev" && (
        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          未配置 MySQL。请使用 .env.local 里的管理员邮箱和密码，此页不会显示密码。
        </p>
      )}
      {authMode === "mysql" && (
        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          使用店员邮箱和密码。店员表为空时，用 ADMIN_DEV_EMAIL / ADMIN_DEV_PASSWORD 登录，写入成功后才会成为店主。
        </p>
      )}
      <LoginForm />
    </>
  );
}

export function AdminLoginClient({
  authMode,
  showDevHint,
}: {
  authMode: AuthMode;
  showDevHint?: boolean;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          亿佳超市后台
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-950 md:text-3xl">管理员登录</h1>
        <p className="mt-2 text-sm text-slate-600">
          {authMode === "mysql"
            ? "使用店员账号登录"
            : authMode === "dev"
              ? "使用管理员账号登录"
              : "请先配置环境变量"}
        </p>

        <Suspense fallback={<p className="mt-8 text-sm text-slate-500">加载中…</p>}>
          <LoginContent authMode={authMode} showDevHint={showDevHint} />
        </Suspense>
      </div>
    </main>
  );
}
