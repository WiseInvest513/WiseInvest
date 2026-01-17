"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchModal } from "./SearchModal";
import type { AssetType, SearchResult } from "@/lib/asset-service";

interface AssetSelectProps {
  value: string;
  assetType: AssetType;
  onSelect: (symbol: string, type: AssetType, name?: string) => void;
}

const PRESET_ASSETS = [
  { symbol: "BTC", type: "crypto" as AssetType, name: "Bitcoin", icon: "₿", emoji: "🟠" },
  { symbol: "ETH", type: "crypto" as AssetType, name: "Ethereum", icon: "Ξ", emoji: "🔵" },
  { symbol: "SOL", type: "crypto" as AssetType, name: "Solana", icon: "◎", emoji: "🟣" },
  { symbol: "BNB", type: "crypto" as AssetType, name: "Binance Coin", icon: "BNB", emoji: "🟡" },
  { symbol: "OKB", type: "crypto" as AssetType, name: "OKB", icon: "OKB", emoji: "🔴" },
  { symbol: "USD", type: "crypto" as AssetType, name: "US Dollar", icon: "$", emoji: "💵" },
  { symbol: "CNY", type: "crypto" as AssetType, name: "Chinese Yuan", icon: "¥", emoji: "💰" },
];

export function AssetSelect({ value, assetType, onSelect }: AssetSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedAsset = PRESET_ASSETS.find(a => a.symbol === value) || {
    symbol: value,
    type: assetType,
    name: value,
    icon: value.substring(0, 1),
    emoji: "🔷",
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePresetSelect = (asset: typeof PRESET_ASSETS[0]) => {
    onSelect(asset.symbol, asset.type, asset.name);
    setIsOpen(false);
  };

  const handleCustomAssetClick = () => {
    setIsOpen(false);
    setShowSearchModal(true);
  };

  const handleCustomSelect = (result: SearchResult) => {
    onSelect(result.symbol, result.type, result.name);
    setShowSearchModal(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-11"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl">{selectedAsset.emoji || selectedAsset.icon}</span>
            <span className="font-medium">{selectedAsset.symbol}</span>
            {selectedAsset.name !== selectedAsset.symbol && (
              <span className="text-muted-foreground text-sm hidden sm:inline">
                {selectedAsset.name}
              </span>
            )}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[400px] overflow-hidden">
            <div className="p-1 overflow-y-auto max-h-[400px]">
              {PRESET_ASSETS.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => handlePresetSelect(asset)}
                  className={`w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3 ${
                    value === asset.symbol ? "bg-muted" : ""
                  }`}
                >
                  <span className="text-xl">{asset.emoji || asset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {asset.name}
                    </div>
                  </div>
                </button>
              ))}
              
              {/* 分隔线 */}
              <div className="border-t border-border my-1" />
              
              {/* 自定义代币选项 */}
              <button
                onClick={handleCustomAssetClick}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3 text-primary"
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">🔍 自定义代币</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showSearchModal && (
        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelect={handleCustomSelect}
        />
      )}
    </>
  );
}
