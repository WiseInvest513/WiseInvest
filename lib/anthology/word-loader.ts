/**
 * Word 文档和 Markdown 文件加载器
 * 用于从 .docx 和 .md 文件读取文章内容
 */

import fs from "fs";
import path from "path";

/**
 * 清理 HTML 内容，移除标签但保留文本
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

/**
 * 将 Word 文档转换为 Markdown 格式的文本
 * 使用 mammoth 的样式映射功能，更好地识别标题样式
 */
export async function loadWordDocument(filePath: string): Promise<string> {
  try {
    // 动态导入 mammoth（仅在服务器端使用）
    const mammoth = await import("mammoth");
    
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath);
    
    // 配置样式映射，将 Word 的标题样式映射为 HTML 标题标签
    // 这样 mammoth 会更好地识别 Word 文档中的标题
    const styleMap = [
      // 标题 1-6 样式映射
      "p[style-name='标题 1'] => h1:fresh",
      "p[style-name='Title 1'] => h1:fresh",
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='标题 2'] => h2:fresh",
      "p[style-name='Title 2'] => h2:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='标题 3'] => h3:fresh",
      "p[style-name='Title 3'] => h3:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='标题 4'] => h4:fresh",
      "p[style-name='Title 4'] => h4:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='标题 5'] => h5:fresh",
      "p[style-name='Title 5'] => h5:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='标题 6'] => h6:fresh",
      "p[style-name='Title 6'] => h6:fresh",
      "p[style-name='Heading 6'] => h6:fresh",
      // 标题样式映射（通过大纲级别）
      "p[style-name='标题'] => h1:fresh",
      "p[style-name='Title'] => h1:fresh",
    ];
    
    // 配置图片转换：将图片提取为 base64 格式
    const convertImage = mammoth.default.images.imgElement((image) => {
      return image.read("base64").then((imageBuffer: string) => {
        // 获取图片类型（默认为 png）
        const contentType = image.contentType || "image/png";
        return {
          src: `data:${contentType};base64,${imageBuffer}`,
        };
      }).catch((err: any) => {
        console.warn("[WordLoader] 图片提取失败:", err);
        return { src: "" }; // 如果提取失败，返回空src
      });
    });
    
    // 转换为 HTML（使用样式映射和图片转换）
    const result = await mammoth.default.convertToHtml(
      { buffer: fileBuffer },
      { 
        styleMap,
        convertImage,
        // 允许访问外部文件（某些Word文档中的图片可能是外部引用）
        externalFileAccess: true,
      }
    );
    
    let html = result.value;
    
    // 将 HTML 转换为 Markdown
    // 按顺序处理，先处理标题（从高级别到低级别，避免 h1 匹配到 h2）
    let markdown = html
      // 处理标题（支持 1-6 级）
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, (_, text) => `###### ${stripHtmlTags(text)}\n\n`)
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, (_, text) => `##### ${stripHtmlTags(text)}\n\n`)
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, (_, text) => `#### ${stripHtmlTags(text)}\n\n`)
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_, text) => `### ${stripHtmlTags(text)}\n\n`)
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_, text) => `## ${stripHtmlTags(text)}\n\n`)
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_, text) => `# ${stripHtmlTags(text)}\n\n`)
      // 处理文本格式
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
      .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
      .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
      // 处理列表
      .replace(/<ul[^>]*>/gi, "")
      .replace(/<\/ul>/gi, "\n")
      .replace(/<ol[^>]*>/gi, "")
      .replace(/<\/ol>/gi, "\n")
      .replace(/<li[^>]*>(.*?)<\/li>/gi, (_, text) => {
        const cleanText = stripHtmlTags(text).trim();
        return cleanText ? `- ${cleanText}\n` : "";
      })
      // 处理图片（在移除其他HTML标签之前）
      // 匹配 <img> 标签，提取 src 和 alt 属性
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi, (match, src, alt) => {
        // 保留base64图片，转换为Markdown格式
        if (!src) return "";
        const altText = alt || "图片";
        // 确保base64 URI格式正确（移除可能的引号）
        const cleanSrc = src.trim();
        return `\n\n![${altText}](${cleanSrc})\n\n`;
      })
      // 处理段落
      .replace(/<p[^>]*>(.*?)<\/p>/gi, (_, text) => {
        const cleanText = stripHtmlTags(text).trim();
        return cleanText ? `${cleanText}\n\n` : "\n";
      })
      // 处理换行
      .replace(/<br[^>]*>/gi, "\n")
      .replace(/<\/?div[^>]*>/gi, "\n")
      // 移除所有剩余的 HTML 标签（但保留已转换的图片）
      .replace(/<[^>]+>/g, "")
      // 清理空白行
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    
    return markdown;
  } catch (error: any) {
    if (error.code === "MODULE_NOT_FOUND" || error.message?.includes("mammoth")) {
      console.error("[WordLoader] 请先安装 mammoth 库：npm install mammoth");
      throw new Error("Word 文档解析库未安装。请运行：npm install mammoth");
    }
    console.error(`[WordLoader] 读取 Word 文档失败: ${filePath}`, error);
    throw error;
  }
}

/**
 * 获取文档目录路径
 */
export function getDocumentsDirectory(): string {
  return path.join(process.cwd(), "lib/anthology/documents");
}

/**
 * 检查文档文件是否存在
 * @param filePath 文件路径（相对于 documents 目录）
 */
export function documentExists(filePath: string): boolean {
  const docPath = path.join(getDocumentsDirectory(), filePath);
  return fs.existsSync(docPath);
}

