import { NextRequest, NextResponse } from "next/server";

const CANVAS_API_URL = "https://cursos.canvas.uc.cl/api/v1";
const CANVAS_TOKEN = process.env.CANVAS_TOKEN;

export async function GET(req: NextRequest) {
  if (!CANVAS_TOKEN) {
    return NextResponse.json({ error: "Missing Canvas token" }, { status: 401 });
  }

  const response = await fetch(`${CANVAS_API_URL}/courses?enrollment_state=active`, {
    headers: {
      Authorization: `Bearer ${CANVAS_TOKEN}`,
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
