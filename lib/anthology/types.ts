export interface Article {
  id: string;
  title: string;
  content: string;
}

export interface ArticleMetadata {
  id: string;
  title: string;
  path?: string; // 可选：Word文档的相对路径（相对于 documents 目录），如 "buffett/meetings/1957-1967股东大会.docx"
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

export interface Section {
  name: string;
  authors: Author[];
}

export interface ArticleWithMeta extends Article {
  author: string;
  category: string;
  section?: string; // 新增：所属分类（名人文章、投资思想等）
}

