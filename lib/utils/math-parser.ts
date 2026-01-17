/**
 * Math Parser Utilities
 * 数学表达式解析工具
 * 
 * 从 unified-price-service.ts 提取的数学解析逻辑
 */

/**
 * 将数字转换为纯小数字符串（去除科学计数法）
 */
export function toPlainDecimalString(num: number | string): string {
  if (typeof num === "string") {
    return num;
  }

  if (!isFinite(num)) {
    return "0";
  }

  const str = num.toString();
  
  // 如果是科学计数法，转换为普通数字
  if (str.includes("e") || str.includes("E")) {
    return num.toFixed(20).replace(/\.?0+$/, "");
  }

  return str;
}

/**
 * 评估数学表达式
 * 支持基本运算：+、-、*、/、()
 */
export function evaluateMathExpression(raw: string | null | undefined): number {
  if (!raw) return NaN;

  const s = String(raw)
    .replace(/,/g, "")
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .replace(/×/g, "*")
    .replace(/÷/g, "/");

  if (!s.trim()) return NaN;
  if (/[^0-9+\-*/().\s]/.test(s)) return NaN;

  try {
    // 简单的安全评估（仅支持基本运算）
    const result = Function(`"use strict"; return (${s})`)();
    return typeof result === "number" && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

/**
 * 解析金额输入为数字
 * 支持数学表达式
 */
export function parseAmountInputToNumber(input: string | null | undefined): number {
  if (!input) return NaN;
  return evaluateMathExpression(input);
}

