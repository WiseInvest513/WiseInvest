"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Share2, ChevronRight, ChevronLeft, Search, Loader2, Maximize2, Minimize2, ChevronDown, ChevronUp } from "lucide-react";
import {
  getKnowledgeBaseMetadata,
  getAllArticleMetadata,
  getArticleById,
  getArticleMetadataById,
  type Author,
  type ArticleWithMeta,
  type Section,
} from "@/lib/anthology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import dynamic from "next/dynamic";

// 动态导入 PdfViewer，禁用 SSR（PDF 查看器只在客户端运行）
const PdfViewer = dynamic(() => import("@/components/anthology/PdfViewer").then(mod => ({ default: mod.PdfViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-2"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">正在加载 PDF 查看器...</p>
      </div>
    </div>
  ),
});

// Section emoji 符号映射
const sectionEmojis: Record<string, string> = {
  "名人文章": "📚",
  "投资思想": "💡",
};

// --- Hook: Track Active Heading ---
// This hook uses IntersectionObserver to detect which heading is currently visible in the viewport
// When a heading enters the viewport, it becomes the active heading and gets highlighted in the TOC
function useActiveHeading(headers: Array<{ id: string }>) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry that is most visible (highest intersection ratio)
        let maxRatio = 0;
        let mostVisibleId = "";

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleId = entry.target.id;
          }
        });

        // If we found a visible heading, set it as active
        if (mostVisibleId) {
          setActiveId(mostVisibleId);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px", // Trigger when heading is in the top 30% of viewport
        threshold: [0, 0.25, 0.5, 0.75, 1.0], // Multiple thresholds for better detection
      }
    );

    // Observe all header elements
    headers.forEach((header) => {
      const element = document.getElementById(header.id);
      if (element) {
        observer.observe(element);
      }
    });

    // Set the first header as active by default if none is visible
    if (headers.length > 0 && !activeId) {
      const firstElement = document.getElementById(headers[0].id);
      if (firstElement) {
        const rect = firstElement.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.3) {
          setActiveId(headers[0].id);
        }
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [headers, activeId]);

  return activeId;
}

