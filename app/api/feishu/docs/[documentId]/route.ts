import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "飞书服务已停用" }, { status: 503 });
}
