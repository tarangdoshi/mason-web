import { redirect } from "next/navigation";

export default function LegacyAdminHomepagePage() {
  redirect("/crm/content/homepage");
}
