export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { enforceProductionSessionSecret } = await import("./instrumentation-node");
    await enforceProductionSessionSecret();
  }
}
