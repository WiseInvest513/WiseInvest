import { NextResponse } from "next/server";
import { tweets } from "@/lib/data";

/**
 * GET /api/tweets
 * 返回所有推文数据，供知识图谱等外部服务使用
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: tweets,
      count: tweets.length,
    });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tweets",
      },
      { status: 500 }
    );
  }
}
