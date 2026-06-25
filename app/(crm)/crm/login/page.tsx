import { redirect } from "next/navigation";
import LoginScreen from "./login-screen";
import { getCurrentStaffUser } from "../../../../lib/crm";

export default async function CrmLoginPage() {
  const user = await getCurrentStaffUser();
  if (user) {
    redirect("/crm");
  }

  return <LoginScreen />;
}
