export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { assertProductionSessionSecret } = await import("./lib/session-secret");
  assertProductionSessionSecret();
}
