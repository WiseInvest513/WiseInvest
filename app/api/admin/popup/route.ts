import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json({ message: "活动弹窗已停用，网站现自动展示加入群聊。" }, { status: 410 });
}
