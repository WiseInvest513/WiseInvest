"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { assetService } from "@/lib/asset-service";
import type { SearchResult, AssetType } from "@/lib/asset-service";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  defaultType?: AssetType;
}

export function SearchModal({ isOpen, onClose, onSelect, defaultType }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<"all" | "crypto" | "stock">(
    defaultType === "crypto" ? "crypto" : defaultType === "stock" ? "stock" : "all"
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦搜索框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setIsSearching(false);
    }
  }, [isOpen]);

  // 搜索逻辑
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchAssets = async () => {
      setIsSearching(true);
      try {
        const promises: Promise<SearchResult[]>[] = [];

        // 并行搜索加密货币和股票
        if (searchType === "all" || searchType === "crypto") {
          promises.push(assetService.searchAssets(query, "crypto"));
        }

        if (searchType === "all" || searchType === "stock") {
          promises.push(assetService.searchAssets(query, "stock"));
        }

        const searchResults = await Promise.all(promises);
        const combined = searchResults.flat();
        setResults(combined);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchAssets, 300);
    return () => clearTimeout(timer);
  }, [query, searchType, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm h-[100dvh]">
      <Card className="w-full max-w-2xl bg-background border-border shadow-2xl max-h-[80vh] flex flex-col">
        <CardContent className="p-0 flex flex-col overflow-hidden">
          {/* 顶部搜索框 */}
          <div className="p-6 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">自定义代币搜索</h2>
              <button
                onClick={onClose}
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted rounded-lg transition-colors touch-manipulation"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 搜索类型选择 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSearchType("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setSearchType("crypto")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "crypto"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                加密货币
              </button>
              <button
                onClick={() => setSearchType("stock")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchType === "stock"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                股票
              </button>
            </div>

            {/* 大号搜索输入框 */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入代币名称或美股代码..."
                className="pl-12 h-12 text-base text-[16px]"
                autoFocus
              />
            </div>
          </div>

          {/* 搜索结果列表 */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {isSearching && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">搜索中...</span>
              </div>
            )}

            {!isSearching && query && results.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>未找到相关资产</p>
                <p className="text-sm mt-1">请尝试其他关键词</p>
              </div>
            )}

            {!isSearching && !query && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>输入代币名称或美股代码开始搜索</p>
              </div>
            )}

            {!isSearching &&
              results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => onSelect(result)}
                  className="w-full p-4 rounded-lg border border-border hover:bg-muted hover:border-primary/50 transition-all text-left mb-2 last:mb-0"
                >
                  <div className="flex items-center gap-4">
                    {/* Logo/Icon */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-mono font-bold flex-shrink-0">
                      {result.symbol.substring(0, 2)}
                    </div>

                    {/* Symbol + Name */}
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground mb-1">
                        {result.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {result.name}
                        {result.exchange && ` · ${result.exchange}`}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        result.type === "crypto"
                          ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                          : result.type === "stock"
                          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                          : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      }`}
                    >
                      {result.type === "crypto" ? "Crypto" : result.type === "stock" ? "Stock" : "Index"}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
