"use client";

import { useState, useCallback, useEffect } from "react";
import { Download, Loader2, X, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { siteConfig } from "@/lib/config";

// ─── Canvas helpers ──────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── Styled markdown renderer for Canvas ────────────────────────

interface Seg { text: string; bold: boolean }

/** 把一行内的 **bold** 解析成 Segment 数组 */
function parseInline(raw: string): Seg[] {
  // 先去掉图片、链接语法、行内代码
  const text = raw
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/`[^`]+`/g, m => m.slice(1, -1));

  const segs: Seg[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segs.push({ text: text.slice(last, m.index), bold: false });
    segs.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) segs.push({ text: text.slice(last), bold: false });
  return segs.filter(s => s.text.length > 0);
}

interface Block {
  type: "h1" | "h2" | "h3" | "p";
  segs: Seg[];
}

/** 把 markdown 解析成带样式的块列表（跳过图片/代码块/hr） */
function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  let inCode = false;
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("```")) { inCode = !inCode; continue; }
    if (inCode) continue;
    if (!line.trim() || line.match(/^---+$/) || line.startsWith("![")) continue;

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", segs: parseInline(line.slice(4)) });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", segs: parseInline(line.slice(3)) });
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "h1", segs: parseInline(line.slice(2)) });
    } else {
      const cleaned = line
        .replace(/^>\s*/, "")
        .replace(/^[-*+]\s+/, "• ")
        .replace(/^\d+\.\s+/, "• ");
      if (cleaned.trim()) blocks.push({ type: "p", segs: parseInline(cleaned) });
    }
  }
  return blocks;
}

/**
 * 把带样式的 Seg[] 折行绘制，返回实际绘制高度
 * @param dry true 时只测量不绘制
 */
function drawSegs(
  ctx: CanvasRenderingContext2D,
  segs: Seg[],
  x: number, y: number,
  maxW: number, lineH: number, maxLines: number,
  fontSize: number, fontFamily: string,
  color: string,
  dry = false
): number {
  // 展开成字符列表（保留样式）
  const chars: { ch: string; bold: boolean }[] = [];
  for (const s of segs)
    for (const ch of s.text) chars.push({ ch, bold: s.bold });

  // 折行
  const lines: { ch: string; bold: boolean }[][] = [];
  let cur: { ch: string; bold: boolean }[] = [];
  let curW = 0;

  for (const c of chars) {
    ctx.font = `${c.bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
    const cw = ctx.measureText(c.ch).width;
    if (curW + cw > maxW && cur.length > 0) {
      lines.push(cur);
      if (lines.length === maxLines) break;
      cur = [c]; curW = cw;
    } else {
      cur.push(c); curW += cw;
    }
  }
  if (lines.length < maxLines && cur.length > 0) lines.push(cur);

  if (!dry) {
    ctx.fillStyle = color;
    for (let i = 0; i < lines.length; i++) {
      let cx = x;
      let j = 0;
      while (j < lines[i].length) {
        const bold = lines[i][j].bold;
        let txt = "";
        while (j < lines[i].length && lines[i][j].bold === bold) txt += lines[i][j++].ch;
        ctx.font = `${bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
        ctx.fillText(txt, cx, y + i * lineH);
        cx += ctx.measureText(txt).width;
      }
    }
  }
  return Math.min(lines.length, maxLines) * lineH;
}

// ─── Card renderer ───────────────────────────────────────────────

interface CardParams {
  articleUrl: string;
  title: string;
  date: string;
  readTime: number;
  categoryName: string;
  categoryEmoji: string;
  content: string;
}

