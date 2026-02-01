const fs = require('fs');
const path = require('path');

async function convertPdfToMarkdown(pdfPath, outputPath) {
  try {
    console.log(`正在读取 PDF: ${pdfPath}`);
    
    // 动态导入 pdf-parse (ES module)
    const pdfModule = await import('pdf-parse');
    
    // pdf-parse 可能导出为 default 或者直接导出函数
    // 根据实际测试，它导出一个对象，我们需要找到正确的函数
    let pdfParse;
    
    // 读取 PDF 文件
    const dataBuffer = fs.readFileSync(pdfPath);
    
    let data;
    
    // pdf-parse v2 使用新的 API
    // 需要将 buffer 转换为 data URL 或使用文件路径
    if (pdfModule.PDFParse) {
      // 方法1: 使用文件路径（如果支持）
      try {
        const parser = new pdfModule.PDFParse({ url: `file://${pdfPath}` });
        const result = await parser.getText();
        data = {
          text: result.text || result,
          numpages: result.numpages || result.pages?.length || 0
        };
      } catch (e) {
        // 方法2: 将 buffer 转换为 base64 data URL
        const base64 = dataBuffer.toString('base64');
        const dataUrl = `data:application/pdf;base64,${base64}`;
        const parser = new pdfModule.PDFParse({ url: dataUrl });
        const result = await parser.getText();
        data = {
          text: result.text || result,
          numpages: result.numpages || result.pages?.length || 0
        };
      }
    } else {
      throw new Error('无法找到 PDFParse 类。请检查 pdf-parse 版本。');
    }
    
    return processText(data, outputPath);
  } catch (error) {
    console.error('❌ 转换失败:', error);
    throw error;
  }
}

function processText(data, outputPath) {
  console.log(`PDF 页数: ${data.numpages}`);
  console.log(`提取文本长度: ${data.text.length} 字符`);
  
  // 获取文本内容
  let text = data.text;
  
  // 识别并转换"第X篇"为一级标题
  // 匹配模式：第X篇、第X篇演讲、第X篇：等
  // 支持中文数字和阿拉伯数字
  const chineseNumbers = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
  };
  
  // 转换中文数字为阿拉伯数字
  function convertChineseNumber(str) {
    if (chineseNumbers[str]) {
      return chineseNumbers[str];
    }
    // 如果是阿拉伯数字，直接返回
    const num = parseInt(str);
    if (!isNaN(num)) {
      return num;
    }
    return str;
  }
  
  // 匹配"第X讲"或"第X篇"模式，X可以是中文数字或阿拉伯数字
  // 先处理"芒格十大演讲第X讲：标题"这样的完整格式
  text = text.replace(/芒格十大演讲第([一二三四五六七八九十\d]+)讲[：:：]?\s*(.*?)(?=\n|$)/g, (match, num, title) => {
    const number = convertChineseNumber(num);
    const cleanTitle = title.trim();
    
    // 返回一级标题格式
    return `\n# 第${number}篇${cleanTitle ? '：' + cleanTitle : ''}\n\n`;
  });
  
  // 再处理单独的"第X讲：标题"格式（避免重复匹配）
  text = text.replace(/(?<!芒格十大演讲)第([一二三四五六七八九十\d]+)讲[：:：]?\s*(.*?)(?=\n\n|第[一二三四五六七八九十\d]+(讲|篇)|$)/gs, (match, num, title) => {
    // 检查是否已经是标题格式（避免重复处理）
    if (match.trim().startsWith('#')) {
      return match;
    }
    const number = convertChineseNumber(num);
    const cleanTitle = title.trim();
    
    // 返回一级标题格式
    return `\n# 第${number}篇${cleanTitle ? '：' + cleanTitle : ''}\n\n`;
  });
  
  // 处理"第X篇"模式（如果存在）
  text = text.replace(/第([一二三四五六七八九十\d]+)篇[：:：]?\s*(.*?)(?=\n\n|第[一二三四五六七八九十\d]+(讲|篇)|$)/gs, (match, num, title) => {
    // 检查是否已经是标题格式（避免重复处理）
    if (match.trim().startsWith('#')) {
      return match;
    }
    const number = convertChineseNumber(num);
    const cleanTitle = title.trim();
    
    // 返回一级标题格式
    return `\n# 第${number}篇${cleanTitle ? '：' + cleanTitle : ''}\n\n`;
  });
  
  // 清理多余的空白行（保留段落之间的单个空行）
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // 清理行首行尾的空白
  text = text.split('\n').map(line => line.trim()).join('\n');
  
  // 清理单独的 "#" 行（没有内容的标题标记）
  text = text.replace(/^#\s*$/gm, '');
  
  // 清理连续的 "#" 行
  text = text.replace(/\n#\n#/g, '\n#');
  
  // 再次清理多余的空白行
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // 移除开头的空白行和单独的 "#"
  text = text.replace(/^#\s*$/gm, ''); // 移除所有单独的 "#" 行
  text = text.replace(/^\s*\n+/g, ''); // 移除开头的空白行
  text = text.trim();
  
  // 保存为 Markdown 文件
  fs.writeFileSync(outputPath, text, 'utf-8');
  
  console.log(`✅ 转换完成！已保存到: ${outputPath}`);
  console.log(`📄 文件大小: ${text.length} 字符`);
  
  return text;
}

// 主函数
async function main() {
  const pdfPath = path.join(process.cwd(), 'lib/anthology/documents/munger/speeches/查理-芒格十大演讲.pdf');
  const outputPath = path.join(process.cwd(), 'lib/anthology/documents/munger/speeches/查理-芒格十大演讲.md');
  
  await convertPdfToMarkdown(pdfPath, outputPath);
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertPdfToMarkdown };
