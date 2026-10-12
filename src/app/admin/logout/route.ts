import { adminLogout } from "@/app/admin/actions";

export async function POST() {
  await adminLogout();
}
