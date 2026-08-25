import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { HttpsProxyAgent } from 'https-proxy-agent';

export const dynamic = 'force-dynamic'; // Prevent static caching

// --- CONFIGURATION ---
// ⚠️ IMPORTANT: Change this port if your proxy is not 7890 (e.g., 7897, 10809)
// Priority: Environment variable > Default port 7890
const getProxyUrl = (): string => {
  const envProxy = process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY;
  if (envProxy) {
    logger.log(`[ROI API] Using proxy from environment: ${envProxy}`);
    return envProxy;
  }
  // Default to 7890, but user can override via env vars
  const defaultProxy = 'http://127.0.0.1:7890';
  logger.log(`[ROI API] Using default proxy: ${defaultProxy}`);
  return defaultProxy;
};

const LOCAL_PROXY = getProxyUrl();

// Mapping IDs to Ticker Symbols
const ASSET_MAP: Record<string, { binance: string; coincap: string }> = {
  btc: { binance: 'BTCUSDT', coincap: 'bitcoin' },
  eth: { binance: 'ETHUSDT', coincap: 'ethereum' },
  sol: { binance: 'SOLUSDT', coincap: 'solana' },
  qqq: { binance: '', coincap: '' }, // QQQ not available on crypto APIs
};

const USD_TO_CNY = 7.3;

// Fallback data only for QQQ (not available on crypto APIs)
const FALLBACK_DATA: Record<string, Record<number, number>> = {
  qqq: {
    1: 400,
    3: 280,
    5: 210,
    10: 100,
  },
};

const FALLBACK_CURRENT_PRICES: Record<string, number> = {
  qqq: 500,
};

// Helper function to get high-resolution time (works in both browser and Node.js)
const getTime = () => {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  // Fallback for Node.js environments without performance API
  return Date.now();
};

