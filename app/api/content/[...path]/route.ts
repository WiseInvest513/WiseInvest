import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = path.join(process.cwd(), "content", ...segments);

  // Security: prevent path traversal
  const contentRoot = path.join(process.cwd(), "content");
  if (!filePath.startsWith(`${contentRoot}${path.sep}`)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
  };

  // This endpoint serves media only. Article source must go through membership checks.
  const mime = mimeMap[ext];
  if (!mime) return new NextResponse("Not Found", { status: 404 });
  if (!fs.realpathSync(filePath).startsWith(`${fs.realpathSync(contentRoot)}${path.sep}`)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  if (!fs.statSync(filePath).isFile()) return new NextResponse("Not Found", { status: 404 });
  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
