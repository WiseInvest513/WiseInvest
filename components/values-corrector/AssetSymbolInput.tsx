"use client";

import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchModal } from "./SearchModal";
import type { AssetType, SearchResult } from "@/lib/asset-service";

interface AssetSymbolInputProps {
  value: string;
  assetType: AssetType;
  onSelect: (symbol: string, type: AssetType, name?: string) => void;
  placeholder?: string;
}

// 预设资产（根据类型）
const PRESET_ASSETS: Record<AssetType, { symbol: string; name: string; icon: string }[]> = {
  crypto: [
    { symbol: "BTC", name: "Bitcoin", icon: "₿" },
    { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
    { symbol: "SOL", name: "Solana", icon: "◎" },
    { symbol: "BNB", name: "Binance Coin", icon: "BNB" },
    { symbol: "OKB", name: "OKB", icon: "OKB" },
  ],
  stock: [
    { symbol: "AAPL", name: "Apple Inc.", icon: "🍎" },
    { symbol: "MSFT", name: "Microsoft Corporation", icon: "🪟" },
    { symbol: "GOOGL", name: "Alphabet Inc.", icon: "🔍" },
    { symbol: "AMZN", name: "Amazon.com Inc.", icon: "📦" },
    { symbol: "NVDA", name: "NVIDIA Corporation", icon: "🎮" },
    { symbol: "META", name: "Meta Platforms Inc.", icon: "👤" },
    { symbol: "TSLA", name: "Tesla Inc.", icon: "🚗" },
  ],
  index: [
    { symbol: "NDX", name: "Nasdaq 100", icon: "📊" },
    { symbol: "SPX", name: "S&P 500", icon: "📈" },
    { symbol: "DJI", name: "Dow Jones", icon: "📉" },
  ],
};

export function AssetSymbolInput({
  value,
  assetType,
  onSelect,
  placeholder = "输入资产代码或名称...",
}: AssetSymbolInputProps) {
  // 所有 Hooks 必须在组件顶部调用
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showIndexDropdown, setShowIndexDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 点击外部关闭下拉（仅用于指数类型）
  useEffect(() => {
    if (assetType !== "index" || !showIndexDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowIndexDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showIndexDropdown, assetType]);

  const presets = PRESET_ASSETS[assetType] || [];
  const filteredPresets = presets.filter(
    (p) =>
      p.symbol.toLowerCase().includes(inputValue.toLowerCase()) ||
      p.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0);

    // 如果输入的是预设资产，直接选择
    const matchedPreset = presets.find(
      (p) => p.symbol.toUpperCase() === newValue.toUpperCase()
    );
    if (matchedPreset) {
      onSelect(matchedPreset.symbol, assetType, matchedPreset.name);
      setShowSuggestions(false);
    }
  };

  const handlePresetSelect = (preset: typeof presets[0]) => {
    onSelect(preset.symbol, assetType, preset.name);
    setInputValue(preset.symbol);
    setShowSuggestions(false);
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handleCustomSelect = (result: SearchResult) => {
    onSelect(result.symbol, result.type, result.name);
    setInputValue(result.symbol);
    setShowSearchModal(false);
  };

  // 如果是指数类型，只显示下拉选择器，不允许搜索
  if (assetType === "index") {
    const selectedPreset = presets.find((p) => p.symbol === value) || presets[0];

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          onClick={() => setShowIndexDropdown(!showIndexDropdown)}
          className="w-full h-11 justify-between font-mono transition-all hover:bg-muted/80 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{selectedPreset.icon}</span>
            <span>{selectedPreset.symbol}</span>
            <span className="text-muted-foreground text-sm font-normal">
              {selectedPreset.name}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 opacity-50 transition-transform ${showIndexDropdown ? "rotate-180" : ""}`} />
        </Button>

        {showIndexDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
            <div className="p-1">
              {presets.map((preset) => (
                <button
                  key={preset.symbol}
                  onClick={() => {
                    handlePresetSelect(preset);
                    setShowIndexDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">{preset.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{preset.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 对于加密货币和美股，显示输入框和搜索功能
  return (
    <>
      <div className="relative">
        <div className="relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            placeholder={placeholder}
            className="font-mono h-11 pr-10 text-[16px]"
          />
          <button
            onClick={handleSearchClick}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
            title="搜索资产"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 预设建议下拉 */}
        {showSuggestions && filteredPresets.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto">
            <div className="p-1">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.symbol}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{preset.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {preset.name}
                    </div>
                  </div>
                </button>
              ))}
              <div className="border-t border-border my-1" />
              <button
                onClick={handleSearchClick}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-muted transition-colors flex items-center gap-3 text-primary"
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">🔍 搜索更多资产...</span>
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
          defaultType={assetType}
        />
      )}
    </>
  );
}

