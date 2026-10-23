/** 与 .env.example / deploy/env.production.example 中的模板值保持一致。 */
export const SESSION_SECRET_PLACEHOLDER = "replace-with-a-long-random-string";

export type SessionSecretProblem = "missing" | "placeholder" | "matches-password";

export function sessionSecretProblem(
  secret: string | undefined,
  password: string | undefined,
): SessionSecretProblem | null {
  const value = secret?.trim() ?? "";
  if (!value) return "missing";
  if (value === SESSION_SECRET_PLACEHOLDER) return "placeholder";

  const rawPassword = password ?? "";
  const trimmedPassword = rawPassword.trim();
  if (rawPassword && (value === rawPassword || value === trimmedPassword)) {
    return "matches-password";
  }
  return null;
}

export function sessionSecretFailureMessage(problem: SessionSecretProblem): string {
  switch (problem) {
    case "missing":
      return "生产环境缺少 ADMIN_SESSION_SECRET，不能回退到登录密码。";
    case "placeholder":
      return "ADMIN_SESSION_SECRET 仍是模板占位符，生产环境拒绝启动。";
    case "matches-password":
      return "ADMIN_SESSION_SECRET 不能与 ADMIN_DEV_PASSWORD 相同。";
  }
}

/** 生产环境在进程接受请求前调用。开发环境不检查。 */
export function assertProductionSessionSecret(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production") return;
  const problem = sessionSecretProblem(env.ADMIN_SESSION_SECRET, env.ADMIN_DEV_PASSWORD);
  if (problem) {
    throw new Error(sessionSecretFailureMessage(problem));
  }
}

/**
 * 开发环境未设置密钥时回退到 ADMIN_DEV_PASSWORD。
 * 生产环境缺少密钥、仍是占位符、或与登录密码相同时直接抛错，不回退。
 */
export function resolveSessionSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  if (env.NODE_ENV === "production") {
    assertProductionSessionSecret(env);
    return (env.ADMIN_SESSION_SECRET ?? "").trim();
  }

  const configured = env.ADMIN_SESSION_SECRET?.trim();
  if (configured) return configured;
  return env.ADMIN_DEV_PASSWORD || null;
}
