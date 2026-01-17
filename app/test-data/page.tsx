"use client";

import { useState } from "react";

interface TestResult {
  source: string;
  url: string;
  status: 'success' | 'timeout' | 'error' | 'cors';
  statusCode?: number;
  responseTime: number;
  price?: number;
  error?: string;
}

interface DebugResponse {
  symbol: string;
  timestamp: number;
  results: TestResult[];
  summary: {
    total: number;
    success: number;
    timeout: number;
    error: number;
    cors: number;
    avgPrice: number | null;
    medianPrice: number | null;
    prices: number[];
  };
}

interface LogEntry {
  id: number;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function TestDataPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DebugResponse | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, 'success' | 'error'>>({});

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      message,
      type,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
    setResults(null);
    setStatusMap({});
  };

  const testSymbol = async (symbol: string) => {
    setIsLoading(true);
    clearLogs();
    addLog(`开始测试 ${symbol}...`, 'info');
    addLog('正在连接本地 API...', 'info');

    try {
      const startTime = Date.now();
      const response = await fetch(`/api/debug-price?symbol=${symbol}`);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json();
        addLog(`API 响应错误: ${response.status} - ${errorData.error}`, 'error');
        setIsLoading(false);
        return;
      }

      const data: DebugResponse = await response.json();
      setResults(data);

      addLog(`本地 API 响应: ${response.status} OK (${duration}ms)`, 'success');

      // 处理每个数据源的结果
      data.results.forEach((result) => {
        const statusKey = result.source.toLowerCase();
        
        if (result.status === 'success') {
          setStatusMap((prev) => ({ ...prev, [statusKey]: 'success' }));
          addLog(
            `${result.source} 响应: ${result.statusCode} OK (${result.responseTime}ms) - 价格: $${result.price?.toFixed(2)}`,
            'success'
          );
        } else if (result.status === 'timeout') {
          setStatusMap((prev) => ({ ...prev, [statusKey]: 'error' }));
          addLog(`${result.source} 响应: Timeout (${result.responseTime}ms)`, 'error');
        } else if (result.status === 'cors') {
          setStatusMap((prev) => ({ ...prev, [statusKey]: 'error' }));
          addLog(`${result.source} 响应: CORS Error`, 'error');
        } else {
          setStatusMap((prev) => ({ ...prev, [statusKey]: 'error' }));
          addLog(
            `${result.source} 响应: ${result.statusCode || 'Error'} - ${result.error || '未知错误'}`,
            'error'
          );
        }
      });

      // 显示比对结果
      if (data.summary.avgPrice) {
        addLog(
          `最终比对结果: 平均价格 $${data.summary.avgPrice.toFixed(2)} (中位数: $${data.summary.medianPrice?.toFixed(2) || 'N/A'})`,
          data.summary.success > 0 ? 'success' : 'warning'
        );
      } else {
        addLog('最终比对结果: 所有数据源均失败，无法获取价格', 'error');
      }

      addLog(
        `测试完成: ${data.summary.success}/${data.summary.total} 成功, ${data.summary.timeout} 超时, ${data.summary.error} 错误, ${data.summary.cors} CORS`,
        data.summary.success > 0 ? 'success' : 'error'
      );
    } catch (error: any) {
      addLog(`网络错误: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (source: string): string => {
    const status = statusMap[source.toLowerCase()];
    if (status === 'success') return 'bg-green-500';
    if (status === 'error') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getLogColor = (type: LogEntry['type']): string => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-green-500/30 pb-4">
          <h1 className="text-3xl font-bold mb-2">🔍 网络诊断工具</h1>
          <p className="text-green-400/60 text-sm">
            测试本地 Node.js 环境对各数据源的网络连通性
          </p>
        </div>

        {/* Control Panel */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => testSymbol('BTC')}
              disabled={isLoading}
              className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
            >
              [测试 BTC]
            </button>
            <button
              onClick={() => testSymbol('OKB')}
              disabled={isLoading}
              className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
            >
              [测试 OKB]
            </button>
            <button
              onClick={() => testSymbol('QQQ')}
              disabled={isLoading}
              className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
            >
              [测试 QQQ]
            </button>
            <button
              onClick={clearLogs}
              disabled={isLoading}
              className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono"
            >
              [清除日志]
            </button>
          </div>

          {/* Status Panel */}
          <div className="grid grid-cols-3 gap-4">
            {['coinpaprika', 'binance', 'okx'].map((source) => (
              <div
                key={source}
                className="flex items-center gap-3 p-4 bg-gray-900/50 border border-gray-700 rounded"
              >
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(source)} transition-colors`}
                />
                <span className="text-sm uppercase">{source}</span>
                {statusMap[source] === 'success' && (
                  <span className="text-xs text-green-400 ml-auto">✓</span>
                )}
                {statusMap[source] === 'error' && (
                  <span className="text-xs text-red-400 ml-auto">✗</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Log Display */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 border-b border-green-500/30 pb-2">
            📋 实时日志
          </h2>
          <div className="bg-gray-900/50 border border-gray-700 rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                等待测试开始...
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`${getLogColor(log.type)} flex items-start gap-2`}
                  >
                    <span className="text-gray-500 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-green-400 animate-pulse">
                    <span className="text-gray-500 text-xs">
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span className="ml-2">正在测试...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {results && (
          <div className="bg-gray-900/50 border border-gray-700 rounded p-4">
            <h2 className="text-xl font-bold mb-4 border-b border-green-500/30 pb-2">
              📊 测试结果摘要
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">总数据源</div>
                <div className="text-2xl font-bold text-green-400">
                  {results.summary.total}
                </div>
              </div>
              <div>
                <div className="text-gray-400">成功</div>
                <div className="text-2xl font-bold text-green-400">
                  {results.summary.success}
                </div>
              </div>
              <div>
                <div className="text-gray-400">超时</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {results.summary.timeout}
                </div>
              </div>
              <div>
                <div className="text-gray-400">错误</div>
                <div className="text-2xl font-bold text-red-400">
                  {results.summary.error + results.summary.cors}
                </div>
              </div>
            </div>
            {results.summary.avgPrice && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-gray-400 mb-2">价格比对</div>
                <div className="space-y-1">
                  <div>
                    平均价格: <span className="text-green-400 font-bold">${results.summary.avgPrice.toFixed(2)}</span>
                  </div>
                  {results.summary.medianPrice && (
                    <div>
                      中位数价格: <span className="text-green-400 font-bold">${results.summary.medianPrice.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    价格列表: {results.summary.prices.map(p => `$${p.toFixed(2)}`).join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