export async function GET(request: Request) {
  const requestStartTime = getTime();
  const requestId = Math.random().toString(36).substring(7);
  
  logger.log(`\n🔵 [ROI API] ========== 请求开始 [${requestId}] ==========`);
  logger.log(`⏰ [ROI API] 请求时间: ${new Date().toISOString()}`);
  
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || 'btc';
  const years = parseInt(searchParams.get('years') || '1');
  const useFallback = searchParams.get('useFallback') === 'true';

  logger.log(`📋 [ROI API] 请求参数:`, {
    id,
    years,
    useFallback,
    url: request.url,
  });

  // Handle QQQ (not available on crypto APIs)
  if (id === 'qqq') {
    logger.log(`📌 [ROI API] 处理 QQQ 资产（使用备用数据）`);
    if (useFallback) {
      const historyPrice = FALLBACK_DATA[id]?.[years];
      const currentPrice = FALLBACK_CURRENT_PRICES[id];
      
      if (!historyPrice) {
        return NextResponse.json(
          { error: 'Asset did not exist then', currentPrice: currentPrice || 0 },
          { status: 200 }
        );
      }
      
      return NextResponse.json({
        currentPrice: currentPrice || 0,
        historyPrice: historyPrice,
        fallback: true,
        source: 'Fallback',
      });
    }
    return NextResponse.json(
      { error: 'QQQ is not available on cryptocurrency APIs. Use fallback mode.' },
      { status: 400 }
    );
  }

  const symbol = ASSET_MAP[id];
  if (!symbol || !symbol.binance) {
    return NextResponse.json({ error: 'Invalid Asset ID' }, { status: 400 });
  }

  // Time Calculation
  const now = Date.now();
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - years);
  const startTime = pastDate.getTime();
  const endTime = startTime + 86400000; // +1 day window

  let errorLog: string[] = [];

  // Create Proxy Agent (Force traffic through local proxy)
  const proxyAgent = new HttpsProxyAgent(LOCAL_PROXY);
  logger.log(`[ROI API] 🔧 Proxy Agent created for: ${LOCAL_PROXY}`);

  // Define custom fetch options with the agent
  const fetchOptions: RequestInit = {
    // @ts-ignore - node-fetch types mismatch with Next.js fetch, but 'agent' works in Node env
    agent: proxyAgent,
    cache: 'no-store',
  };

  // --- STRATEGY 1: BINANCE API (Best Data) ---
  logger.log(`\n🟢 [ROI API] ========== 策略 1: Binance API ==========`);
  logger.log(`[ROI API] 🔄 Fetching REAL DATA via Proxy (${LOCAL_PROXY})...`);
  const binanceStartTime = getTime();
  
  try {
    logger.log(`⏰ [ROI API] Binance 请求开始时间: ${new Date().toISOString()}`);
    logger.log(`📊 [ROI API] Binance 请求参数:`, {
      symbol: symbol.binance,
      startTime,
      startTimeDate: new Date(startTime).toISOString(),
      years,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.log(`⏱️ [ROI API] Binance 请求超时（5秒）`);
      controller.abort();
    }, 5000); // 5 second timeout

    // Add abort signal to fetch options
    const binanceFetchOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
    };

    const currentUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.binance}`;
    const historyUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol.binance}&interval=1d&startTime=${startTime}&limit=1`;
    
    logger.log(`🌐 [ROI API] Binance 当前价格 URL: ${currentUrl}`);
    logger.log(`🌐 [ROI API] Binance 历史价格 URL: ${historyUrl}`);
    
    const fetchStartTime = getTime();
    logger.log(`⏱️ [ROI API] Binance 开始并行请求...`);
    
    const [currentRes, historyRes] = await Promise.all([
      fetch(currentUrl, fetchOptions),
      fetch(historyUrl, fetchOptions),
    ]);

    const fetchEndTime = getTime();
    const fetchDuration = fetchEndTime - fetchStartTime;
    
    clearTimeout(timeoutId);
    
    logger.log(`⏱️ [ROI API] Binance 请求完成，耗时: ${fetchDuration.toFixed(2)}ms`);
    logger.log(`📡 [ROI API] Binance 响应状态:`, {
      currentStatus: currentRes.status,
      currentOk: currentRes.ok,
      historyStatus: historyRes.status,
      historyOk: historyRes.ok,
    });

    if (!currentRes.ok) {
      const errorText = await currentRes.text().catch(() => '无法读取错误信息');
      console.error(`❌ [ROI API] Binance 当前价格 API 失败:`, {
        status: currentRes.status,
        statusText: currentRes.statusText,
        errorText,
      });
      throw new Error(`Binance Current Price API: HTTP ${currentRes.status} ${currentRes.statusText}`);
    }
    if (!historyRes.ok) {
      const errorText = await historyRes.text().catch(() => '无法读取错误信息');
      console.error(`❌ [ROI API] Binance 历史价格 API 失败:`, {
        status: historyRes.status,
        statusText: historyRes.statusText,
        errorText,
      });
      throw new Error(`Binance History API: HTTP ${historyRes.status} ${historyRes.statusText}`);
    }

    const parseStartTime = getTime();
    const currentData = await currentRes.json();
    const historyData = await historyRes.json();
    const parseEndTime = getTime();
    const parseDuration = parseEndTime - parseStartTime;
    
    logger.log(`⏱️ [ROI API] Binance JSON 解析完成，耗时: ${parseDuration.toFixed(2)}ms`);
    logger.log(`📦 [ROI API] Binance 原始数据:`, {
      currentData,
      historyDataLength: historyData?.length,
      historyDataFirst: historyData?.[0],
    });

    // Binance Kline format: [timestamp, open, high, low, close, volume, ...]
    // We use 'Open' price (index 1) for historical price
    const historyPrice = parseFloat(historyData[0]?.[1]);
    const currentPrice = parseFloat(currentData.price);

    logger.log(`💰 [ROI API] Binance 解析后的价格:`, {
      currentPrice,
      historyPrice,
      currentPriceRaw: currentData.price,
      historyPriceRaw: historyData[0]?.[1],
    });

    if (!historyPrice || isNaN(historyPrice) || historyPrice === 0) {
      console.error(`❌ [ROI API] Binance 历史价格无效:`, {
        historyPrice,
        historyData: historyData[0],
        years,
      });
      throw new Error('Binance returned empty or invalid history data (Asset likely didn\'t exist at that time)');
    }

    if (!currentPrice || isNaN(currentPrice) || currentPrice === 0) {
      console.error(`❌ [ROI API] Binance 当前价格无效:`, {
        currentPrice,
        currentData,
      });
      throw new Error('Binance returned empty or invalid current price');
    }

    const binanceEndTime = getTime();
    const binanceDuration = binanceEndTime - binanceStartTime;
    
    logger.log(`✅ [ROI API] Binance 成功 - 当前 USD: ${currentPrice}, 历史 USD: ${historyPrice}`);
    logger.log(`⏱️ [ROI API] Binance 总耗时: ${binanceDuration.toFixed(2)}ms`);

    const response = {
      currentPrice: currentPrice * USD_TO_CNY,
      historyPrice: historyPrice * USD_TO_CNY,
      source: 'Binance (Live)',
    };
    
    const totalTime = getTime() - requestStartTime;
    logger.log(`✅ [ROI API] ========== 请求成功 [${requestId}] ==========`);
    logger.log(`⏱️ [ROI API] 总耗时: ${totalTime.toFixed(2)}ms`);
    logger.log(`📊 [ROI API] 返回数据:`, response);

    return NextResponse.json(response);
  } catch (e: any) {
    const binanceEndTime = getTime();
    const binanceDuration = binanceEndTime - binanceStartTime;
    
    const errorMsg = e.name === 'AbortError' 
      ? 'Binance API: Connection Timeout (5s)' 
      : `Binance API: ${e.message}`;
    
    console.error(`❌ [ROI API] Binance 失败，耗时: ${binanceDuration.toFixed(2)}ms`);
    console.error(`❌ [ROI API] Binance 错误详情:`, {
      name: e.name,
      message: e.message,
      stack: e.stack,
      error: e,
    });
    
    errorLog.push(errorMsg);
  }

  // --- STRATEGY 2: COINCAP API (Backup) ---
  logger.log(`\n🟡 [ROI API] ========== 策略 2: CoinCap API ==========`);
  logger.log(`[ROI API] 🔄 Switching to CoinCap via Proxy (${LOCAL_PROXY})...`);
  const coincapStartTime = getTime();
  
  try {
    logger.log(`⏰ [ROI API] CoinCap 请求开始时间: ${new Date().toISOString()}`);
    logger.log(`📊 [ROI API] CoinCap 请求参数:`, {
      symbol: symbol.coincap,
      startTime,
      endTime,
      startTimeDate: new Date(startTime).toISOString(),
      endTimeDate: new Date(endTime).toISOString(),
      years,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.log(`⏱️ [ROI API] CoinCap 请求超时（5秒）`);
      controller.abort();
    }, 5000); // 5 second timeout

    // Add abort signal to fetch options
    const coincapFetchOptions: RequestInit = {
      ...fetchOptions,
      signal: controller.signal,
    };

    const currentUrl = `https://api.coincap.io/v2/assets/${symbol.coincap}`;
    const historyUrl = `https://api.coincap.io/v2/assets/${symbol.coincap}/history?interval=d1&start=${startTime}&end=${endTime}`;
    
    logger.log(`🌐 [ROI API] CoinCap 当前价格 URL: ${currentUrl}`);
    logger.log(`🌐 [ROI API] CoinCap 历史价格 URL: ${historyUrl}`);
    
    const fetchStartTime = getTime();
    logger.log(`⏱️ [ROI API] CoinCap 开始并行请求...`);
    
    const [currentRes, historyRes] = await Promise.all([
      fetch(currentUrl, coincapFetchOptions),
      fetch(historyUrl, coincapFetchOptions),
    ]);

    const fetchEndTime = getTime();
    const fetchDuration = fetchEndTime - fetchStartTime;
    
    clearTimeout(timeoutId);
    
    logger.log(`⏱️ [ROI API] CoinCap 请求完成，耗时: ${fetchDuration.toFixed(2)}ms`);
    logger.log(`📡 [ROI API] CoinCap 响应状态:`, {
      currentStatus: currentRes.status,
      currentOk: currentRes.ok,
      historyStatus: historyRes.status,
      historyOk: historyRes.ok,
    });

    if (!currentRes.ok) {
      const errorText = await currentRes.text().catch(() => '无法读取错误信息');
      console.error(`❌ [ROI API] CoinCap 当前价格 API 失败:`, {
        status: currentRes.status,
        statusText: currentRes.statusText,
        errorText,
      });
      throw new Error(`CoinCap Current Price API: HTTP ${currentRes.status} ${currentRes.statusText}`);
    }
    if (!historyRes.ok) {
      const errorText = await historyRes.text().catch(() => '无法读取错误信息');
      console.error(`❌ [ROI API] CoinCap 历史价格 API 失败:`, {
        status: historyRes.status,
        statusText: historyRes.statusText,
        errorText,
      });
      throw new Error(`CoinCap History API: HTTP ${historyRes.status} ${historyRes.statusText}`);
    }

    const parseStartTime = getTime();
    const currentJson = await currentRes.json();
    const historyJson = await historyRes.json();
    const parseEndTime = getTime();
    const parseDuration = parseEndTime - parseStartTime;
    
    logger.log(`⏱️ [ROI API] CoinCap JSON 解析完成，耗时: ${parseDuration.toFixed(2)}ms`);
    logger.log(`📦 [ROI API] CoinCap 原始数据:`, {
      currentJson: currentJson.data ? { id: currentJson.data.id, priceUsd: currentJson.data.priceUsd } : currentJson,
      historyDataLength: historyJson.data?.length,
      historyDataFirst: historyJson.data?.[0],
    });

    const currentUsd = parseFloat(currentJson.data?.priceUsd || '0');
    const historyData = historyJson.data;
    const historyUsd =
      historyData && historyData.length > 0 ? parseFloat(historyData[0]?.priceUsd || '0') : 0;

    logger.log(`💰 [ROI API] CoinCap 解析后的价格:`, {
      currentUsd,
      historyUsd,
      currentPriceRaw: currentJson.data?.priceUsd,
      historyPriceRaw: historyData?.[0]?.priceUsd,
    });

    if (!historyUsd || isNaN(historyUsd) || historyUsd === 0) {
      console.error(`❌ [ROI API] CoinCap 历史价格无效:`, {
        historyUsd,
        historyData: historyData?.[0],
        historyDataLength: historyData?.length,
        years,
      });
      throw new Error('CoinCap returned empty or invalid history data (Asset likely didn\'t exist at that time)');
    }

    if (!currentUsd || isNaN(currentUsd) || currentUsd === 0) {
      console.error(`❌ [ROI API] CoinCap 当前价格无效:`, {
        currentUsd,
        currentJson: currentJson.data,
      });
      throw new Error('CoinCap returned empty or invalid current price');
    }

    const coincapEndTime = getTime();
    const coincapDuration = coincapEndTime - coincapStartTime;
    
    logger.log(`✅ [ROI API] CoinCap 成功 - 当前 USD: ${currentUsd}, 历史 USD: ${historyUsd}`);
    logger.log(`⏱️ [ROI API] CoinCap 总耗时: ${coincapDuration.toFixed(2)}ms`);

    const response = {
      currentPrice: currentUsd * USD_TO_CNY,
      historyPrice: historyUsd * USD_TO_CNY,
      source: 'CoinCap (Live)',
    };
    
    const totalTime = getTime() - requestStartTime;
    logger.log(`✅ [ROI API] ========== 请求成功 [${requestId}] ==========`);
    logger.log(`⏱️ [ROI API] 总耗时: ${totalTime.toFixed(2)}ms`);
    logger.log(`📊 [ROI API] 返回数据:`, response);

    return NextResponse.json(response);
  } catch (e: any) {
    const coincapEndTime = getTime();
    const coincapDuration = coincapEndTime - coincapStartTime;
    
    const errorMsg = e.name === 'AbortError' 
      ? 'CoinCap API: Connection Timeout (5s)' 
      : `CoinCap API: ${e.message}`;
    
    console.error(`❌ [ROI API] CoinCap 失败，耗时: ${coincapDuration.toFixed(2)}ms`);
    console.error(`❌ [ROI API] CoinCap 错误详情:`, {
      name: e.name,
      message: e.message,
      stack: e.stack,
      error: e,
    });
    
    errorLog.push(errorMsg);
  }

  // --- FAILURE MODE: Both APIs Failed ---
  // Return 500 with exact error messages (NO MOCK DATA)
  const totalTime = getTime() - requestStartTime;
  const combinedError = errorLog.length > 0 
    ? errorLog.join('; ') 
    : 'Unknown error: Both Binance and CoinCap APIs failed';

  console.error(`\n❌ [ROI API] ========== 请求失败 [${requestId}] ==========`);
  console.error(`⏱️ [ROI API] 总耗时: ${totalTime.toFixed(2)}ms`);
  console.error(`📋 [ROI API] 错误日志:`, errorLog);
  console.error(`📊 [ROI API] 失败详情:`, {
    binanceFailed: errorLog.some(e => e.includes('Binance')),
    coincapFailed: errorLog.some(e => e.includes('CoinCap')),
    allFailed: true,
    proxyUrl: LOCAL_PROXY,
  });

  // Final Error Return (Pass the actual error to UI)
  return NextResponse.json(
    {
      error: "Network Error",
      details: `Proxy Connection Failed. Please check if your local proxy is running at ${LOCAL_PROXY}. Errors: ${combinedError}`,
      proxyUrl: LOCAL_PROXY,
      errorLog,
    },
    { status: 500 }
  );
}