async function renderCard(p: CardParams): Promise<string> {
  const W = 1080, H = 1920, DPR = 2;
  const PAD = 68;
  const F = '"PingFang SC","Microsoft YaHei","Helvetica Neue",Arial,sans-serif';

  const qrDataUrl = await QRCode.toDataURL(p.articleUrl, {
    width: 380, margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    errorCorrectionLevel: "H",
  });
  const qrImg = await loadImage(qrDataUrl);

  const canvas = document.createElement("canvas");
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(DPR, DPR);

  // ── 白色底 + 点阵 ────────────────────────────────────────
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(148,163,184,0.08)";
  for (let gy = 0; gy < H; gy += 30)
    for (let gx = 0; gx < W; gx += 30) {
      ctx.beginPath(); ctx.arc(gx, gy, 1.6, 0, Math.PI * 2); ctx.fill();
    }

  // ── 顶部彩条 ─────────────────────────────────────────────
  const tg = ctx.createLinearGradient(0, 0, W, 0);
  tg.addColorStop(0, "#f59e0b");
  tg.addColorStop(0.5, "#f97316");
  tg.addColorStop(1, "#ef4444");
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, W, 12);

  // ── HEADER ROW：品牌左 + 分类右（同行） ──────────────────
  const HEADER_Y = 12 + 44;
  const LOGO = 48;
  const ROW_MID = HEADER_Y + LOGO / 2;

  const lg = ctx.createLinearGradient(PAD, HEADER_Y, PAD + LOGO, HEADER_Y + LOGO);
  lg.addColorStop(0, "#f59e0b"); lg.addColorStop(1, "#f97316");
  ctx.fillStyle = lg;
  roundRect(ctx, PAD, HEADER_Y, LOGO, LOGO, 11); ctx.fill();
  ctx.font = `bold 26px ${F}`; ctx.fillStyle = "#ffffff";
  ctx.fillText("W", PAD + 14, HEADER_Y + 33);

  ctx.font = `bold 30px ${F}`; ctx.fillStyle = "#0f172a";
  ctx.fillText("Wise Invest", PAD + LOGO + 16, ROW_MID + 11);

  const badge = `${p.categoryEmoji}  ${p.categoryName}`;
  ctx.font = `bold 22px ${F}`;
  const bw = ctx.measureText(badge).width + 44, bh = 42;
  const bx = W - PAD - bw, by = ROW_MID - bh / 2;
  roundRect(ctx, bx, by, bw, bh, 21); ctx.fillStyle = "#fef3c7"; ctx.fill();
  ctx.fillStyle = "#92400e"; ctx.fillText(badge, bx + 22, by + 28);

  // ── 分割线 1 ─────────────────────────────────────────────
  const DIV1 = HEADER_Y + LOGO + 36;
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(PAD, DIV1, W - PAD * 2, 2);

  // ── 标题（动态定位：元数据始终距标题视觉底部固定间距）────
  // title baseline 位置：DIV1底 + 78px（视觉留白 ≈ 78-38=40px）
  const TITLE_Y = DIV1 + 2 + 78;
  const TITLE_LINE_H = 72;
  const titleH = drawSegs(ctx,
    [{ text: p.title, bold: true }],
    PAD, TITLE_Y, W - PAD * 2, TITLE_LINE_H, 3, 48, F, "#0f172a"
  );
  // 末行 baseline = TITLE_Y + titleH - TITLE_LINE_H
  // 末行视觉底部 ≈ 末行 baseline + descender(10)
  // 元数据 label baseline = 末行视觉底部 + 视觉间距(40) + label_ascender(17)
  // 合并: TITLE_Y + titleH - TITLE_LINE_H + 10 + 40 + 17 = TITLE_Y + titleH - 5
  let y = TITLE_Y + titleH - 5;
  // 无论标题1行还是3行，元数据与标题底部视觉间距始终 ≈ 40px
  ctx.font = `22px ${F}`; ctx.fillStyle = "#94a3b8";
  ctx.fillText("发布日期", PAD, y);
  ctx.fillText("阅读时长", W / 2 + 24, y);
  y += 36;
  ctx.font = `bold 30px ${F}`; ctx.fillStyle = "#1e293b";
  ctx.fillText(p.date, PAD, y);
  ctx.fillText(`约 ${p.readTime} 分钟`, W / 2 + 24, y);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(W / 2, y - 54, 2, 66);
  y += 52;

  // ── 分割线 2 ─────────────────────────────────────────────
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(PAD, y, W - PAD * 2, 2);
  y += 2 + 44;

  // ── 正文内容区（带样式渲染）────────────────────────────────
  const BOTTOM_H = 252;
  const CONTENT_MAX_W = W - PAD * 2;
  const CONTENT_BOTTOM = H - BOTTOM_H - 20;

  const blocks = parseBlocks(p.content);

  for (const block of blocks) {
    if (y >= CONTENT_BOTTOM) break;
    const remaining = Math.max(1, Math.floor((CONTENT_BOTTOM - y) / 54));

    switch (block.type) {
      case "h1": {
        if (y > CONTENT_BOTTOM - 60) break;
        y += 20;
        // 橙色左竖条
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(PAD, y - 30, 5, 42);
        const h = drawSegs(ctx, block.segs, PAD + 16, y, CONTENT_MAX_W - 16, 58, 2, 36, F, "#0f172a");
        y += h + 16;
        break;
      }
      case "h2": {
        if (y > CONTENT_BOTTOM - 52) break;
        y += 14;
        ctx.fillStyle = "#fb923c";
        ctx.fillRect(PAD, y - 24, 4, 34);
        const h = drawSegs(ctx, block.segs, PAD + 14, y, CONTENT_MAX_W - 14, 50, 2, 30, F, "#1e293b");
        y += h + 12;
        break;
      }
      case "h3": {
        if (y > CONTENT_BOTTOM - 46) break;
        y += 10;
        const h = drawSegs(ctx, block.segs, PAD, y, CONTENT_MAX_W, 46, 2, 27, F, "#334155");
        y += h + 8;
        break;
      }
      default: {
        const h = drawSegs(ctx, block.segs, PAD, y, CONTENT_MAX_W, 54, remaining, 30, F, "#374151");
        y += h + 16;
      }
    }
  }

  // ── 底部浅灰栏 ────────────────────────────────────────────
  const barY = H - BOTTOM_H;
  // 浅灰背景（非黑）
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, barY, W, BOTTOM_H);
  // 顶部分隔线
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(0, barY, W, 1);

  // 左侧两行文字：同字号上下居中
  const QR_SIZE = 172;
  const LINE_FONT = 26;    // 两行用同一字号
  const LINE_GAP = 44;     // 两行 baseline 间距
  // 两行文字整体视觉高度 ≈ LINE_FONT + LINE_GAP = 70px，在 BOTTOM_H 内居中
  const leftBlockH = LINE_FONT + LINE_GAP;
  const leftStartY = barY + (BOTTOM_H - leftBlockH) / 2 + LINE_FONT;
  ctx.font = `${LINE_FONT}px ${F}`; ctx.fillStyle = "#94a3b8";
  ctx.fillText("数据来源：wise-invest.org", PAD, leftStartY);
  ctx.font = `bold ${LINE_FONT}px ${F}`; ctx.fillStyle = "#0f172a";
  ctx.fillText("由 @WiseInvest 制作", PAD, leftStartY + LINE_GAP);

  // 右侧圆角矩形二维码
  const qrX = W - PAD - QR_SIZE;
  const qrY = barY + (BOTTOM_H - QR_SIZE) / 2 - 14;

  // 白底 + 细边框
  roundRect(ctx, qrX - 6, qrY - 6, QR_SIZE + 12, QR_SIZE + 12, 16);
  ctx.fillStyle = "#e2e8f0"; ctx.fill();
  roundRect(ctx, qrX - 3, qrY - 3, QR_SIZE + 6, QR_SIZE + 6, 14);
  ctx.fillStyle = "#ffffff"; ctx.fill();

  ctx.save();
  roundRect(ctx, qrX, qrY, QR_SIZE, QR_SIZE, 10);
  ctx.clip();
  ctx.drawImage(qrImg, qrX, qrY, QR_SIZE, QR_SIZE);
  ctx.restore();

  ctx.font = `19px ${F}`; ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.fillText("扫码查看全文", qrX + QR_SIZE / 2, barY + BOTTOM_H - 10);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

