import { redirect } from "next/navigation";

export default function LegacyAdminPackagesPage() {
  redirect("/crm/content/packages");
}