/**
 * 根据文章 ID 和路径获取对应的 Word 文档文件路径
 * 
 * 优先级：
 * 1. 如果提供了 path，直接使用 path
 * 2. 否则，根据 ID 自动推断路径（向后兼容）
 * 3. 如果推断失败，使用 ID 作为文件名（旧方式）
 * 
 * @param articleId 文章ID
 * @param path 可选的相对路径（相对于 documents 目录）
 * @returns 文件路径（相对于 documents 目录）
 */
export function getDocumentFilePath(articleId: string, path?: string): string {
  // 如果提供了 path，直接使用
  if (path) {
    return path;
  }
  
  // 尝试根据 ID 自动推断路径
  // 格式1: 股东大会文档 -> buffett/meetings/{id}.docx
  if (articleId.includes("股东大会")) {
    return `buffett/meetings/${articleId}.docx`;
  }
  
  // 格式2: 演讲合集 -> buffett/speeches/{id}.md 或 {id}.docx
  if (articleId.startsWith("buffett-speech-")) {
    const filename = articleId.replace("buffett-speech-", "");
    // 先尝试 .md，如果不存在再尝试 .docx
    const mdPath = `buffett/speeches/${filename}.md`;
    const docxPath = `buffett/speeches/${filename}.docx`;
    const documentsDir = getDocumentsDirectory();
    if (fs.existsSync(path.join(documentsDir, mdPath))) {
      return mdPath;
    }
    return docxPath;
  }
  
  // 格式3: 名言合集 -> buffett/quotes/{id}.docx 或 {id}.md
  if (articleId.startsWith("buffett-quote-")) {
    const filename = articleId.replace("buffett-quote-", "");
    // 先尝试 .md，如果不存在再尝试 .docx
    const mdPath = `buffett/quotes/${filename}.md`;
    const docxPath = `buffett/quotes/${filename}.docx`;
    const documentsDir = getDocumentsDirectory();
    if (fs.existsSync(path.join(documentsDir, mdPath))) {
      return mdPath;
    }
    return docxPath;
  }
  
  // 格式4: 段永平商业逻辑 -> duan/business/{filename}.md 或 {filename}.docx
  if (articleId.startsWith("duan-business-")) {
    const filename = articleId.replace("duan-business-", "");
    // 先尝试 .md，如果不存在再尝试 .docx
    const mdPath = `duan/business/${filename}.md`;
    const docxPath = `duan/business/${filename}.docx`;
    const documentsDir = getDocumentsDirectory();
    if (fs.existsSync(path.join(documentsDir, mdPath))) {
      return mdPath;
    }
    return docxPath;
  }
  
  // 格式5: 段永平投资语录 -> duan/investment/{filename}.md 或 {filename}.docx
  if (articleId.startsWith("duan-invest-")) {
    const filename = articleId.replace("duan-invest-", "");
    // 先尝试 .md，如果不存在再尝试 .docx
    const mdPath = `duan/investment/${filename}.md`;
    const docxPath = `duan/investment/${filename}.docx`;
    const documentsDir = getDocumentsDirectory();
    if (fs.existsSync(path.join(documentsDir, mdPath))) {
      return mdPath;
    }
    return docxPath;
  }
  
  // 默认：使用 ID 作为文件名（向后兼容旧文件）
  return `${articleId}.docx`;
}

/**
 * 加载 Markdown 文件内容
 * @param filePath Markdown 文件完整路径
 */
export async function loadMarkdownDocument(filePath: string): Promise<string> {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`[WordLoader] 读取 Markdown 文件失败: ${filePath}`, error);
    throw error;
  }
}

/**
 * 从 Word 文档或 Markdown 文件加载文章内容
 * @param articleId 文章ID
 * @param articlePath 可选的文档路径（如果元数据中提供了path）
 */
export async function loadArticleFromWord(articleId: string, articlePath?: string): Promise<string | null> {
  try {
    // 获取文档路径（支持子文件夹）
    const relativePath = getDocumentFilePath(articleId, articlePath);
    const fullPath = path.join(getDocumentsDirectory(), relativePath);
    
    // 检查文件是否存在
    if (!documentExists(relativePath)) {
      console.log(`[WordLoader] 文档不存在: ${relativePath}`);
      // 尝试旧路径（向后兼容）
      const oldPath = `${articleId}.docx`;
      const oldFullPath = path.join(getDocumentsDirectory(), oldPath);
      if (fs.existsSync(oldFullPath)) {
        console.log(`[WordLoader] 使用旧路径: ${oldPath}`);
        const content = await loadWordDocument(oldFullPath);
        return content;
      }
      return null;
    }
    
    // 检查文件扩展名，支持 .docx、.md 和 .pdf
    const ext = path.extname(fullPath).toLowerCase();
    if (ext === ".pdf") {
      // PDF 文件：返回特殊标记，表示这是一个 PDF 文件
      // 格式：__PDF__:相对路径
      return `__PDF__:${relativePath}`;
    } else if (ext === ".md") {
      // 加载 Markdown 文件
      const content = await loadMarkdownDocument(fullPath);
      return content;
    } else {
      // 加载 Word 文档
      const content = await loadWordDocument(fullPath);
      return content;
    }
  } catch (error) {
    console.error(`[WordLoader] 加载文章失败: ${articleId}`, error);
    return null;
  }
}

/**
 * 列出所有可用的 Word 文档
 */
export function listAvailableDocuments(): string[] {
  try {
    const dir = getDocumentsDirectory();
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    const files = fs.readdirSync(dir);
    return files
      .filter((file) => file.endsWith(".docx"))
      .map((file) => file.replace(".docx", ""));
  } catch (error) {
    console.error("[WordLoader] 列出文档失败", error);
    return [];
  }
}
