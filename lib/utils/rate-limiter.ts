/**
 * Rate Limiter - 速率限制工具
 * 
 * 用于控制 API 请求频率，避免触发速率限制
 */

interface RateLimitConfig {
  maxRequests: number; // 最大请求数
  windowMs: number; // 时间窗口（毫秒）
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  /**
   * 检查是否可以发起请求
   * @param key 请求标识符（如 API 名称）
   * @param config 速率限制配置
   * @returns 是否可以请求，以及需要等待的时间（毫秒）
   */
  canRequest(key: string, config: RateLimitConfig): { allowed: boolean; waitMs: number } {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // 清理过期请求
    const validRequests = requests.filter(timestamp => now - timestamp < config.windowMs);
    
    if (validRequests.length >= config.maxRequests) {
      // 计算需要等待的时间（最早请求的时间 + 窗口时间 - 当前时间）
      const oldestRequest = validRequests[0];
      const waitMs = oldestRequest + config.windowMs - now;
      return { allowed: false, waitMs: Math.max(0, waitMs) };
    }
    
    // 记录本次请求
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return { allowed: true, waitMs: 0 };
  }
  
  /**
   * 重置指定 key 的请求记录
   */
  reset(key: string) {
    this.requests.delete(key);
  }
  
  /**
   * 重置所有请求记录
   */
  resetAll() {
    this.requests.clear();
  }
}

// 创建全局实例
export const rateLimiter = new RateLimiter();

// 速率限制配置
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // CoinPaprika: 免费计划约 333 次/分钟（约 5.5 次/秒），我们保守设置为 3 次/秒
  coinpaprika: {
    maxRequests: 3,
    windowMs: 1000, // 1 秒
  },
  
  // Binance: 1200 次/分钟（20 次/秒），我们设置为 10 次/秒
  binance: {
    maxRequests: 10,
    windowMs: 1000, // 1 秒
  },
  
  // OKX: 20 次/秒，我们设置为 10 次/秒
  okx: {
    maxRequests: 10,
    windowMs: 1000, // 1 秒
  },
  
  // Yahoo Finance: 无官方限制，但建议 5 次/秒
  yahoo: {
    maxRequests: 5,
    windowMs: 1000, // 1 秒
  },
  
  // CORS 代理服务: 通常限制较严格，设置为 2 次/秒
  proxy: {
    maxRequests: 2,
    windowMs: 1000, // 1 秒
  },
};

/**
 * 等待指定时间
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * 带速率限制的请求包装器
 */
export async function rateLimitedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.proxy
): Promise<T> {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    const { allowed, waitMs } = rateLimiter.canRequest(key, config);
    
    if (allowed) {
      try {
        return await requestFn();
      } catch (error: any) {
        // 如果是速率限制错误，等待后重试
        if (error.message?.includes('rate limit') || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          retries++;
          if (retries < maxRetries) {
            const backoffMs = Math.min(1000 * Math.pow(2, retries), 5000); // 指数退避，最多 5 秒
            console.warn(`[RateLimiter] 速率限制错误，等待 ${backoffMs}ms 后重试 (${retries}/${maxRetries})`);
            await wait(backoffMs);
            continue;
          }
        }
        throw error;
      }
    } else {
      // 需要等待
      console.warn(`[RateLimiter] 请求过快，等待 ${waitMs}ms`);
      await wait(waitMs);
      retries++;
    }
  }
  
  throw new Error(`请求失败：速率限制，已重试 ${maxRetries} 次`);
}
