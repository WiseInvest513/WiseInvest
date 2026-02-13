/**
 * Unified Price Service - 极简版
 * 参考 app.js 的精髓实现，单点高效架构
 * 
 * 核心特性：
 * 1. 数字格式化（支持极小数值）
 * 2. 数学表达式解析（支持 "1000/7.2" 等计算式）
 * 3. 30秒内存缓存
 * 4. CoinPaprika 作为唯一数据源
 */

// ==================== 数字格式化工具 ====================

export function toPlainDecimalString(num: number | string): string {
  const s = String(num);
  if (!/[eE]/.test(s)) return s;

  const [coeffRaw, expRaw] = s.toLowerCase().split('e');
  const exp = parseInt(expRaw, 10);

  let coeff = coeffRaw;
  let sign = '';
  if (coeff.startsWith('-')) {
    sign = '-';
    coeff = coeff.slice(1);
  }

  const parts = coeff.split('.');
  const intPart = parts[0] || '0';
  const fracPart = parts[1] || '';
  const digits = (intPart + fracPart).replace(/^0+(?=\d)/, '') || '0';

  if (exp >= 0) {
    const zeros = exp - fracPart.length;
    if (zeros >= 0) return sign + digits + '0'.repeat(zeros);
    const idx = intPart.length + exp;
    return sign + digits.slice(0, idx) + '.' + digits.slice(idx);
  }

  const zeros = (-exp) - intPart.length;
  if (zeros >= 0) return sign + '0.' + '0'.repeat(zeros) + digits;
  const idx = intPart.length + exp;
  return sign + digits.slice(0, idx) + '.' + digits.slice(idx);
}

export function formatNumberForDisplay(input: number | string): string {
  const n = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(n) || n === 0) return '0';

  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);

  const groupThousands = (intStr: string) => intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (abs >= 1) {
    const rounded = Math.round((abs + Number.EPSILON) * 100) / 100;
    let s = rounded.toFixed(2).replace(/\.?0+$/, '');
    const [i, f] = s.split('.');
    return sign + groupThousands(i) + (f ? `.${f}` : '');
  }

  const plain = toPlainDecimalString(abs);
  const frac = (plain.split('.')[1] || '').replace(/[^\d]/g, '');
  const firstNonZero = frac.search(/[1-9]/);
  if (firstNonZero === -1) return '0';

  const cut = Math.min(frac.length, firstNonZero + 2);
  const shown = frac.slice(0, cut);
  return sign + '0.' + shown;
}

// ==================== 数学表达式解析 ====================

function normalizeMathInput(raw: string | null | undefined): string {
  if (raw == null) return '';
  let s = String(raw);
  s = s
    .replace(/＋/g, '+')
    .replace(/－/g, '-')
    .replace(/—/g, '-')
    .replace(/×/g, '*')
    .replace(/✕/g, '*')
    .replace(/÷/g, '/')
    .replace(/（/g, '(')
    .replace(/）/g, ')');
  return s;
}

function isLikelyPlainNumberInput(raw: string | null | undefined): boolean {
  const s = normalizeMathInput(raw || '').trim();
  return /^-?[\d,]*\.?\d*$/.test(s) && !/[+*/()]/.test(s);
}

export function evaluateMathExpression(raw: string | null | undefined): number {
  const s0 = normalizeMathInput(raw);
  const s = s0.replace(/,/g, '');
  if (!s.trim()) return NaN;

  if (/[^0-9+\-*/().\s]/.test(s)) return NaN;

  type Token = { type: 'num'; value: number } | { type: 'op'; value: string } | { type: 'paren'; value: '(' | ')' };
  const tokens: Token[] = [];
  let i = 0;

  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch as '(' | ')' });
      i++;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', value: ch });
      i++;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i;
      let dotCount = 0;
      while (j < s.length) {
        const c = s[j];
        if (c === '.') {
          dotCount++;
          if (dotCount > 1) break;
          j++;
          continue;
        }
        if (c >= '0' && c <= '9') {
          j++;
          continue;
        }
        break;
      }
      const numStr = s.slice(i, j);
      if (numStr === '.' || numStr === '') return NaN;
      const num = Number(numStr);
      if (!Number.isFinite(num)) return NaN;
      tokens.push({ type: 'num', value: num });
      i = j;
      continue;
    }
    return NaN;
  }

  const out: Token[] = [];
  const ops: Token[] = [];
  const precedence = (op: string) => (op === 'u+' || op === 'u-' ? 3 : op === '*' || op === '/' ? 2 : 1);
  const isRightAssoc = (op: string) => op === 'u+' || op === 'u-';

  let prevType: 'start' | 'num' | 'op' | '(' | ')' = 'start';
  for (const t of tokens) {
    if (t.type === 'num') {
      out.push(t);
      prevType = 'num';
      continue;
    }
    if (t.type === 'paren') {
      if (t.value === '(') {
        ops.push(t);
        prevType = '(';
      } else {
        while (ops.length) {
          const top = ops.pop()!;
          if (top.type === 'paren' && top.value === '(') break;
          out.push(top);
        }
        prevType = ')';
      }
      continue;
    }
    if (t.type === 'op') {
      let op = t.value;
      if ((op === '+' || op === '-') && (prevType === 'start' || prevType === 'op' || prevType === '(')) {
        op = op === '+' ? 'u+' : 'u-';
      }
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top.type === 'paren') break;
        if (top.type !== 'op') break;
        const topOp = top.value;
        const p1 = precedence(op);
        const p2 = precedence(topOp);
        if (p2 > p1 || (p2 === p1 && !isRightAssoc(op))) {
          out.push(ops.pop()!);
          continue;
        }
        break;
      }
      ops.push({ type: 'op', value: op });
      prevType = 'op';
      continue;
    }
  }
  while (ops.length) out.push(ops.pop()!);

  const stack: number[] = [];
  for (const t of out) {
    if (t.type === 'num') {
      stack.push(t.value);
      continue;
    }
    if (t.type === 'op') {
      if (t.value === 'u+' || t.value === 'u-') {
        if (stack.length < 1) return NaN;
        const a = stack.pop()!;
        stack.push(t.value === 'u-' ? -a : +a);
        continue;
      }
      if (stack.length < 2) return NaN;
      const b = stack.pop()!;
      const a = stack.pop()!;
      let r: number;
      switch (t.value) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': r = a / b; break;
        default: return NaN;
      }
      if (!Number.isFinite(r)) return NaN;
      stack.push(r);
      continue;
    }
    return NaN;
  }
  if (stack.length !== 1) return NaN;
  return stack[0];
}

