import { NextRequest, NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import https from 'https';
import http from 'http';

/**
 * 诊断价格 API - 测试各数据源的网络连通性
 * 用于诊断本地网络环境是否能正常访问外部 API
 */

interface TestResult {
  source: string;
  url: string;
  status: 'success' | 'timeout' | 'error' | 'cors';
  statusCode?: number;
  responseTime: number; // ms
  price?: number;
  error?: string;
}

// 数据源配置
const DATA_SOURCES: Record<string, Array<{ name: string; url: string; parser: (data: any) => number | null }>> = {
  BTC: [
    {
      name: 'CoinPaprika',
      url: 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin',
      parser: (data: any) => {
        const price = data?.quotes?.USD?.price;
        return typeof price === 'number' ? price : parseFloat(String(price)) || null;
      },
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT',
      parser: (data: any) => {
        const price = parseFloat(data?.price);
        return !isNaN(price) && price > 0 ? price : null;
      },
    },
    {
      name: 'OKX',
      url: 'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT',
      parser: (data: any) => {
        if (data?.data && data.data.length > 0) {
          const price = parseFloat(data.data[0].last);
          return !isNaN(price) && price > 0 ? price : null;
        }
        return null;
      },
    },
  ],
  OKB: [
    {
      name: 'CoinPaprika',
      url: 'https://api.coinpaprika.com/v1/tickers/okb-okb',
      parser: (data: any) => {
        const price = data?.quotes?.USD?.price;
        return typeof price === 'number' ? price : parseFloat(String(price)) || null;
      },
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=OKBUSDT',
      parser: (data: any) => {
        const price = parseFloat(data?.price);
        return !isNaN(price) && price > 0 ? price : null;
      },
    },
    {
      name: 'OKX',
      url: 'https://www.okx.com/api/v5/market/ticker?instId=OKB-USDT',
      parser: (data: any) => {
        if (data?.data && data.data.length > 0) {
          const price = parseFloat(data.data[0].last);
          return !isNaN(price) && price > 0 ? price : null;
        }
        return null;
      },
    },
  ],
  QQQ: [
    {
      name: 'CoinPaprika',
      url: 'https://api.coinpaprika.com/v1/tickers/qqq-qqq',
      parser: (data: any) => {
        const price = data?.quotes?.USD?.price;
        return typeof price === 'number' ? price : parseFloat(String(price)) || null;
      },
    },
    {
      name: 'Binance',
      url: 'https://api.binance.com/api/v3/ticker/price?symbol=QQQUSDT',
      parser: (data: any) => {
        const price = parseFloat(data?.price);
        return !isNaN(price) && price > 0 ? price : null;
      },
    },
    {
      name: 'OKX',
      url: 'https://www.okx.com/api/v5/market/ticker?instId=QQQ-USDT',
      parser: (data: any) => {
        if (data?.data && data.data.length > 0) {
          const price = parseFloat(data.data[0].last);
          return !isNaN(price) && price > 0 ? price : null;
        }
        return null;
      },
    },
  ],
};

/**
 * 获取代理 Agent（参考 ROI API 的实现）
 */
function getProxyAgent() {
  const httpsProxy = process.env.https_proxy || process.env.HTTPS_PROXY;
  const httpProxy = process.env.http_proxy || process.env.HTTP_PROXY;
  const proxy = httpsProxy || httpProxy;
  
  console.log(`[Debug API] 环境变量检查:`, {
    https_proxy: process.env.https_proxy,
    HTTPS_PROXY: process.env.HTTPS_PROXY,
    http_proxy: process.env.http_proxy,
    HTTP_PROXY: process.env.HTTP_PROXY,
    selected: proxy,
  });
  
  if (proxy) {
    console.log(`[Debug API] ✅ 使用代理: ${proxy}`);
    try {
      const agent = new HttpsProxyAgent(proxy);
      console.log(`[Debug API] ✅ ProxyAgent 创建成功`);
      return agent;
    } catch (err: any) {
      console.error(`[Debug API] ❌ ProxyAgent 创建失败:`, err.message);
      return undefined;
    }
  } else {
    console.warn(`[Debug API] ⚠️ 未检测到代理环境变量`);
  }
  return undefined;
}

/**
 * 使用原生 Node.js http/https 模块进行请求（支持代理）
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10000
): Promise<{ response: Response; duration: number }> {
  const startTime = Date.now();
  const urlObj = new URL(url);
  const proxyAgent = getProxyAgent();
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject({ error: new Error('Request timeout'), duration: Date.now() - startTime });
    }, timeoutMs);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      ...(proxyAgent && { agent: proxyAgent }),
    };

    const httpModule = urlObj.protocol === 'https:' ? https : http;
    
    const req = httpModule.request(options, (res) => {
      const chunks: Buffer[] = [];
      
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        clearTimeout(timeout);
        const duration = Date.now() - startTime;
        const body = Buffer.concat(chunks).toString();
        
        // 将 Node.js 响应转换为 Web Response
        const response = new Response(body, {
          status: res.statusCode || 200,
          statusText: res.statusMessage || 'OK',
          headers: res.headers as any,
        });
        
        resolve({ response, duration });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      reject({ error: err, duration });
    });

    req.end();
  });
}

/**
 * 测试单个数据源
 */
async function testDataSource(
  source: { name: string; url: string; parser: (data: any) => number | null }
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const { response, duration } = await fetchWithTimeout(source.url, 10000);

    if (!response.ok) {
      return {
        source: source.name,
        url: source.url,
        status: 'error',
        statusCode: response.status,
        responseTime: duration,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();
    const price = source.parser(data);

    if (price === null || !isFinite(price) || price <= 0) {
      return {
        source: source.name,
        url: source.url,
        status: 'error',
        statusCode: response.status,
        responseTime: duration,
        error: '无法解析价格数据',
      };
    }

    return {
      source: source.name,
      url: source.url,
      status: 'success',
      statusCode: response.status,
      responseTime: duration,
      price,
    };
  } catch (err: any) {
    const duration = Date.now() - startTime;

    if (err.error?.name === 'AbortError') {
      return {
        source: source.name,
        url: source.url,
        status: 'timeout',
        responseTime: duration,
        error: `请求超时 (${duration}ms)`,
      };
    }

    // 检查是否是 CORS 错误
    if (err.error?.message?.includes('CORS') || err.error?.message?.includes('cors')) {
      return {
        source: source.name,
        url: source.url,
        status: 'cors',
        responseTime: duration,
        error: 'CORS 错误：跨域请求被阻止',
      };
    }

    return {
      source: source.name,
      url: source.url,
      status: 'error',
      responseTime: duration,
      error: err.error?.message || err.message || '未知错误',
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'BTC';

    const sources = DATA_SOURCES[symbol];
    if (!sources) {
      return NextResponse.json(
        {
          error: `不支持的资产符号: ${symbol}`,
          supported: Object.keys(DATA_SOURCES),
        },
        { status: 400 }
      );
    }

    console.log(`[Debug API] 开始测试 ${symbol} 的网络连通性...`);

    // 并行测试所有数据源（使用 allSettled 确保即使失败也返回结果）
    const results = await Promise.allSettled(
      sources.map((source) => testDataSource(source))
    );

    const testResults: TestResult[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          source: sources[index].name,
          url: sources[index].url,
          status: 'error',
          responseTime: 0,
          error: result.reason?.message || 'Promise rejected',
        };
      }
    });

    // 计算统计信息
    const successCount = testResults.filter((r) => r.status === 'success').length;
    const prices = testResults.filter((r) => r.price !== undefined).map((r) => r.price!);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
    const medianPrice =
      prices.length > 0
        ? [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)]
        : null;

    console.log(`[Debug API] 测试完成: ${successCount}/${sources.length} 成功`);

    return NextResponse.json({
      symbol,
      timestamp: Date.now(),
      results: testResults,
      summary: {
        total: sources.length,
        success: successCount,
        timeout: testResults.filter((r) => r.status === 'timeout').length,
        error: testResults.filter((r) => r.status === 'error').length,
        cors: testResults.filter((r) => r.status === 'cors').length,
        avgPrice,
        medianPrice,
        prices,
      },
    });
  } catch (error: any) {
    console.error('[Debug API] 全局错误:', error);
    return NextResponse.json(
      {
        error: error.message || '服务器内部错误',
      },
      { status: 500 }
    );
  }
}

