import { getAdminAuthMode } from "@/lib/admin-auth";
import { AdminLoginClient } from "./AdminLoginClient";

export default function AdminLoginPage() {
  const authMode = getAdminAuthMode();
  const showDevHint = authMode === "dev";

  return <AdminLoginClient authMode={authMode} showDevHint={showDevHint} />;
}
