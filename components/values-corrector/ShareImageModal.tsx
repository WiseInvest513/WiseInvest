"use client";

import { useRef, useMemo, useState } from "react";
import { X, Download, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usdToCny } from "@/lib/utils/exchange-rates";
import { REAL_WORLD_ITEMS } from "@/lib/constants/purchasing-power";
import type { AssetType } from "@/lib/asset-service";

interface ShareImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseAsset: {
    symbol: string;
    name: string;
    type: AssetType;
    amount: number;
    priceUSD: number;
  };
  totalValueCNY: number;
}

// 资产图标映射
const ASSET_ICONS: Record<string, string> = {
  BTC: "₿",
  ETH: "Ξ",
  SOL: "◎",
  BNB: "BNB",
  OKB: "OKB",
  USD: "💵",
  CNY: "💰",
  AAPL: "🍎",
  MSFT: "🪟",
  GOOGL: "🔍",
  AMZN: "📦",
  NVDA: "🎮",
  META: "👤",
  TSLA: "🚗",
  NDX: "📊",
  SPX: "📈",
  DJI: "📉",
};

export function ShareImageModal({
  isOpen,
  onClose,
  baseAsset,
  totalValueCNY,
}: ShareImageModalProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // 计算基础资产的总价值（USD）
  const baseTotalUSD = baseAsset.amount * baseAsset.priceUSD;

  // 从9个物品中随机选择4个（价格低于当前总价值），然后按价格从便宜到贵排序
  const selectedItems = useMemo(() => {
    // 过滤出价格低于当前总价值的物品
    const available = REAL_WORLD_ITEMS.filter(
      (item) => item.priceCNY < totalValueCNY && item.priceCNY > 0
    );

    // 随机打乱并取前4个
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 4);
    
    // 按价格从便宜到贵排序（数字多的到小的）
    return selected.sort((a, b) => a.priceCNY - b.priceCNY);
  }, [totalValueCNY]);

  const currentDate = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 使用 Canvas 生成图片 - 完全重写，确保与预览一致
  const generateSharePngBlob = async (): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");

    // 固定尺寸：1200px x 675px (16:9 比例)
    const width = 1200;
    const height = 675;
    const scale = 2; // 内部绘制清晰度
    
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // 背景：深色主题背景
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, width, height);

    // 边框（可选）
    ctx.strokeStyle = "rgba(251, 191, 36, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

    // ========== 布局参数 ==========
    const padding = 45;
    const leftZoneWidth = width * 0.40; // 左侧 40%
    const rightZoneStartX = leftZoneWidth; // 右侧从 40% 开始
    const rightZoneWidth = width - rightZoneStartX; // 右侧 60%
    const leftZoneCenterX = leftZoneWidth / 2; // 左侧区域中心 X
    const canvasCenterY = height / 2; // 画布垂直中心

    // ========== 字体设置 ==========
    const setFont = (size: number, weight: string = "400", family: string = "Inter, system-ui, PingFang SC, sans-serif") => {
      ctx.font = `${weight} ${size}px ${family}`;
    };

    // ========== 左侧列：标题 + 源值组 ==========
    
    // 1. 标题 "购买力矫正器" - 顶部
    setFont(44, "700", "Nunito, system-ui, sans-serif");
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const titleY = padding + 20;
    ctx.fillText("购买力矫正器", leftZoneCenterX, titleY);

    // 2. 源值组 ["1" + "BTC"] - 作为一组垂直居中
    // 计算组的垂直中心位置
    const sourceNumberSize = 88;
    const sourceSymbolSize = 48;
    const sourceGroupSpacing = 50; // "1" 和 "BTC" 之间的间距
    const sourceGroupHeight = sourceNumberSize + sourceGroupSpacing + sourceSymbolSize;
    const sourceGroupCenterY = canvasCenterY; // 使用画布垂直中心
    
    // 绘制 "1" - 在组中心上方
    const sourceNumberY = sourceGroupCenterY - sourceGroupSpacing / 2;
    setFont(sourceNumberSize, "800", "Nunito, system-ui, sans-serif");
    ctx.fillStyle = "#FF9F0A"; // 琥珀色
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(baseAsset.amount.toString(), leftZoneCenterX, sourceNumberY);

    // 绘制 "BTC" - 在组中心下方
    const sourceSymbolY = sourceGroupCenterY + sourceGroupSpacing / 2;
    setFont(sourceSymbolSize, "700", "Nunito, system-ui, sans-serif");
    ctx.fillStyle = "#FFFFFF"; // 白色
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${baseIcon} ${baseAsset.symbol}`, leftZoneCenterX, sourceSymbolY);

    // ========== 右侧列：换算结果列表 ==========
    
    // 计算所有文本行的总高度
    const lineHeight = 32; // 行高
    const totalLines = 1 + selectedItems.length; // CNY + 物品数量
    const totalTextHeight = totalLines * lineHeight;
    
    // 垂直居中：从 (画布高度 - 总文本高度) / 2 开始绘制
    let currentY = (height - totalTextHeight) / 2;
    const rightTextStartX = rightZoneStartX + 60; // 右侧文本左对齐，距离右区起始 60px

    // 绘制人民币换算（第一条）
    setFont(26, "400", "Inter, system-ui, PingFang SC, sans-serif");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    
    const cnyPrefix = "约等于≈ ";
    const cnyValue = `¥${totalValueCNY.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
    const cnySuffix = " 💰 CNY";
    
    // 绘制前缀
    ctx.fillStyle = "#E5E5E5"; // 浅灰色
    ctx.fillText(cnyPrefix, rightTextStartX, currentY);
    const prefixWidth = ctx.measureText(cnyPrefix).width;
    
    // 绘制数值（琥珀色）
    setFont(26, "700", "Inter, system-ui, PingFang SC, sans-serif");
    ctx.fillStyle = "#FF9F0A"; // 琥珀色
    ctx.fillText(cnyValue, rightTextStartX + prefixWidth, currentY);
    const valueWidth = ctx.measureText(cnyValue).width;
    
    // 绘制后缀
    setFont(26, "400", "Inter, system-ui, PingFang SC, sans-serif");
    ctx.fillStyle = "#E5E5E5"; // 浅灰色
    ctx.fillText(cnySuffix, rightTextStartX + prefixWidth + valueWidth, currentY);
    
    currentY += lineHeight;

    // 绘制其他物品换算
    selectedItems.forEach((item) => {
      const count = Math.floor(totalValueCNY / item.priceCNY);
      const itemPrefix = "约等于≈ ";
      const itemValue = count.toLocaleString("zh-CN");
      const itemSuffix = ` ${item.icon} ${item.name}`;
      
      // 绘制前缀
      setFont(26, "400", "Inter, system-ui, PingFang SC, sans-serif");
      ctx.fillStyle = "#E5E5E5";
      ctx.fillText(itemPrefix, rightTextStartX, currentY);
      const itemPrefixWidth = ctx.measureText(itemPrefix).width;
      
      // 绘制数值（琥珀色）
      setFont(26, "700", "Inter, system-ui, PingFang SC, sans-serif");
      ctx.fillStyle = "#FF9F0A";
      ctx.fillText(itemValue, rightTextStartX + itemPrefixWidth, currentY);
      const itemValueWidth = ctx.measureText(itemValue).width;
      
      // 绘制后缀
      setFont(26, "400", "Inter, system-ui, PingFang SC, sans-serif");
      ctx.fillStyle = "#E5E5E5";
      ctx.fillText(itemSuffix, rightTextStartX + itemPrefixWidth + itemValueWidth, currentY);
      
      currentY += lineHeight;
    });

    // ========== 底部：时间和网址（右下角）==========
    const bottomPadding = padding;
    const bottomY = height - bottomPadding;
    
    setFont(14, "400", "Inter, system-ui, PingFang SC, sans-serif");
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(currentDate, width - bottomPadding, bottomY - 18);
    
    setFont(13, "500", "Inter, system-ui, PingFang SC, sans-serif");
    ctx.fillStyle = "#FF9F0A";
    ctx.fillText("wise-invest", width - bottomPadding, bottomY);

    // 返回 base64 数据 URL
    return canvas.toDataURL("image/png");
  };

  const handleDownload = async () => {
    try {
      const dataUrl = await generateSharePngBlob();

      // 创建下载链接
      const link = document.createElement("a");
      link.download = `购买力矫正-${baseAsset.symbol}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("生成图片失败，请重试");
    }
  };

  const handleCopy = async () => {
    try {
      const dataUrl = await generateSharePngBlob();

      // 将 base64 转换为 blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // 复制到剪贴板
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image:", error);
      alert("复制图片失败，请重试");
    }
  };

  if (!isOpen) return null;

  const baseIcon = ASSET_ICONS[baseAsset.symbol] || baseAsset.symbol.substring(0, 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-3xl bg-background border-border shadow-2xl">
        <CardContent className="p-0">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">分享图片</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 图片预览区域 */}
          <div className="p-4 bg-muted/30 overflow-auto flex items-center justify-center">
            <div
              ref={imageRef}
              className="mx-auto rounded-lg overflow-hidden"
              style={{
                width: "1200px",
                height: "675px",
                maxWidth: "100%",
                maxHeight: "70vh",
                aspectRatio: "1200 / 675",
                padding: "0",
                background: "#1a1a1a",
                color: "#FFFFFF",
                fontFamily: "Inter, system-ui, PingFang SC, sans-serif",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                border: "1px solid rgba(251, 191, 36, 0.2)",
                boxSizing: "border-box",
                transform: "scale(1)",
                transformOrigin: "center",
              }}
            >
              {/* 内部容器 - 完全匹配 Canvas 布局 */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  padding: "45px",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* 顶部标题 - 左侧区域中心 */}
                <div
                  style={{
                    position: "absolute",
                    top: "9.63%", // 65px / 675px ≈ 9.63%
                    left: "0",
                    width: "40%", // leftZoneWidth
                    textAlign: "center",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "clamp(28px, 3.67vw, 44px)", // 响应式字体，44px / 1200px = 3.67vw
                      fontWeight: "700",
                      color: "#FFFFFF",
                      margin: 0,
                      fontFamily: "Nunito, system-ui, sans-serif",
                      letterSpacing: "-0.5px",
                    }}
                  >
                    购买力矫正器
                  </h1>
                </div>

                {/* 左侧：源值组 - 垂直居中 */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "0",
                    width: "40%",
                    textAlign: "center",
                    transform: "translateY(-50%)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(56px, 7.33vw, 88px)", // 响应式字体，88px / 1200px = 7.33vw
                      fontWeight: "800",
                      color: "#FF9F0A",
                      marginBottom: "7.41%", // 50px / 675px ≈ 7.41%
                      lineHeight: "1",
                      fontFamily: "Nunito, system-ui, sans-serif",
                    }}
                  >
                    {baseAsset.amount}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(30px, 4vw, 48px)", // 响应式字体，48px / 1200px = 4vw
                      fontWeight: "700",
                      color: "#FFFFFF",
                      fontFamily: "Nunito, system-ui, sans-serif",
                    }}
                  >
                    {baseIcon} {baseAsset.symbol}
                  </div>
                </div>

                {/* 右侧：换算结果 - 垂直居中，左对齐 */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "40%",
                    width: "60%",
                    transform: "translateY(-50%)",
                    paddingLeft: "5%", // 60px / 1200px = 5%
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4.74%", // 32px / 675px ≈ 4.74%
                    }}
                  >
                    {/* 人民币换算（必须显示） */}
                    <div style={{ fontSize: "clamp(18px, 2.17vw, 26px)", lineHeight: "1" }}>
                      <span style={{ color: "#E5E5E5", fontFamily: "Inter, system-ui, PingFang SC, sans-serif", fontWeight: "400" }}>约等于≈ </span>
                      <span
                        style={{
                          color: "#FF9F0A",
                          fontWeight: "700",
                          fontFamily: "Inter, system-ui, PingFang SC, sans-serif",
                        }}
                      >
                        ¥{totalValueCNY.toLocaleString("zh-CN", {
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span style={{ color: "#E5E5E5", fontFamily: "Inter, system-ui, PingFang SC, sans-serif", fontWeight: "400" }}>
                        {" "}💰 CNY
                      </span>
                    </div>

                    {/* 其他物品换算（随机4个） */}
                    {selectedItems.map((item, index) => {
                      const count = Math.floor(totalValueCNY / item.priceCNY);

                      return (
                        <div
                          key={item.id}
                          style={{ fontSize: "clamp(18px, 2.17vw, 26px)", lineHeight: "1" }}
                        >
                          <span style={{ color: "#E5E5E5", fontFamily: "Inter, system-ui, PingFang SC, sans-serif", fontWeight: "400" }}>约等于≈ </span>
                          <span
                            style={{
                              color: "#FF9F0A",
                              fontWeight: "700",
                              fontFamily: "Inter, system-ui, PingFang SC, sans-serif",
                            }}
                          >
                            {count.toLocaleString("zh-CN")}
                          </span>
                          <span style={{ color: "#E5E5E5", fontFamily: "Inter, system-ui, PingFang SC, sans-serif", fontWeight: "400" }}>
                            {" "}{item.icon} {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 底部：时间和网址 - 右下角 */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "6.67%", // 45px / 675px ≈ 6.67%
                    right: "3.75%", // 45px / 1200px = 3.75%
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(10px, 1.17vw, 14px)",
                      color: "#94a3b8",
                      marginBottom: "0.59%", // 4px / 675px ≈ 0.59%
                      fontFamily: "Inter, system-ui, PingFang SC, sans-serif",
                      fontWeight: "400",
                    }}
                  >
                    {currentDate}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(9px, 1.08vw, 13px)",
                      color: "#FF9F0A",
                      fontWeight: "500",
                      fontFamily: "Inter, system-ui, PingFang SC, sans-serif",
                    }}
                  >
                    wise-invest
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4 p-6 border-t border-border">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  复制图片
                </>
              )}
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="w-4 h-4 mr-2" />
              下载图片
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

