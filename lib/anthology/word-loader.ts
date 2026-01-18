/**
 * Word 文档加载器
 * 用于从 .docx 文件读取文章内容
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
 */
export function documentExists(filename: string): boolean {
  const docPath = path.join(getDocumentsDirectory(), filename);
  return fs.existsSync(docPath);
}

/**
 * 根据文章 ID 获取对应的 Word 文档文件名
 * 约定：文章 ID 对应文件名，例如 "buffett-letter-1980" -> "buffett-letter-1980.docx"
 */
export function getDocumentFileName(articleId: string): string {
  return `${articleId}.docx`;
}

/**
 * 从 Word 文档加载文章内容
 */
export async function loadArticleFromWord(articleId: string): Promise<string | null> {
  try {
    const fileName = getDocumentFileName(articleId);
    const filePath = path.join(getDocumentsDirectory(), fileName);
    
    if (!documentExists(fileName)) {
      console.log(`[WordLoader] 文档不存在: ${fileName}`);
      return null;
    }
    
    const content = await loadWordDocument(filePath);
    return content;
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
