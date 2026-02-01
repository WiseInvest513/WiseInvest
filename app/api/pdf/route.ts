import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "缺少文件路径参数" }, { status: 400 });
    }

    // 构建完整的文件路径
    const documentsDir = path.join(process.cwd(), "lib/anthology/documents");
    const fullPath = path.join(documentsDir, filePath);

    // 安全检查：确保文件在 documents 目录内
    if (!fullPath.startsWith(documentsDir)) {
      return NextResponse.json({ error: "无效的文件路径" }, { status: 400 });
    }

    // 检查文件是否存在
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    // 检查文件扩展名
    const ext = path.extname(fullPath).toLowerCase();
    if (ext !== ".pdf") {
      return NextResponse.json({ error: "不是 PDF 文件" }, { status: 400 });
    }

    // 读取文件
    const fileBuffer = fs.readFileSync(fullPath);

    // 返回 PDF 文件（使用 Response 而不是 NextResponse）
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(path.basename(filePath))}"`,
        "Cache-Control": "public, max-age=3600",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[PDF API] 错误:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
