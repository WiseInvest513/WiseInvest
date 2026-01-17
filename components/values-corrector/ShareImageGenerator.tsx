"use client";

import { useRef, useMemo } from "react";
import { Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPng } from "html-to-image";
import { usdToCny } from "@/lib/utils/exchange-rates";
import type { AssetType } from "@/lib/asset-service";

interface ShareImageGeneratorProps {
  baseAsset: {
    symbol: string;
    name: string;
    type: AssetType;
    amount: number;
    priceUSD: number;
  };
  totalValueCNY: number;
}

// 所有可用的对比资产（排除基础资产本身）
const COMPARISON_ASSETS: Array<{
  symbol: string;
  name: string;
  priceUSD: number;
  icon: string;
}> = [
  { symbol: "BTC", name: "Bitcoin", priceUSD: 62500, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", priceUSD: 3200, icon: "Ξ" },
  { symbol: "SOL", name: "Solana", priceUSD: 150, icon: "◎" },
  { symbol: "BNB", name: "Binance Coin", priceUSD: 420, icon: "BNB" },
  { symbol: "OKB", name: "OKB", priceUSD: 45, icon: "OKB" },
  { symbol: "USD", name: "US Dollar", priceUSD: 1, icon: "💵" },
  { symbol: "AAPL", name: "Apple Inc.", priceUSD: 180, icon: "🍎" },
  { symbol: "MSFT", name: "Microsoft", priceUSD: 420, icon: "🪟" },
  { symbol: "GOOGL", name: "Alphabet", priceUSD: 140, icon: "🔍" },
  { symbol: "AMZN", name: "Amazon", priceUSD: 150, icon: "📦" },
  { symbol: "NVDA", name: "NVIDIA", priceUSD: 500, icon: "🎮" },
  { symbol: "META", name: "Meta", priceUSD: 480, icon: "👤" },
  { symbol: "TSLA", name: "Tesla", priceUSD: 250, icon: "🚗" },
  { symbol: "NDX", name: "Nasdaq 100", priceUSD: 18000, icon: "📊" },
  { symbol: "SPX", name: "S&P 500", priceUSD: 5200, icon: "📈" },
  { symbol: "DJI", name: "Dow Jones", priceUSD: 39000, icon: "📉" },
];

export function ShareImageGenerator({
  baseAsset,
  totalValueCNY,
}: ShareImageGeneratorProps) {
  const imageRef = useRef<HTMLDivElement>(null);

  // 计算基础资产的总价值（USD）
  const baseTotalUSD = baseAsset.amount * baseAsset.priceUSD;

  // 随机选择4个对比资产（价格低于当前总价值）
  const comparisonAssets = useMemo(() => {
    // 过滤出价格低于当前总价值的资产，并排除基础资产本身
    const available = COMPARISON_ASSETS.filter(
      (asset) =>
        asset.symbol !== baseAsset.symbol &&
        asset.priceUSD < baseTotalUSD &&
        asset.priceUSD > 0
    );

    // 随机打乱并取前4个
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [baseAsset.symbol, baseTotalUSD]);

  const currentDate = new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleGenerateImage = async () => {
    if (!imageRef.current) return;

    try {
      const dataUrl = await toPng(imageRef.current, {
        backgroundColor: "#000000",
        quality: 1.0,
        pixelRatio: 2,
        width: 1200,
        height: 800,
      });

      // 创建下载链接
      const link = document.createElement("a");
      link.download = `购买力校正-${baseAsset.symbol}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to generate image:", error);
      alert("生成图片失败，请重试");
    }
  };

  const baseIcon = COMPARISON_ASSETS.find((a) => a.symbol === baseAsset.symbol)?.icon || baseAsset.symbol.substring(0, 1);

  return (
    <div className="space-y-4">
      {/* 隐藏的图片模板 */}
      <div
        ref={imageRef}
        className="hidden"
        style={{
          width: "1200px",
          height: "800px",
          backgroundColor: "#000000",
          color: "#FFFFFF",
          padding: "60px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 顶部标题和日期 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "60px" }}>
          <h1 style={{ fontSize: "64px", fontWeight: "bold", color: "#FFFFFF", margin: 0 }}>
            价值观纠正器
          </h1>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "24px", color: "#FFFFFF", marginBottom: "8px" }}>
              {currentDate}
            </div>
            <div style={{ fontSize: "20px", color: "#FF9F0A" }}>
              https://github.com/wolfyxbt/ValuesCorrector
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div style={{ display: "flex", gap: "80px", alignItems: "flex-start", flex: 1 }}>
          {/* 左侧：基础资产 */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: "96px", fontWeight: "bold", color: "#FF9F0A", marginBottom: "20px" }}>
              {baseAsset.amount}
            </div>
            <div style={{ fontSize: "56px", fontWeight: "bold", color: "#FFFFFF" }}>
              ${baseAsset.symbol}
            </div>
            <div style={{ fontSize: "24px", color: "#999999", marginTop: "12px" }}>
              {baseAsset.name}
            </div>
          </div>

          {/* 右侧：换算结果 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 人民币换算（必须显示） */}
            <div style={{ fontSize: "36px", lineHeight: "1.5" }}>
              <span style={{ color: "#FFFFFF" }}>约等于≈ </span>
              <span style={{ color: "#FF9F0A", fontWeight: "bold" }}>
                ¥{totalValueCNY.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}
              </span>
              <span style={{ color: "#FFFFFF", marginLeft: "12px" }}>💰 CNY</span>
            </div>

            {/* 其他资产换算（随机4个） */}
            {comparisonAssets.map((asset, index) => {
              const equivalentAmount = baseTotalUSD / asset.priceUSD;

              return (
                <div key={index} style={{ fontSize: "36px", lineHeight: "1.5" }}>
                  <span style={{ color: "#FFFFFF" }}>约等于≈ </span>
                  <span style={{ color: "#FF9F0A", fontWeight: "bold" }}>
                    {equivalentAmount.toLocaleString("zh-CN", {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span style={{ color: "#FFFFFF", marginLeft: "12px" }}>
                    {asset.icon} ${asset.symbol}
                  </span>
                  <span style={{ color: "#999999", fontSize: "24px", marginLeft: "12px" }}>
                    ({asset.name})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 分享按钮 */}
      <Button
        onClick={handleGenerateImage}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        <Download className="w-4 h-4 mr-2" />
        生成并下载分享图片
      </Button>
    </div>
  );
}
