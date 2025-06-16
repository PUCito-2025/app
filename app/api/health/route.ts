import { NextResponse } from "next/server";

export async function GET(request: Request) {
  /* eslint-disable-next-line no-console */
  console.log("Health check endpoint hit from:", request.headers.get("user-agent"));
  return NextResponse.json({ status: "ok" });
}
