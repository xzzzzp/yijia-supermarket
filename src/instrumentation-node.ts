export async function enforceProductionSessionSecret(): Promise<void> {
  const { assertProductionSessionSecret } = await import("./lib/session-secret");
  try {
    assertProductionSessionSecret();
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    // Next 会接住 register() 的异常并继续监听，请求全部变成 500。
    // 这里直接退出，让生产进程起不来。
    process.exit(1);
  }
}
