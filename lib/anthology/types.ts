export interface Article {
  id: string;
  title: string;
  content: string;
}

export interface ArticleMetadata {
  id: string;
  title: string;
  // content 不在 metadata 中，需要懒加载
}

export interface Category {
  name: string;
  articles: ArticleMetadata[];
}

export interface Author {
  name: string;
  categories: Category[];
}

export interface ArticleWithMeta extends Article {
  author: string;
  category: string;
}

