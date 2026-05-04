export interface Article {
  id: string;
  title: string;
  categoryId: string;
  subcategoryId?: string;
  date: string;
  readTime: number;
  summary: string;
  content: string;
  imageLayout?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
}

export const subcategories: Subcategory[] = [
  { id: "us-broker",        categoryId: "broker", name: "美股券商" },
  { id: "hk-broker",       categoryId: "broker", name: "港股券商" },
  { id: "physical-bank",   categoryId: "bank",   name: "实体银行" },
  { id: "virtual-bank",    categoryId: "bank",   name: "虚拟银行" },
  { id: "digital-bank",    categoryId: "bank",   name: "数字银行" },
  { id: "jianzheng",       categoryId: "bank",   name: "见证开户" },
];

export const categories: Category[] = [
  { id: "domestic", name: "国内理财", emoji: "🇨🇳" },
  { id: "crypto",   name: "加密货币", emoji: "🪙" },
  { id: "broker",   name: "券商开户", emoji: "🏛️" },
  { id: "bank",     name: "银行账户", emoji: "💳" },
  { id: "simcard",  name: "手机套餐",  emoji: "📱" },
  { id: "ai",       name: "AI 工具",  emoji: "⚡" },
  { id: "vcard",    name: "虚拟U卡",  emoji: "💰" },
  { id: "index",    name: "指数投资", emoji: "📈" },
  { id: "strategy", name: "投资策略", emoji: "🧭" },
  { id: "outside",  name: "出海必备", emoji: "✈️" },
];

export const articles: Article[] = [];
