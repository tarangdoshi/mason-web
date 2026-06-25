import { requireAdminCrmUser } from "../../../../../lib/crm";
import SanityStudioClient from "./studio-client";

export const dynamic = "force-dynamic";

export default async function SanityStudioPage() {
  await requireAdminCrmUser();

  return <SanityStudioClient />;
}
