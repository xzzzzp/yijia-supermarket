import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { clientAddress } from "../src/lib/client-ip.ts";
import {
  LOGIN_FAILURE_LIMIT,
  LOGIN_LOCKOUT_MS,
  LOGIN_WINDOW_MS,
  loginLockRemaining,
  recordLoginFailure,
  recordLoginSuccess,
  resetLoginRateLimits,
} from "../src/lib/login-rate-limit.ts";
import { MIN_STAFF_PASSWORD_LENGTH } from "../src/lib/password-policy.ts";
import { sameOriginRelativePath } from "../src/lib/safe-redirect.ts";
import { securityHeaders } from "../src/lib/security-headers.ts";
import {
  assertProductionSessionSecret,
  resolveSessionSecret,
  SESSION_SECRET_PLACEHOLDER,
} from "../src/lib/session-secret.ts";

const NOW = 1_700_000_000_000;
const IP = "203.0.113.10";

test("failed admin logins lock the IP, and success clears the counter", () => {
  resetLoginRateLimits();

  for (let i = 0; i < LOGIN_FAILURE_LIMIT - 1; i += 1) {
    const result = recordLoginFailure(IP, NOW);
    assert.equal(result.locked, false);
  }

  const tripped = recordLoginFailure(IP, NOW);
  assert.equal(tripped.locked, true);
  assert.equal(tripped.retryAfterMs, LOGIN_LOCKOUT_MS);
  assert.equal(loginLockRemaining(IP, NOW + 1_000), LOGIN_LOCKOUT_MS - 1_000);

  const duringLock = recordLoginFailure(IP, NOW + 1_000);
  assert.equal(duringLock.retryAfterMs, LOGIN_LOCKOUT_MS - 1_000);

  assert.equal(loginLockRemaining(IP, NOW + LOGIN_LOCKOUT_MS), 0);
  const afterLock = recordLoginFailure(IP, NOW + LOGIN_LOCKOUT_MS);
  assert.equal(afterLock.locked, false);

  recordLoginSuccess(IP);
  assert.equal(loginLockRemaining(IP, NOW + LOGIN_LOCKOUT_MS), 0);
  for (let i = 0; i < LOGIN_FAILURE_LIMIT - 1; i += 1) {
    assert.equal(recordLoginFailure(IP, NOW + LOGIN_LOCKOUT_MS).locked, false);
  }
});

test("failure window expires, and other IPs are counted separately", () => {
  resetLoginRateLimits();
  assert.equal(recordLoginFailure(IP, NOW).locked, false);
  const later = recordLoginFailure(IP, NOW + LOGIN_WINDOW_MS);
  assert.equal(later.locked, false);
  assert.equal(loginLockRemaining("203.0.113.11", NOW), 0);
  assert.equal(recordLoginFailure("198.51.100.4", NOW).locked, false);
});

test("client address prefers the first forwarded hop", () => {
  assert.equal(clientAddress("203.0.113.8, 10.0.0.1", "10.0.0.2"), "203.0.113.8");
  assert.equal(clientAddress(null, " 10.0.0.2 "), "10.0.0.2");
  assert.equal(clientAddress("  ", ""), "");
});

test("production session secret fails closed", () => {
  assert.throws(
    () => assertProductionSessionSecret({ NODE_ENV: "production", ADMIN_DEV_PASSWORD: "login-secret" }),
    /ADMIN_SESSION_SECRET/,
  );
  assert.throws(
    () =>
      assertProductionSessionSecret({
        NODE_ENV: "production",
        ADMIN_SESSION_SECRET: SESSION_SECRET_PLACEHOLDER,
        ADMIN_DEV_PASSWORD: "login-secret",
      }),
    /占位符/,
  );
  assert.throws(
    () =>
      assertProductionSessionSecret({
        NODE_ENV: "production",
        ADMIN_SESSION_SECRET: "same-value",
        ADMIN_DEV_PASSWORD: "same-value",
      }),
    /不能与 ADMIN_DEV_PASSWORD 相同/,
  );
  assert.throws(
    () => resolveSessionSecret({ NODE_ENV: "production", ADMIN_DEV_PASSWORD: "login-secret" }),
    /不能回退到登录密码/,
  );
  assert.equal(
    resolveSessionSecret({
      NODE_ENV: "production",
      ADMIN_SESSION_SECRET: "independent-session-secret",
      ADMIN_DEV_PASSWORD: "login-secret",
    }),
    "independent-session-secret",
  );
});