// Component to extract headers and render article content with markdown support
function ArticleContent({
  content,
  onHeadersExtracted,
  title,
}: {
  content: string;
  onHeadersExtracted?: (headers: Array<{ id: string; text: string; level: number }>) => void;
  title?: string;
}) {
  // 检查是否是 PDF 文件标记
  if (content.startsWith("__PDF__:")) {
    const pdfPath = content.replace("__PDF__:", "");
    return <PdfViewer pdfPath={pdfPath} title={title} />;
  }
  const headers = useMemo(() => {
    const extractedHeaders: Array<{ id: string; text: string; level: number }> = [];
    let headerIndex = 0;
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      // 支持 1-6 级标题，清理加粗标记
      if (trimmed.startsWith("###### ")) {
        const headerText = trimmed.substring(7).replace(/\*\*/g, '').trim();
        extractedHeaders.push({ id: `header-${headerIndex++}`, text: headerText, level: 6 });
      } else if (trimmed.startsWith("##### ")) {
        const headerText = trimmed.substring(6).replace(/\*\*/g, '').trim();
        extractedHeaders.push({ id: `header-${headerIndex++}`, text: headerText, level: 5 });
      } else if (trimmed.startsWith("#### ")) {
        const headerText = trimmed.substring(5).replace(/\*\*/g, '').trim();
        extractedHeaders.push({ id: `header-${headerIndex++}`, text: headerText, level: 4 });
      } else if (trimmed.startsWith("### ")) {
        const headerText = trimmed.substring(4).replace(/\*\*/g, '').trim();
        extractedHeaders.push({ id: `header-${headerIndex++}`, text: headerText, level: 3 });
      } else if (trimmed.startsWith("## ")) {
        const headerText = trimmed.substring(3).replace(/\*\*/g, '').trim();
        extractedHeaders.push({ id: `header-${headerIndex++}`, text: headerText, level: 2 });
      } else if (trimmed.startsWith("# ")) {
        const headerText = trimmed.substring(2).replace(/\*\*/g, '').trim();
        extractedHeaders.push({ id: `header-${headerIndex++}`, text: headerText, level: 1 });
      }
    });
    return extractedHeaders;
  }, [content]);

  useEffect(() => {
    if (onHeadersExtracted) onHeadersExtracted(headers);
  }, [headers, onHeadersExtracted]);

  const lines = content.split("\n");
  const elements: React.JSX.Element[] = [];
  let currentList: Array<{ text: string; number?: number }> = [];
  let inList = false;
  let isOrderedList = false;
  let listStartNumber = 1;
  let headerIndex = 0;

  const flushList = () => {
    if (currentList.length > 0) {
      if (isOrderedList) {
        // 有序列表
        elements.push(
          <ol key={`list-${elements.length}`} start={listStartNumber} className="list-decimal list-inside my-4 space-y-2 text-text-primary">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{renderInlineMarkdown(item.text)}</li>
            ))}
          </ol>
        );
      } else {
        // 无序列表
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside my-4 space-y-2 text-text-primary">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed">{renderInlineMarkdown(item.text)}</li>
            ))}
          </ul>
        );
      }
      currentList = [];
      inList = false;
      isOrderedList = false;
      listStartNumber = 1;
    }
  };

  const renderInlineMarkdown = (text: string): React.JSX.Element => {
    const parts: (string | React.JSX.Element)[] = [];
    let processedText = text;
    let key = 0;
    
    // 先处理粗体 **text**，替换为占位符
    const boldMatches: Array<{ placeholder: string; element: React.JSX.Element }> = [];
    processedText = processedText.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
      const placeholder = `__BOLD_${key}__`;
      boldMatches.push({
        placeholder,
        element: <strong key={`bold-${key++}`} className="font-semibold text-text-primary">{content}</strong>
      });
      return placeholder;
    });
    
    // 再处理斜体 *text*（不匹配 **text** 中的 *）
    const italicMatches: Array<{ placeholder: string; element: React.JSX.Element }> = [];
    processedText = processedText.replace(/\*([^*]+)\*/g, (match, content) => {
      // 跳过已经是粗体占位符的内容
      if (match.includes('__BOLD_')) return match;
      const placeholder = `__ITALIC_${key}__`;
      italicMatches.push({
        placeholder,
        element: <em key={`italic-${key++}`} className="italic text-text-primary">{content}</em>
      });
      return placeholder;
    });
    
    // 合并所有匹配
    const allMatches = [...boldMatches, ...italicMatches];
    
    // 按位置找到所有占位符并替换
    const segments = processedText.split(/(__(?:BOLD|ITALIC)_\d+__)/g);
    
    return (
      <>
        {segments.map((segment, idx) => {
          const boldMatch = boldMatches.find(m => m.placeholder === segment);
          if (boldMatch) return <React.Fragment key={idx}>{boldMatch.element}</React.Fragment>;
          
          const italicMatch = italicMatches.find(m => m.placeholder === segment);
          if (italicMatch) return <React.Fragment key={idx}>{italicMatch.element}</React.Fragment>;
          
          return <React.Fragment key={idx}>{segment}</React.Fragment>;
        })}
      </>
    );
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    // 支持 1-6 级标题（从高级别到低级别，避免误匹配）
    if (trimmed.startsWith("###### ")) {
      flushList();
      let headerText = trimmed.substring(7);
      headerText = headerText.replace(/\*\*/g, '');
      const header = headers.find((h) => h.text === headerText.trim() && h.level === 6);
      const headerId = header?.id || `header-${headerIndex++}`;
      elements.push(<h6 key={index} id={headerId} className="text-base font-heading font-bold text-text-primary mt-6 mb-2 scroll-mt-24">{headerText}</h6>);
      return;
    }
    if (trimmed.startsWith("##### ")) {
      flushList();
      let headerText = trimmed.substring(6);
      headerText = headerText.replace(/\*\*/g, '');
      const header = headers.find((h) => h.text === headerText.trim() && h.level === 5);
      const headerId = header?.id || `header-${headerIndex++}`;
      elements.push(<h5 key={index} id={headerId} className="text-lg font-heading font-bold text-text-primary mt-7 mb-2.5 scroll-mt-24">{headerText}</h5>);
      return;
    }
    if (trimmed.startsWith("#### ")) {
      flushList();
      let headerText = trimmed.substring(5);
      headerText = headerText.replace(/\*\*/g, '');
      const header = headers.find((h) => h.text === headerText.trim() && h.level === 4);
      const headerId = header?.id || `header-${headerIndex++}`;
      elements.push(<h4 key={index} id={headerId} className="text-xl font-heading font-bold text-text-primary mt-8 mb-3 scroll-mt-24">{headerText}</h4>);
      return;
    }
    if (trimmed.startsWith("### ")) {
      flushList();
      let headerText = trimmed.substring(4);
      headerText = headerText.replace(/\*\*/g, '');
      const header = headers.find((h) => h.text === headerText.trim() && h.level === 3);
      const headerId = header?.id || `header-${headerIndex++}`;
      elements.push(<h3 key={index} id={headerId} className="text-xl font-heading font-bold text-text-primary mt-8 mb-3 scroll-mt-24">{headerText}</h3>);
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      let headerText = trimmed.substring(3);
      // 处理标题中的加粗标记
      headerText = headerText.replace(/\*\*/g, '');
      const header = headers.find((h) => h.text === headerText.trim() && h.level === 2);
      const headerId = header?.id || `header-${headerIndex++}`;
      elements.push(<h2 key={index} id={headerId} className="text-2xl font-heading font-bold text-text-primary mt-10 mb-4 scroll-mt-24">{headerText}</h2>);
      return;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      let headerText = trimmed.substring(2);
      // 处理标题中的加粗标记
      headerText = headerText.replace(/\*\*/g, '');
      const header = headers.find((h) => h.text === headerText.trim() && h.level === 1);
      const headerId = header?.id || `header-${headerIndex++}`;
      elements.push(<h1 key={index} id={headerId} className="text-3xl font-heading font-bold text-text-primary mt-12 mb-5 scroll-mt-24">{headerText}</h1>);
      return;
    }
    // 处理图片：![alt](src) 或 ![图片](data:image/png;base64,...)
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const [, alt, src] = imageMatch;
      elements.push(
        <div key={index} className="my-6 flex justify-center w-full">
          <img 
            src={src} 
            alt={alt || "图片"} 
            className="w-full h-auto rounded-lg shadow-md"
            style={{ maxWidth: "100%", height: "auto", width: "100%" }}
            onError={(e) => {
              console.error("[ArticleContent] 图片加载失败:", src?.substring(0, 50));
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      );
      return;
    }
    if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(<blockquote key={index} className="border-l-4 border-yellow-400 dark:border-yellow-500 bg-bg-secondary py-3 px-5 rounded-r-md my-4 text-text-primary italic">{renderInlineMarkdown(trimmed.substring(2))}</blockquote>);
      return;
    }
    // 处理有序列表（数字开头，如 "1. "、"2. "）
    const orderedListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (orderedListMatch) {
      const [, numberStr, itemText] = orderedListMatch;
      const number = parseInt(numberStr, 10);
      if (!inList) {
        flushList();
        inList = true;
        isOrderedList = true;
        listStartNumber = number;
      } else if (!isOrderedList) {
        // 如果之前是无序列表，先刷新
        flushList();
        inList = true;
        isOrderedList = true;
        listStartNumber = number;
      }
      currentList.push({ text: itemText, number });
      return;
    }
    // 处理无序列表（"- " 或 "• "）
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      if (!inList) {
        flushList();
        inList = true;
        isOrderedList = false;
      } else if (isOrderedList) {
        // 如果之前是有序列表，先刷新
        flushList();
        inList = true;
        isOrderedList = false;
      }
      const itemText = trimmed.replace(/^[-•]\s*/, "");
      currentList.push({ text: itemText });
      return;
    }
    flushList();
    if (trimmed) {
      // 检查是否有首行缩进（两个空格）
      const hasIndent = trimmed.startsWith('  ');
      const content = hasIndent ? trimmed.substring(2) : trimmed;
      elements.push(
        <p 
          key={index} 
          className={`mb-4 leading-relaxed text-text-primary ${hasIndent ? 'indent-8' : ''}`}
        >
          {renderInlineMarkdown(content)}
        </p>
      );
    } else {
      elements.push(<div key={index} className="h-2" />);
    }
  });
  flushList();

  return <div className="w-full max-w-none">{elements}</div>;
}

