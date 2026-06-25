import { redirect } from "next/navigation";

export default function LegacyAdminLoginPage() {
  redirect("/crm/login");
}
