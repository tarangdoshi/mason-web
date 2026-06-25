import { NextResponse } from "next/server";
import { ApiError, apiFetch } from "../../../../../../lib/api";
import { getCrmSessionToken, getCurrentStaffUser } from "../../../../../../lib/crm";
import { contentModuleMeta, isContentModuleKey } from "../../../content/content-studio";

type RouteContext = {
  params: Promise<{
    module: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { module } = await context.params;
  if (!isContentModuleKey(module)) {
    return NextResponse.json({ error: "Unknown content module." }, { status: 404 });
  }

  const user = await getCurrentStaffUser();
  const token = await getCrmSessionToken();
  if (!token || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const response = await apiFetch(contentModuleMeta[module].resourcePath, {
      method: "POST",
      token,
      body
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to save content." }, { status: 500 });
  }
}