// ─── Component ───────────────────────────────────────────────────

interface ArticleExportButtonProps {
  articleId: string;
  categoryId: string;
  uid: string;
  title: string;
  summary: string;
  date: string;
  readTime: number;
  categoryName: string;
  categoryEmoji: string;
  content: string;
}

export function ArticleExportButton({
  categoryId, uid, title, date, readTime,
  categoryName, categoryEmoji, content,
}: ArticleExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!previewUrl) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewUrl(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [previewUrl]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.download = `${title.slice(0, 30).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "-")}.png`;
    a.href = previewUrl; a.click();
  }, [previewUrl, title]);

  const handleCopy = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const b64 = previewUrl.split(",")[1];
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: "image/png" });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { handleDownload(); }
  }, [previewUrl, handleDownload]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const articleUrl = siteConfig.url(`/articles/${categoryId}/${uid}`);
      const dataUrl = await renderCard({
        articleUrl, title, date, readTime, categoryName, categoryEmoji, content,
      });
      setPreviewUrl(dataUrl);
    } catch (err) { console.error("导出失败:", err); }
    finally { setExporting(false); }
  }, [categoryId, uid, title, date, readTime, categoryName, categoryEmoji, content]);

  return (
    <>
      <button
        onClick={handleExport} disabled={exporting}
        title="导出为 9:16 分享图片（含二维码）"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
          text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-800 hover:text-amber-600 dark:hover:text-amber-400
          hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20
          disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
      >
        {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {exporting ? "生成中…" : "导出图片"}
      </button>

      {previewUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative flex flex-col items-center gap-4 max-h-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewUrl} alt="预览" className="rounded-2xl shadow-2xl object-contain"
              style={{ maxHeight: "76vh", maxWidth: "90vw" }} />
            <div className="flex items-center gap-3">
              <button onClick={handleCopy}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/40
                  transition-all duration-150 active:scale-95">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "已复制！" : "复制图片"}
              </button>
              <button onClick={handleDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                  bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200
                  border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500
                  shadow-sm transition-all duration-150 active:scale-95">
                <Download className="w-4 h-4" />
                下载图片
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
