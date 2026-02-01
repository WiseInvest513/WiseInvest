const fs = require('fs');
const path = require('path');

/**
 * 增强版 PDF 转 Markdown 脚本
 * 使用 pdf-parse 提取文本，改进格式处理
 * 保留格式信息（加粗、居中、图片位置等）
 */
async function convertPdfToMarkdownEnhanced(pdfPath, outputPath) {
  try {
    console.log(`📄 正在读取 PDF: ${pdfPath}`);
    
    // 使用 pdf-parse 提取文本
    const pdfParseModule = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(pdfPath);
    
    let textData;
    try {
      const parser = new pdfParseModule.PDFParse({ url: `file://${pdfPath}` });
      const result = await parser.getText();
      textData = {
        text: result.text || result,
        numpages: result.numpages || result.pages?.length || 0
      };
    } catch (e) {
      const base64 = dataBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64}`;
      const parser = new pdfParseModule.PDFParse({ url: dataUrl });
      const result = await parser.getText();
      textData = {
        text: result.text || result,
        numpages: result.numpages || result.pages?.length || 0
      };
    }
    
    console.log(`📊 PDF 总页数: ${textData.numpages}`);
    console.log(`📝 提取文本长度: ${textData.text.length} 字符`);
    
    // 处理文本，保留格式信息
    const markdown = processTextWithFormatting(textData.text, textData.numpages);
    
    // 保存 Markdown 文件
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`✅ 转换完成！`);
    console.log(`📄 已保存到: ${outputPath}`);
    console.log(`📝 文件大小: ${markdown.length} 字符`);
    
    return markdown;
  } catch (error) {
    console.error('❌ 转换失败:', error);
    throw error;
  }
}

function processTextWithFormatting(text, numPages) {
  let markdown = text;
  
  // 1. 清理页码标记（如 "-- 2 of 28 --"）
  markdown = markdown.replace(/--\s*\d+\s+of\s+\d+\s+--/g, '');
  markdown = markdown.replace(/^\d+$/gm, ''); // 删除单独的数字行（页码）
  
  // 2. 清理过多的加粗标记（先清理，再重新识别）
  markdown = markdown.replace(/\*\*/g, ''); // 先移除所有加粗标记
  
  // 3. 识别标题和段落
  const lines = markdown.split('\n');
  const processedLines = [];
  let lastWasTitle = false; // 跟踪上一行是否是标题
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    
    // 跳过空行和页码
    if (!line || /^\d+$/.test(line)) {
      if (lastWasTitle) {
        processedLines.push(''); // 标题后添加空行
        lastWasTitle = false;
      }
      continue;
    }
    
    // 识别主标题（文档开头的短行）
    if (i < 10 && line.length > 0 && line.length < 50 && 
        !line.includes('。') && !line.includes('，') && !line.includes('年') &&
        (nextLine === '' || nextLine.length < 30 || nextLine.match(/^\d{4}/))) {
      if (line.match(/^[A-Z\u4e00-\u9fa5]+/)) {
        processedLines.push(`\n# ${line}\n`);
        lastWasTitle = true;
        continue;
      }
    }
    
    // 识别二级标题（以"一、二、三"或数字开头）
    if (line.match(/^[一二三四五六七八九十\d]+[、.．]/) && line.length < 150) {
      processedLines.push(`\n## ${line}\n`);
      lastWasTitle = true;
      continue;
    }
    
    // 识别三级标题（以括号数字开头）
    if (line.match(/^[（(]\d+[）)]/) && line.length < 100) {
      processedLines.push(`\n### ${line}\n`);
      lastWasTitle = true;
      continue;
    }
    
    // 处理普通段落
    if (line.length > 0) {
      let cleanedLine = line;
      
      // 识别并加粗重要概念（短词、专有名词）
      const importantTerms = [
        '价值投资', '资产管理', '股票', '债券', '现金', '通货膨胀', '复利',
        '受托人责任', 'Fiduciary duty', '基金经理', '客户', '财富', '回报'
      ];
      
      importantTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'g');
        cleanedLine = cleanedLine.replace(regex, '**$1**');
      });
      
      // 处理列表项
      if (cleanedLine.match(/^[•·\-\*]\s/)) {
        processedLines.push(cleanedLine);
      } else if (cleanedLine.match(/^\d+[\.、]\s/)) {
        processedLines.push(cleanedLine);
      } else {
        // 普通段落
        // 判断是否是段落首行（上一行是空行、标题、或段落结尾）
        const lastProcessedLine = processedLines.length > 0 ? processedLines[processedLines.length - 1] : '';
        const isNewParagraph = !lastProcessedLine || 
                               lastProcessedLine.trim() === '' || 
                               lastProcessedLine.match(/^#/) ||
                               (prevLine && (prevLine.endsWith('。') || prevLine.endsWith('！') || prevLine.endsWith('？')));
        
        if (isNewParagraph && lastProcessedLine && lastProcessedLine.trim() !== '' && !lastProcessedLine.match(/^#/)) {
          processedLines.push(''); // 添加空行分隔段落
        }
        
        // 段落首行添加两个空格缩进（中文排版习惯）
        // 但标题、列表项不需要缩进
        if (!cleanedLine.match(/^[#\-\d•·\*]/) && cleanedLine.length > 0) {
          // 判断是否是段落首行
          // 1. 文档开头
          // 2. 上一行是空行
          // 3. 上一行是标题（#开头或lastWasTitle标记）
          // 4. 上一行是段落结尾（。！？）
          const prevProcessedLine = processedLines.length > 0 ? processedLines[processedLines.length - 1] : '';
          const shouldIndent = processedLines.length === 0 || 
                               prevProcessedLine.trim() === '' ||
                               lastWasTitle ||
                               prevProcessedLine.match(/^#/) ||
                               (prevLine && (prevLine.endsWith('。') || prevLine.endsWith('！') || prevLine.endsWith('？')));
          if (shouldIndent) {
            cleanedLine = '  ' + cleanedLine; // 添加两个空格缩进
          }
          lastWasTitle = false; // 重置标题标记
        }
        processedLines.push(cleanedLine);
      }
    }
  }
  
  markdown = processedLines.join('\n');
  
  // 3. 清理多余的加粗标记
  // 移除连续的加粗标记
  markdown = markdown.replace(/\*\*\*\*/g, '');
  markdown = markdown.replace(/\*\*([^*\n]{50,})\*\*/g, '$1'); // 移除长文本的加粗
  
  // 4. 识别并处理加粗文本（保留合理的加粗）
  // 短词、专有名词、重要概念可以加粗
  markdown = markdown.replace(/([A-Z\u4e00-\u9fa5]{2,10})(?=\s|，|。|、|：|；)/g, (match) => {
    // 常见的重要概念加粗
    const importantTerms = ['价值投资', '资产管理', '股票', '债券', '现金', '通货膨胀', '复利'];
    if (importantTerms.some(term => match.includes(term))) {
      return `**${match}**`;
    }
    return match;
  });
  
  // 5. 清理多余的空白行（保留段落之间的单个空行）
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  // 6. 处理段落分隔（确保段落结尾后有适当的空行）
  markdown = markdown.replace(/([。！？])\n([^\n])/g, '$1\n\n$2');
  
  // 7. 最终清理
  markdown = markdown.trim();
  
  return markdown;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node pdf-to-markdown-enhanced.js <PDF文件路径> [输出MD文件路径]');
    console.log('示例: node pdf-to-markdown-enhanced.js ./file.pdf ./output.md');
    process.exit(1);
  }
  
  const pdfPath = path.resolve(args[0]);
  const outputPath = args[1] 
    ? path.resolve(args[1])
    : pdfPath.replace(/\.pdf$/i, '.md');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF 文件不存在: ${pdfPath}`);
    process.exit(1);
  }
  
  await convertPdfToMarkdownEnhanced(pdfPath, outputPath);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertPdfToMarkdownEnhanced };
