"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, TrendingUp, Zap, Coins, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openSafeExternalUrl } from "@/lib/security/external-links";

interface ExchangeAirdropItem {
  id: string;
  exchange: 'Binance' | 'OKX';
  title: string;
  tokenSymbol: string;
  link: string;
  pubDate: string;
  type: 'Launchpool' | 'Megadrop' | 'Jumpstart' | 'Listing';
}

const getTypeColor = (type: ExchangeAirdropItem['type']) => {
  switch (type) {
    case 'Launchpool':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Megadrop':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Jumpstart':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Listing':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getTypeIcon = (type: ExchangeAirdropItem['type']) => {
  switch (type) {
    case 'Launchpool':
      return <Coins className="h-4 w-4" />;
    case 'Megadrop':
      return <Zap className="h-4 w-4" />;
    case 'Jumpstart':
      return <TrendingUp className="h-4 w-4" />;
    case 'Listing':
      return <ExternalLink className="h-4 w-4" />;
    default:
      return <Coins className="h-4 w-4" />;
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? '刚刚' : `${diffMins} 分钟前`;
      }
      return `${diffHours} 小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  } catch {
    return dateString;
  }
};

export function ExchangeAirdrop() {
  const [items, setItems] = useState<ExchangeAirdropItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/airdrop/exchange');
      const result = await response.json();

      if (result.success) {
        setItems(result.data);
        setLastUpdate(new Date());
      } else {
        setError(result.error || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败');
      console.error('Failed to fetch exchange airdrops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl mb-1">交易所空投追踪</CardTitle>
              <p className="text-sm text-slate-600">
                实时监控 Binance Launchpool/Megadrop 和 OKX Jumpstart 公告
              </p>
            </div>
            <Button
              onClick={fetchData}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </>
              )}
            </Button>
          </div>
          {lastUpdate && (
            <p className="text-xs text-slate-500 mt-2">
              最后更新: {lastUpdate.toLocaleTimeString('zh-CN')}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 text-yellow-400 animate-spin mb-4" />
          <p className="text-slate-600">正在获取最新空投信息...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-red-800 font-medium">获取数据失败</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Airdrop List */}
      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="border-slate-200 hover:border-yellow-400 transition-all hover:shadow-md"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header Row */}
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(
                          item.type
                        )}`}
                      >
                        {getTypeIcon(item.type)}
                        {item.type}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.exchange === 'Binance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.exchange}
                      </span>
                      {item.tokenSymbol && (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                          {item.tokenSymbol}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Date */}
                    <p className="text-xs text-slate-500">
                      {formatDate(item.pubDate)}
                    </p>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => openSafeExternalUrl(item.link)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-black shrink-0"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    查看详情
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && items.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Coins className="h-16 w-16 text-slate-300 mb-4" />
              <p className="text-lg font-semibold text-slate-900 mb-2">
                暂无空投信息
              </p>
              <p className="text-sm text-slate-500">
                当前没有新的 Launchpool、Megadrop 或 Jumpstart 活动
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

