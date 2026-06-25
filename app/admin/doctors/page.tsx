import { redirect } from "next/navigation";

export default function LegacyAdminDoctorsPage() {
  redirect("/crm/content/doctors");
}
