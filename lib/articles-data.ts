export interface Article {
  id: string;
  title: string;
  categoryId: string;
  date: string;
  readTime: number;
  summary: string;
  content: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export const categories: Category[] = [
  { id: "crypto",   name: "加密货币", emoji: "🪙" },
  { id: "broker",   name: "券商开户", emoji: "🏛️" },
  { id: "bank",     name: "银行账户", emoji: "💳" },
  { id: "simcard",  name: "手机卡",   emoji: "🌐" },
  { id: "ai",       name: "AI 工具",  emoji: "⚡" },
  { id: "strategy", name: "投资策略", emoji: "🧭" },
];

export const articles: Article[] = [];
