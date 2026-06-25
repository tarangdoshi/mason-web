import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "../../../../lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await apiFetch("/api/v1/public/leads/checkout", {
      method: "POST",
      body
    });

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to create checkout lead." }, { status: 500 });
  }
}