export default function AnthologyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const authorParam = searchParams.get("author");
  const categoryParam = searchParams.get("category");
  const articleIdParam = searchParams.get("id") || searchParams.get("article");

  // 获取文集元数据（同步，轻量级）
  const knowledgeBase = useMemo(() => getKnowledgeBaseMetadata(), []);
  // 获取第一个可用的文章
  const getFirstArticle = () => {
    for (const section of knowledgeBase) {
      for (const author of section.authors) {
        for (const category of author.categories) {
          if (category.articles.length > 0) {
            return category.articles[0];
          }
        }
      }
    }
    return null;
  };
  const firstArticle = getFirstArticle();

  const getInitialArticleId = () => {
    if (articleIdParam) {
      const article = getArticleMetadataById(articleIdParam);
      if (article) return articleIdParam;
    }
    return firstArticle?.id || "";
  };

  const [selectedArticleId, setSelectedArticleId] = useState<string>(getInitialArticleId());
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithMeta | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [articleHeaders, setArticleHeaders] = useState<Array<{ id: string; text: string; level: number }>>([]);
  
  const [filteredAuthor, setFilteredAuthor] = useState<string | null>(authorParam);
  const [filteredCategory, setFilteredCategory] = useState<string | null>(categoryParam);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // 初始化展开状态：默认展开第一个 Section 和第一个 Author
  const getInitialExpandedState = () => {
    const sections = new Set<string>();
    const authors = new Set<string>();
    const categories = new Set<string>();
    
    if (knowledgeBase.length > 0) {
      const firstSection = knowledgeBase[0];
      sections.add(firstSection.name);
      
      if (firstSection.authors.length > 0) {
        const firstAuthor = firstSection.authors[0];
        authors.add(`${firstSection.name}-${firstAuthor.name}`);
        
        if (firstAuthor.categories.length > 0) {
          const firstCategory = firstAuthor.categories[0];
          // 如果分类名称为空，也添加到展开列表（这样文章会直接显示）
          if (!firstCategory.name || firstCategory.name.trim() === "") {
            categories.add(`${firstAuthor.name}-`);
          } else {
            categories.add(`${firstAuthor.name}-${firstCategory.name}`);
          }
        }
      }
    }
    
    return { sections, authors, categories };
  };
  
  const initialExpanded = useMemo(() => getInitialExpandedState(), [knowledgeBase]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(initialExpanded.categories);
  const [expandedAuthors, setExpandedAuthors] = useState<Set<string>>(initialExpanded.authors);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(initialExpanded.sections);
  
  // 确保空分类的文章默认展开
  useEffect(() => {
    const newExpanded = new Set(expandedCategories);
    knowledgeBase.forEach((section) => {
      section.authors.forEach((author) => {
        author.categories.forEach((category) => {
          if (!category.name || category.name.trim() === "") {
            const emptyCategoryKey = `${author.name}-`;
            newExpanded.add(emptyCategoryKey);
          }
        });
      });
    });
    if (newExpanded.size !== expandedCategories.size) {
      setExpandedCategories(newExpanded);
    }
  }, [knowledgeBase]);

  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const rightSidebarRef = useRef<HTMLDivElement>(null);
  const [leftSidebarLeft, setLeftSidebarLeft] = useState(0);
  const [rightSidebarRight, setRightSidebarRight] = useState(0);

  useEffect(() => {
    const updatePositions = () => {
      if (leftSidebarRef.current) {
        const rect = leftSidebarRef.current.getBoundingClientRect();
        setLeftSidebarLeft(rect.left);
      }
      if (rightSidebarRef.current) {
        const rect = rightSidebarRef.current.getBoundingClientRect();
        setRightSidebarRight(window.innerWidth - rect.right);
      }
    };

    updatePositions();
    window.addEventListener('resize', updatePositions);
    window.addEventListener('scroll', updatePositions, { passive: true });

    return () => {
      window.removeEventListener('resize', updatePositions);
      window.removeEventListener('scroll', updatePositions);
    };
  }, []);

  // Use the active heading hook
  const activeHeaderId = useActiveHeading(articleHeaders);

  // 获取所有文章的元数据（用于导航）
  const allArticles = useMemo(() => getAllArticleMetadata(), []);

  // 过滤文集元数据（只搜索标题，不搜索内容，提高性能）
  // 注意：不再根据 filteredAuthor 和 filteredCategory 过滤，保持所有目录可见
  const filteredKnowledgeBase = useMemo(() => {
    let base = knowledgeBase;
    
    // 只根据搜索查询过滤，不根据选中状态过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      base = base.map((section) => {
        const filteredAuthors = section.authors.map((author) => {
          const filteredCategories = author.categories.map((category) => {
            const filteredArticles = category.articles.filter((article) =>
              article.title.toLowerCase().includes(query) ||
              author.name.toLowerCase().includes(query) ||
              category.name.toLowerCase().includes(query) ||
              section.name.toLowerCase().includes(query)
            );
            return filteredArticles.length > 0 ? { ...category, articles: filteredArticles } : null;
          }).filter((cat) => cat !== null);
          return filteredCategories.length > 0 ? { ...author, categories: filteredCategories } : null;
        }).filter((author) => author !== null);
        return filteredAuthors.length > 0 ? { ...section, authors: filteredAuthors } : null;
      }).filter((section) => section !== null);
    }
    
    return base;
  }, [searchQuery, knowledgeBase]);

  const currentArticleIndex = useMemo(() => allArticles.findIndex((article) => article.id === selectedArticleId), [selectedArticleId, allArticles]);
  const previousArticle = currentArticleIndex > 0 ? allArticles[currentArticleIndex - 1] : null;
  const nextArticle = currentArticleIndex < allArticles.length - 1 ? allArticles[currentArticleIndex + 1] : null;

  // 懒加载文章内容
  useEffect(() => {
    let cancelled = false;
    
    const loadArticle = async () => {
      setIsLoadingArticle(true);
      try {
        // 优先尝试通过 API 加载（支持 Word 文档）
        // 如果失败，回退到直接调用 getArticleById（适用于 data.ts 中的文章）
        let article = null;
        
        try {
          const response = await fetch(`/api/anthology/article?id=${encodeURIComponent(selectedArticleId)}`);
          if (response.ok) {
            article = await response.json();
          }
        } catch (apiError) {
          console.warn("[Anthology] API 加载失败，尝试直接加载:", apiError);
        }
        
        // 如果 API 加载失败，尝试直接加载（适用于 data.ts 中的文章）
        if (!article) {
          article = await getArticleById(selectedArticleId);
        }
        
        if (!cancelled && article) {
          setSelectedArticle(article);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `#${selectedArticleId}`);
          }
        }
      } catch (error) {
        console.error("Failed to load article:", error);
        if (!cancelled) {
          setSelectedArticle(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingArticle(false);
        }
      }
    };

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [selectedArticleId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash) {
        const hashId = window.location.hash.substring(1);
        const article = getArticleMetadataById(hashId);
        if (article) {
          setSelectedArticleId(hashId);
          // 自动展开对应的层级
          const sectionKey = article.section || knowledgeBase[0]?.name || "";
          const authorKey = `${sectionKey}-${article.author}`;
          const categoryKey = `${article.author}-${article.category}`;
          setExpandedSections(new Set([sectionKey]));
          setExpandedAuthors(new Set([authorKey]));
          setExpandedCategories(new Set([categoryKey]));
        }
      }
      if (articleIdParam) {
        const article = getArticleMetadataById(articleIdParam);
        if (article) {
          setSelectedArticleId(articleIdParam);
          setFilteredAuthor(article.author);
          setFilteredCategory(article.category);
          // 自动展开对应的层级
          const sectionKey = article.section || knowledgeBase[0]?.name || "";
          const authorKey = `${sectionKey}-${article.author}`;
          const categoryKey = `${article.author}-${article.category}`;
          setExpandedSections(new Set([sectionKey]));
          setExpandedAuthors(new Set([authorKey]));
          setExpandedCategories(new Set([categoryKey]));
          return;
        }
      }
      setFilteredAuthor(authorParam || null);
      setFilteredCategory(categoryParam || null);
    }
  }, [authorParam, categoryParam, articleIdParam, knowledgeBase]);
  
  const updateUrlFromFilters = (author: string | null, category: string | null) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (author) params.set("author", author);
    if (category) params.set("category", category);
    const newUrl = params.toString() ? `/anthology?${params.toString()}` : "/anthology";
    router.push(newUrl);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && selectedArticle) {
      const url = `${window.location.origin}/anthology#${selectedArticle.id}`;
      navigator.clipboard.writeText(url);
      toast.success("链接已复制到剪贴板");
    }
  };

  const handleShare = async () => {
    if (typeof window !== "undefined" && selectedArticle) {
      const url = `${window.location.origin}/anthology#${selectedArticle.id}`;
      const shareData = { title: selectedArticle.title, text: selectedArticle.content.substring(0, 100) + "...", url: url };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch (err) { console.log("Share cancelled"); }
      } else {
        navigator.clipboard.writeText(url);
        toast.success("链接已复制到剪贴板");
      }
    }
  };

  const handleToggleFullscreen = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    
    // 全屏模式下禁用 body 滚动，退出全屏时恢复
    if (typeof window !== "undefined") {
      if (newFullscreen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  };

  // 组件卸载时恢复 body 滚动
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  const handleHeaderClick = (headerId: string) => {
    const element = document.getElementById(headerId);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // 显示加载状态或错误信息
  if (isLoadingArticle || !selectedArticle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {isLoadingArticle ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
            <p className="text-text-secondary">加载文章中...</p>
          </div>
        ) : (
          <p className="text-text-secondary">文章未找到</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-white dark:bg-slate-950", isFullscreen && "fixed inset-0 z-50")}>
      <div className={cn("mx-auto flex items-start relative", isFullscreen ? "h-full w-full" : "max-w-[1600px] pt-0")}>
        
        {/* --- LEFT SIDEBAR (隐藏于全屏模式) --- */}
        {!isFullscreen && (
        <div ref={leftSidebarRef} className="w-72 shrink-0 sticky top-16 self-start h-[calc(100vh-64px)] flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10">
          
          {/* 1. FIXED SEARCH HEADER - Fixed at viewport top, absolutely positioned */}
          <div 
            className="fixed p-6 border-b border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-30"
            style={{ 
              top: '64px', 
              left: `${leftSidebarLeft}px`, 
              width: '288px' 
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input
                placeholder="搜索文集..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          
          {/* Spacer for fixed search box */}
          <div className="h-[81px] shrink-0"></div>
          
          {/* 2. SCROLLABLE LIST BODY - Takes remaining space and scrolls independently */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
            <div className="p-6">
              <Link 
                href="/anthology"
                className="font-heading text-xl font-bold text-slate-900 dark:text-white mb-8 block hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors"
              >
                知识库
              </Link>
              <nav className="space-y-6">
                {filteredKnowledgeBase.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">未找到匹配的内容</p>
                ) : (
                  filteredKnowledgeBase.map((section) => {
                    const sectionKey = section.name;
                    const isSectionExpanded = expandedSections.has(sectionKey);
                    return (
                      <div key={section.name} className="space-y-2">
                        {/* Section 标题（名人文章、投资思想） */}
                        <div
                          className="flex items-center gap-2 cursor-pointer group"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newExpanded = new Set(expandedSections);
                            if (isSectionExpanded) {
                              newExpanded.delete(sectionKey);
                            } else {
                              newExpanded.add(sectionKey);
                            }
                            setExpandedSections(newExpanded);
                          }}
                        >
                          {isSectionExpanded ? (
                            <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                          )}
                          {sectionEmojis[section.name] && (
                            <span className="text-xl flex-shrink-0">{sectionEmojis[section.name]}</span>
                          )}
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors">
                            {section.name}
                          </h2>
                        </div>
                        
                        {/* Authors（段永平、巴菲特） */}
                        {isSectionExpanded && (
                          <div className="space-y-4 pl-5">
                            {section.authors.map((author) => {
                              const authorKey = `${section.name}-${author.name}`;
                              const isAuthorExpanded = expandedAuthors.has(authorKey);
                              return (
                                <div key={author.name} className="space-y-3">
                                  <div
                                    className="flex items-center gap-1 cursor-pointer group"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newExpanded = new Set(expandedAuthors);
                                      if (isAuthorExpanded) {
                                        newExpanded.delete(authorKey);
                                      } else {
                                        newExpanded.add(authorKey);
                                      }
                                      setExpandedAuthors(newExpanded);
                                    }}
                                  >
                                    {isAuthorExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                                    )}
                                    <h3
                                      className={cn(
                                        "text-base font-bold uppercase tracking-wider transition-colors",
                                        filteredAuthor === author.name
                                          ? "text-yellow-600 dark:text-yellow-500"
                                          : "text-slate-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-500"
                                      )}
                                    >
                                      {author.name}
                                    </h3>
                                  </div>
                                  
                                  {/* Categories */}
                                  {isAuthorExpanded && (
                                    <div className="space-y-4 pl-4">
                                      {author.categories.map((category) => {
                                        const categoryKey = category.name ? `${author.name}-${category.name}` : `${author.name}-`;
                                        const isCategoryExpanded = expandedCategories.has(categoryKey);
                                        const hasCategoryName = category.name && category.name.trim() !== "";
                                        
                                        // 如果没有分类名称，直接显示文章（不显示分类层级）
                                        if (!hasCategoryName) {
                                          return (
                                            <div key="no-category" className="space-y-2">
                                              <ul className="space-y-0.5 pl-0">
                                                {category.articles.map((article) => {
                                                  const isActive = article.id === selectedArticleId;
                                                  const maxLength = 15;
                                                  const displayTitle = article.title.length > maxLength 
                                                    ? article.title.substring(0, maxLength) + '...' 
                                                    : article.title;
                                                  return (
                                                    <li key={article.id} className="flex">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setSelectedArticleId(article.id);
                                                          setFilteredAuthor(author.name);
                                                          setFilteredCategory("");
                                                          updateUrlFromFilters(author.name, "");
                                                        }}
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border-x-2 whitespace-nowrap overflow-hidden text-ellipsis ${
                                                          isActive
                                                            ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-bold border-yellow-400 dark:border-yellow-500"
                                                            : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                                        }`}
                                                        title={article.title}
                                                      >
                                                        {displayTitle}
                                                      </button>
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            </div>
                                          );
                                        }
                                        
                                        // 有分类名称的情况，正常显示分类层级
                                        return (
                                          <div key={category.name} className="space-y-2">
                                            <div
                                              className="flex items-center gap-1 cursor-pointer group"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const newExpanded = new Set(expandedCategories);
                                                if (isCategoryExpanded) {
                                                  newExpanded.delete(categoryKey);
                                                } else {
                                                  newExpanded.add(categoryKey);
                                                }
                                                setExpandedCategories(newExpanded);
                                              }}
                                            >
                                              {isCategoryExpanded ? (
                                                <ChevronDown className="h-3 w-3 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3 text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500 transition-colors" />
                                              )}
                                              <h4
                                                className={cn(
                                                  "text-sm font-semibold uppercase tracking-wider transition-colors flex-1",
                                                  filteredAuthor === author.name && filteredCategory === category.name
                                                    ? "text-yellow-600 dark:text-yellow-500"
                                                    : "text-slate-500 dark:text-slate-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-500"
                                                )}
                                              >
                                                {category.name}
                                              </h4>
                                            </div>
                                            
                                            {/* Articles */}
                                            {isCategoryExpanded && (
                                              <ul className="space-y-0.5 pl-4">
                                                {category.articles.map((article) => {
                                                  const isActive = article.id === selectedArticleId;
                                                  const maxLength = 15;
                                                  const displayTitle = article.title.length > maxLength 
                                                    ? article.title.substring(0, maxLength) + '...' 
                                                    : article.title;
                                                  return (
                                                    <li key={article.id} className="flex">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setSelectedArticleId(article.id);
                                                          setFilteredAuthor(author.name);
                                                          setFilteredCategory(category.name);
                                                          updateUrlFromFilters(author.name, category.name);
                                                        }}
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all duration-200 border-x-2 whitespace-nowrap overflow-hidden text-ellipsis ${
                                                          isActive
                                                            ? "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 font-bold border-yellow-400 dark:border-yellow-500"
                                                            : "border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                                                        }`}
                                                        title={article.title}
                                                      >
                                                        {displayTitle}
                                                      </button>
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </nav>
            </div>
          </div>
        </div>
        )}

        {/* --- CENTER CONTENT --- */}
        <main className={cn("flex-1 min-w-0 flex flex-col", isFullscreen && "h-full")}>
          {/* HEADER (全屏模式隐藏) */}
          {!isFullscreen && (
          <div className="sticky top-16 z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 transition-all">
            <div className="px-6 md:px-8 max-w-4xl mx-auto">
            <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-yellow-600 transition-colors">首页</Link>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <Link href="/anthology" className="hover:text-yellow-600 transition-colors">文集</Link>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">{selectedArticle.title}</span>
            </nav>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">{selectedArticle.title}</h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{selectedArticle.author} · {selectedArticle.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex items-center gap-2"><Copy className="h-4 w-4" /> 复制链接</Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="flex items-center gap-2"><Share2 className="h-4 w-4" /> 分享</Button>
                <Button variant="outline" size="sm" onClick={handleToggleFullscreen} className="flex items-center gap-2"><Maximize2 className="h-4 w-4" /> 全屏</Button>
              </div>
            </div>
            </div>
          </div>
          )}

          {/* 全屏模式下的简洁标题栏 */}
          {isFullscreen && (
          <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{selectedArticle.title}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedArticle.author} · {selectedArticle.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToggleFullscreen} className="flex items-center gap-2">
                <Minimize2 className="h-4 w-4" /> 退出全屏
              </Button>
            </div>
          </div>
          )}

          {/* SCROLLABLE ARTICLE BODY */}
          <div className={cn("pb-20", isFullscreen ? "h-full overflow-hidden relative" : "px-6 md:px-12 pt-6")}>
            <article className={cn("prose prose-slate max-w-none w-full", isFullscreen ? "h-full" : "pt-6")} style={{ maxWidth: '100%' }}>
              <ArticleContent content={selectedArticle.content} onHeadersExtracted={setArticleHeaders} title={selectedArticle.title} />
            </article>
            {(previousArticle || nextArticle) && (
              <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {previousArticle && (
                  <button onClick={() => setSelectedArticleId(previousArticle.id)} className="group text-left p-6 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg hover:border-yellow-400 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2"><ChevronLeft className="h-4 w-4" /><span>上一篇</span></div>
                    <h3 className="text-lg font-semibold group-hover:text-yellow-600 transition-colors">{previousArticle.title}</h3>
                  </button>
                )}
                {nextArticle && (
                  <button onClick={() => setSelectedArticleId(nextArticle.id)} className="group text-left p-6 bg-white dark:bg-slate-900 border border-slate-200 rounded-lg hover:border-yellow-400 hover:shadow-md md:ml-auto transition-all">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2 justify-end"><span className="text-right">下一篇</span><ChevronRight className="h-4 w-4" /></div>
                    <h3 className="text-lg font-semibold group-hover:text-yellow-600 transition-colors text-right">{nextArticle.title}</h3>
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* --- RIGHT SIDEBAR (SEPARATED: FIXED TITLE + SCROLLABLE TOC) --- */}
        <div ref={rightSidebarRef} className={cn("w-64 hidden xl:block shrink-0 sticky self-start flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-10", 
          isFullscreen ? "top-0 h-screen" : "top-16 h-[calc(100vh-64px)]"
        )}>
          {/* Fixed Header - Fixed at viewport top, absolutely positioned */}
          <div 
            className="fixed border-b border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-30"
            style={{ 
              top: isFullscreen ? '0' : '64px', 
              right: `${rightSidebarRight}px`, 
              width: '256px',
              padding: '1rem 1.5rem'
            }}
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 text-center">
              本页目录
            </h3>
          </div>
          
          {/* Spacer for fixed title */}
          <div className="h-[65px] shrink-0"></div>
          
          {/* Scrollable Content - Takes remaining space and scrolls independently */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
            <div className="p-6">
              {articleHeaders.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">暂无目录</p>
              ) : (
                <nav className="space-y-1">
                  {articleHeaders.map((header, index) => {
                    const isActive = activeHeaderId === header.id;
                    // 根据标题级别设置不同的缩进和样式
                    const getHeaderStyle = () => {
                      const baseClasses = "w-full text-left px-3 py-2 rounded-md text-sm transition-colors border-l-2 border-transparent hover:border-yellow-400 dark:hover:border-yellow-500 hover:bg-slate-50 dark:hover:bg-slate-800";
                      
                      switch (header.level) {
                        case 1:
                          return `${baseClasses} pl-3 text-slate-900 dark:text-white font-medium`;
                        case 2:
                          return `${baseClasses} pl-5 text-slate-700 dark:text-slate-300`;
                        case 3:
                          return `${baseClasses} pl-7 text-slate-600 dark:text-slate-400`;
                        case 4:
                          return `${baseClasses} pl-9 text-slate-600 dark:text-slate-400 text-xs`;
                        case 5:
                          return `${baseClasses} pl-11 text-slate-500 dark:text-slate-500 text-xs`;
                        case 6:
                          return `${baseClasses} pl-[52px] text-slate-500 dark:text-slate-500 text-xs`;
                        default:
                          return `${baseClasses} pl-7 text-slate-600 dark:text-slate-400`;
                      }
                    };
                    
                    return (
                      <button
                        key={header.id}
                        onClick={() => handleHeaderClick(header.id)}
                        className={cn(
                          getHeaderStyle(),
                          // Smart highlight: Active heading turns yellow
                          isActive && "text-yellow-500 dark:text-yellow-400 border-yellow-400 dark:border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 font-semibold"
                        )}
                      >
                        {header.text}
                      </button>
                    );
                  })}
                </nav>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}