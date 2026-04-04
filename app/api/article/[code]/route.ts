import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "文章系统重建中" }, { status: 503 });
}
