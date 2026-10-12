"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { devLogin } from "@/app/admin/actions";

type AuthMode = "supabase" | "dev" | "none";

function SupabaseLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Supabase 连接失败，请检查 .env.local 中的 URL 和 ANON_KEY");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <EmailPasswordFields email={email} password={password} onEmailChange={setEmail} onPasswordChange={setPassword} placeholder="admin@example.com" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton loading={loading} />
    </form>
  );
}

function DevLoginForm() {
  return (
    <form action={devLogin} className="mt-8 space-y-4">
      <EmailPasswordFields placeholder="admin@local.dev" />
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
  devEmail,
  devPassword,
}: {
  authMode: AuthMode;
  devEmail?: string;
  devPassword?: string;
}) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const setupHint =
    urlError === "auth"
      ? "请先登录后再访问后台。"
      : urlError === "invalid"
        ? "邮箱或密码错误，请重试。"
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
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {setupHint}
        </p>
      )}

      {authMode === "dev" && devEmail && devPassword && (
        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
          管理员账号：<strong>{devEmail}</strong> / <strong>{devPassword}</strong>
        </p>
      )}
      {authMode === "dev" ? <DevLoginForm /> : <SupabaseLoginForm />}
    </>
  );
}

export function AdminLoginClient({
  authMode,
  devEmail,
  devPassword,
}: {
  authMode: AuthMode;
  devEmail?: string;
  devPassword?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
          宜家超市后台
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">管理员登录</h1>
        <p className="mt-2 text-sm text-slate-600">
          {authMode === "supabase"
            ? "使用 Supabase 管理员账号登录"
            : authMode === "dev"
              ? "使用管理员账号登录"
              : "请先配置环境变量"}        </p>

        <Suspense fallback={<p className="mt-8 text-sm text-slate-500">加载中…</p>}>
          <LoginContent authMode={authMode} devEmail={devEmail} devPassword={devPassword} />
        </Suspense>      </div>
    </main>
  );
}
