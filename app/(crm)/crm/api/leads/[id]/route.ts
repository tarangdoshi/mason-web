import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "../../../../../../lib/api";
import { getCrmSessionToken } from "../../../../../../lib/crm";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const token = await getCrmSessionToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = await context.params;
    const response = await apiFetch(`/api/v1/internal/leads/${id}`, {
      method: "PATCH",
      token,
      body
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to update lead." }, { status: 500 });
  }
}
