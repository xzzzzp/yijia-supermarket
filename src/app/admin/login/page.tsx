import { getAdminAuthMode } from "@/lib/admin-auth";
import { AdminLoginClient } from "./AdminLoginClient";

export default function AdminLoginPage() {
  const authMode = getAdminAuthMode();
  const devEmail =
    authMode === "dev" ? process.env.ADMIN_DEV_EMAIL ?? "admin@local.dev" : undefined;
  const devPassword =
    authMode === "dev" ? process.env.ADMIN_DEV_PASSWORD : undefined;

  return (
    <AdminLoginClient
      authMode={authMode}
      devEmail={devEmail}
      devPassword={devPassword}
    />
  );
}