test("development still falls back to the dev password when the secret is unset", () => {
  assert.equal(
    resolveSessionSecret({ NODE_ENV: "development", ADMIN_DEV_PASSWORD: "dev-only" }),
    "dev-only",
  );
  assert.doesNotThrow(() =>
    assertProductionSessionSecret({ NODE_ENV: "development" }),
  );
});

test("redirectUrl accepts only same-origin relative paths", () => {
  assert.equal(sameOriginRelativePath("/order/success?orderId=abc"), "/order/success?orderId=abc");
  assert.equal(sameOriginRelativePath("  /cart  "), "/cart");
  assert.equal(sameOriginRelativePath("https://example.invalid/order/success"), null);
  assert.equal(sameOriginRelativePath("http://example.invalid"), null);
  assert.equal(sameOriginRelativePath("//example.invalid/path"), null);
  assert.equal(sameOriginRelativePath("/\\example.invalid"), null);
  assert.equal(sameOriginRelativePath("/%2f%2fexample.invalid"), null);
  assert.equal(sameOriginRelativePath("order/success"), null);
  assert.equal(sameOriginRelativePath(""), null);
});

test("security headers are the conservative set", () => {
  const keys = securityHeaders.map((header) => header.key);
  assert.deepEqual(keys, [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]);
  assert.equal(securityHeaders[0]?.value, "DENY");
  assert.equal(securityHeaders[1]?.value, "nosniff");
  assert.equal(MIN_STAFF_PASSWORD_LENGTH >= 8, true);
});

function runCheckEnv(contents: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "yijia-env-"));
  const file = path.join(dir, "env.local");
  writeFileSync(file, contents);
  const result = spawnSync("bash", ["deploy/check-env.sh"], {
    cwd: process.cwd(),
    env: { ...process.env, CHECK_ENV_FILE: file },
    encoding: "utf8",
  });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

const BASE_ENV = `NEXT_PUBLIC_BASE_PATH=/yijia
MYSQL_HOST=127.0.0.1
MYSQL_DATABASE=yijia
MYSQL_USER=yijia
ADMIN_DEV_EMAIL=admin@example.test
ADMIN_DEV_PASSWORD=fixture-login-password
`;

test("check-env fails when the session secret is missing, a placeholder, or the login password", () => {
  const missing = runCheckEnv(BASE_ENV);
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /缺少 ADMIN_SESSION_SECRET/);
  assert.equal(missing.stderr.includes("fixture-login-password"), false);

  const placeholder = runCheckEnv(`${BASE_ENV}ADMIN_SESSION_SECRET=${SESSION_SECRET_PLACEHOLDER}\n`);
  assert.notEqual(placeholder.status, 0);
  assert.match(placeholder.stderr, /占位符/);
  assert.doesNotMatch(placeholder.stderr, /WARN/);

  const reused = runCheckEnv(`${BASE_ENV}ADMIN_SESSION_SECRET=fixture-login-password\n`);
  assert.notEqual(reused.status, 0);
  assert.match(reused.stderr, /不能与 ADMIN_DEV_PASSWORD 相同/);
  assert.equal(reused.stderr.includes("fixture-login-password"), false);

  const ok = runCheckEnv(`${BASE_ENV}ADMIN_SESSION_SECRET=fixture-session-secret-independent\n`);
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /检查通过/);
});