export function parseAmountInputToNumber(raw: string | null | undefined): number {
  const s = normalizeMathInput(raw);
  if (!s.trim()) return NaN;
  if (isLikelyPlainNumberInput(s)) {
    const n = Number(s.replace(/,/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }
  return evaluateMathExpression(s);
}

// ==================== 缓存机制 ====================

const CACHE_TTL = 30 * 1000; // 30秒缓存
const memoryCache = new Map<string, { ts: number; data: any }>();

function readCache<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > CACHE_TTL) return null;
  return cached.data as T;
}

function writeCache<T>(key: string, data: T): void {
  memoryCache.set(key, { ts: Date.now(), data });
}

// ==================== 价格服务接口 ====================

export interface PriceResult {
  price: number;
  source: string[];
  timestamp: number;
  isValidated?: boolean;
  isVerified?: boolean;
}

export interface HistoricalPriceResult {
  price: number;
  date: string;
  source: string;
}

type ApiAssetType = 'crypto' | 'stock' | 'index';

function inferAssetType(symbol: string): ApiAssetType {
  const upper = symbol.toUpperCase();
  const indexSymbols = new Set(['QQQ', 'VOO', 'SPY', 'DIA', 'VGT', 'SH000001']);
  const stockSymbols = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA']);

  if (indexSymbols.has(upper)) return 'index';
  if (stockSymbols.has(upper)) return 'stock';
  return 'crypto';
}

// ==================== 价格获取函数 ====================

export async function getCurrentPrice(symbol: string): Promise<PriceResult | null> {
  const cacheKey = `price:${symbol}`;
  const cached = readCache<PriceResult>(cacheKey);
  if (cached && cached.price > 0) {
    return cached;
  }

  try {
    const assetType = inferAssetType(symbol);
    const response = await fetch(
      `/api/price?symbol=${encodeURIComponent(symbol)}&type=${assetType}&action=price`
    );
    if (!response.ok) {
      if (cached) return cached;
      return { price: 0, source: ['Error'], timestamp: Date.now() };
    }

    const data = await response.json();
    if (data.error || !data.price || data.price <= 0) {
      if (cached) return cached;
      return { price: 0, source: ['Error'], timestamp: Date.now() };
    }

    const result: PriceResult = {
      price: data.price,
      source: data.source || [],
      timestamp: data.timestamp || Date.now(),
    };

    writeCache(cacheKey, result);
    return result;
  } catch (err: any) {
    const cached = readCache<PriceResult>(cacheKey);
    if (cached) return cached;
    return { price: 0, source: ['Error'], timestamp: Date.now() };
  }
}

export async function getHistoricalPrice(symbol: string, date: Date): Promise<HistoricalPriceResult | null> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    const assetType = inferAssetType(symbol);
    const response = await fetch(
      `/api/price?symbol=${encodeURIComponent(symbol)}&type=${assetType}&action=historical&date=${dateStr}`
    );
    
    if (!response.ok) {
      return { price: 0, date: dateStr, source: 'Error' };
    }

    const data = await response.json();
    if (data.error || !data.price || data.price <= 0) {
      return { price: 0, date: dateStr, source: 'Error' };
    }

    return {
      price: data.price,
      date: data.date || dateStr,
      source: data.source || 'CoinGecko',
    };
  } catch {
    return { price: 0, date: date.toISOString().split('T')[0], source: 'Error' };
  }
}

export async function getCurrentPriceWithRetry(symbol: string, maxRetries: number = 3): Promise<PriceResult | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await getCurrentPrice(symbol);
    if (result && result.price > 0) {
      return result;
    }
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return { price: 0, source: ['Error'], timestamp: Date.now() };
}

export async function getHistoricalPriceWithRetry(
  symbol: string,
  date: Date,
  maxRetries: number = 3
): Promise<HistoricalPriceResult | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await getHistoricalPrice(symbol, date);
    if (result && result.price > 0) {
      return result;
    }
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return { price: 0, date: date.toISOString().split('T')[0], source: 'Error' };
}
