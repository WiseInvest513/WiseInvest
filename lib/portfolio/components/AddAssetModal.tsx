"use client";

/**
 * Add Asset Modal - Interaction Component
 * 添加资产模态框：搜索、选择、输入详情
 */

import { useState, useEffect } from "react";
import { X, Search, Coins, BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assetService, evaluateMathExpression } from "@/lib/asset-service";
import type { AssetType, SearchResult } from "../types";
import type { Asset } from "../types";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (asset: Asset) => void;
}

export function AddAssetModal({ isOpen, onClose, onAdd }: AddAssetModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<AssetType>("crypto");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [practiceLink, setPracticeLink] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // 防抖搜索
  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await assetService.searchAssets(searchQuery, searchType);
        setSearchResults(results);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, isOpen]);

  // 选择资产后获取当前价格
  const handleSelectAsset = async (asset: SearchResult) => {
    setSelectedAsset(asset);
    setIsLoadingPrice(true);
    try {
      const priceResult = await assetService.getPrice(asset.symbol, asset.type);
      if (priceResult) {
        setCurrentPrice(priceResult.price);
        setAvgPrice(priceResult.price.toFixed(2));
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // 提交表单
  const handleSubmit = () => {
    if (!selectedAsset || !amount || !avgPrice) return;

    const amountNum = evaluateMathExpression(amount);
    const avgPriceNum = parseFloat(avgPrice);

    if (isNaN(amountNum) || isNaN(avgPriceNum) || amountNum <= 0 || avgPriceNum <= 0) {
      alert("请输入有效的数量和价格");
      return;
    }

    const newAsset: Asset = {
      id: `${selectedAsset.symbol}-${Date.now()}`,
      symbol: selectedAsset.symbol,
      name: selectedAsset.name,
      type: selectedAsset.type,
      amount: amountNum,
      avgPrice: avgPriceNum,
      practiceLink: practiceLink.trim() || undefined,
      addedAt: Date.now(),
    };

    onAdd(newAsset);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedAsset(null);
    setAmount("");
    setAvgPrice("");
    setPracticeLink("");
    setCurrentPrice(null);
    setSearchResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-amber-500/20 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif font-bold text-white">添加资产</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!selectedAsset ? (
            // 搜索阶段
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">资产类型</Label>
                <div className="flex gap-2">
                  {(['crypto', 'stock', 'index'] as AssetType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSearchType(type);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        searchType === type
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {type === 'crypto' ? '加密货币' : type === 'stock' ? '股票' : '指数'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">搜索资产</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchType === 'index' ? '选择指数...' : `搜索${searchType === 'crypto' ? '加密货币' : '股票'}...`}
                    className="pl-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

              {searchType === 'index' && searchQuery === '' && (
                <div className="space-y-2">
                  {['NDX', 'SPX', 'DJI'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => handleSelectAsset({ symbol, name: symbol === 'NDX' ? 'Nasdaq 100' : symbol === 'SPX' ? 'S&P 500' : 'Dow Jones', type: 'index' })}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                          {symbol}
                        </div>
                        <div>
                          <div className="text-white font-medium">{symbol === 'NDX' ? 'Nasdaq 100' : symbol === 'SPX' ? 'S&P 500' : 'Dow Jones'}</div>
                          <div className="text-xs text-gray-400">指数</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAsset(result)}
                      className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                          {result.symbol}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{result.name}</div>
                          <div className="text-xs text-gray-400">
                            {result.symbol} · {result.type === 'crypto' ? '加密货币' : result.type === 'stock' ? '股票' : '指数'}
                            {result.exchange && ` · ${result.exchange}`}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          result.type === 'crypto' ? 'bg-amber-500/20 text-amber-400' :
                          result.type === 'stock' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {result.type === 'crypto' ? 'Crypto' : result.type === 'stock' ? 'Stock' : 'Index'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isSearching && (
                <div className="text-center text-gray-400 py-4">搜索中...</div>
              )}
            </div>
          ) : (
            // 表单阶段
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-mono font-bold text-amber-400">
                    {selectedAsset.symbol}
                  </div>
                  <div>
                    <div className="text-white font-medium">{selectedAsset.name}</div>
                    <div className="text-xs text-gray-400">{selectedAsset.symbol}</div>
                  </div>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    更改
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">持有数量</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="例如: 10000/150 或 0.5"
                  className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 font-mono"
                />
                <div className="text-xs text-gray-400 mt-1">支持数学表达式，如: 10000/150</div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">平均买入价格</Label>
                <div className="relative">
                  <Input
                    value={avgPrice}
                    onChange={(e) => setAvgPrice(e.target.value)}
                    placeholder="自动填充当前价格"
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 font-mono"
                  />
                  {isLoadingPrice && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      加载中...
                    </div>
                  )}
                  {currentPrice && !isLoadingPrice && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                      当前: ${currentPrice.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">实践链接 (可选)</Label>
                <Input
                  value={practiceLink}
                  onChange={(e) => setPracticeLink(e.target.value)}
                  placeholder="推文 URL 或其他链接"
                  className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 bg-white/5 border-gray-700 text-gray-300 hover:bg-white/10"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  添加资产
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

