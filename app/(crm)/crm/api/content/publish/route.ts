import { NextResponse } from "next/server";
import { ApiError, apiFetch } from "../../../../../../lib/api";
import { getCrmSessionToken, getCurrentStaffUser } from "../../../../../../lib/crm";

export async function POST(request: Request) {
  const user = await getCurrentStaffUser();
  const token = await getCrmSessionToken();
  if (!token || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const response = await apiFetch("/api/v1/internal/content/publish", {
      method: "POST",
      token,
      body
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to publish content." }, { status: 500 });
  }
}
