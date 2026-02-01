"use client";

interface PdfViewerProps {
  pdfPath: string;
  title?: string;
}

export function PdfViewer({ pdfPath, title }: PdfViewerProps) {
  // 构建 PDF 文件的 URL，隐藏所有工具栏和导航面板
  const pdfUrl = `/api/pdf?path=${encodeURIComponent(pdfPath)}`;

  return (
    <div className="w-full h-full">
      {/* PDF 内容区域 - 无工具栏，最大化显示空间 */}
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
        className="w-full h-full"
        style={{
          border: "none",
          display: "block",
          minHeight: "calc(100vh - 200px)",
        }}
        title={title || "PDF 文档"}
      />
    </div>
  );
}
