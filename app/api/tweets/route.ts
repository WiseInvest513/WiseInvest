import { NextResponse } from "next/server";
import { tweets } from "@/lib/data";

/**
 * GET /api/tweets
 * 支持标题关键词、分类、类型检索及分页
 * 示例：
 * /api/tweets?q=教程
 * /api/tweets?category=web3&type=干货&page=1&pageSize=20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const category = (searchParams.get("category") || "").trim();
    const type = (searchParams.get("type") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "200")));

    const filtered = tweets.filter((tweet) => {
      const titleMatch = !q || tweet.title.toLowerCase().includes(q);
      const categoryMatch =
        !category ||
        tweet.category
          .split(",")
          .map((v) => v.trim())
          .includes(category);
      const typeMatch =
        !type ||
        tweet.type
          .split(",")
          .map((v) => v.trim())
          .includes(type);
      return titleMatch && categoryMatch && typeMatch;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return NextResponse.json({
      success: true,
      data,
      count: total,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
      },
      filters: {
        q: q || null,
        category: category || null,
        type: type || null,
      },
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
