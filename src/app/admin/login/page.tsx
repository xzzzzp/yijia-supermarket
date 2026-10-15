import { getAdminAuthMode } from "@/lib/admin-auth";
import { AdminLoginClient } from "./AdminLoginClient";

export default function AdminLoginPage() {
  const authMode = getAdminAuthMode();
  const showDevHint = authMode === "dev" && process.env.NODE_ENV === "development";

  return <AdminLoginClient authMode={authMode} showDevHint={showDevHint} />;
}
