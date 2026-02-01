const fs = require('fs');
const path = require('path');

/**
 * 改进版 PDF 转 Markdown 脚本 - 支持图片提取
 * 使用 pdfjs-dist 提取文本和图片
 */
async function convertPdfToMarkdownWithImages(pdfPath, outputPath) {
  try {
    console.log(`📄 正在读取 PDF: ${pdfPath}`);
    
    // 使用 legacy build（Node.js 环境）
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjs = pdfjsLib.default || pdfjsLib;
    
    // 设置 worker（Node.js 环境）
    if (pdfjs.GlobalWorkerOptions) {
      pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.js');
    }
    
    // 读取 PDF 文件
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // 加载 PDF 文档
    const loadingTask = pdfjs.getDocument({ data: dataBuffer });
    const pdfDocument = await loadingTask.promise;
    
    console.log(`📊 PDF 总页数: ${pdfDocument.numPages}`);
    
    let allText = '';
    const images = []; // 存储图片信息 [{ page, index, base64, type }]
    
    // 逐页处理
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      console.log(`📖 处理第 ${pageNum}/${pdfDocument.numPages} 页...`);
      
      const page = await pdfDocument.getPage(pageNum);
      
      // 提取文本
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (pageText) {
        allText += `\n\n--- 第 ${pageNum} 页 ---\n\n${pageText}`;
      }
      
      // 提取图片
      const operatorList = await page.getOperatorList();
      const imagePromises = [];
      
      // 遍历操作符，查找图片
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        const op = operatorList.fnArray[i];
        
        // 查找图片操作符（Do 操作符）
        if (op === pdfjs.OPS.paintImageXObject || op === pdfjs.OPS.paintJpegXObject) {
          const imageName = operatorList.argsArray[i][0];
          
          // 获取图片对象
          const imageObj = await page.objs.get(imageName);
          
          if (imageObj && imageObj.data) {
            // 将图片数据转换为 base64
            const imageData = imageObj.data;
            let base64;
            let imageType = 'png';
            
            if (Buffer.isBuffer(imageData)) {
              base64 = imageData.toString('base64');
            } else if (imageData instanceof Uint8Array) {
              base64 = Buffer.from(imageData).toString('base64');
            } else {
              // 尝试其他格式
              base64 = Buffer.from(imageData).toString('base64');
            }
            
            // 检测图片类型
            if (imageObj.width && imageObj.height) {
              // JPEG 通常有特定的标记
              if (imageData[0] === 0xFF && imageData[1] === 0xD8) {
                imageType = 'jpeg';
              }
            }
            
            images.push({
              page: pageNum,
              index: images.filter(img => img.page === pageNum).length,
              base64: base64,
              type: imageType,
              width: imageObj.width || 0,
              height: imageObj.height || 0
            });
            
            // 在文本中插入图片标记
            const imageMarkdown = `\n\n![第${pageNum}页图片${images.filter(img => img.page === pageNum).length + 1}](data:image/${imageType};base64,${base64})\n\n`;
            allText += imageMarkdown;
          }
        }
      }
    }
    
    // 处理文本格式
    const markdown = processText(allText, pdfDocument.numPages);
    
    // 保存 Markdown 文件
    fs.writeFileSync(outputPath, markdown, 'utf-8');
    
    console.log(`✅ 转换完成！`);
    console.log(`📄 已保存到: ${outputPath}`);
    console.log(`📊 提取了 ${images.length} 张图片`);
    console.log(`📝 文本长度: ${markdown.length} 字符`);
    
    return markdown;
  } catch (error) {
    console.error('❌ 转换失败:', error);
    throw error;
  }
}

function processText(text, numPages) {
  // 识别并转换"第X篇"为一级标题
  const chineseNumbers = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
    '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
  };
  
  function convertChineseNumber(str) {
    if (chineseNumbers[str]) {
      return chineseNumbers[str];
    }
    const num = parseInt(str);
    if (!isNaN(num)) {
      return num;
    }
    return str;
  }
  
  // 匹配"第X讲"或"第X篇"模式
  text = text.replace(/芒格十大演讲第([一二三四五六七八九十\d]+)讲[：:：]?\s*(.*?)(?=\n|$)/g, (match, num, title) => {
    const number = convertChineseNumber(num);
    const cleanTitle = title.trim();
    return `\n# 第${number}篇${cleanTitle ? '：' + cleanTitle : ''}\n\n`;
  });
  
  text = text.replace(/(?<!芒格十大演讲)第([一二三四五六七八九十\d]+)讲[：:：]?\s*(.*?)(?=\n\n|第[一二三四五六七八九十\d]+(讲|篇)|$)/gs, (match, num, title) => {
    if (match.trim().startsWith('#')) {
      return match;
    }
    const number = convertChineseNumber(num);
    const cleanTitle = title.trim();
    return `\n# 第${number}篇${cleanTitle ? '：' + cleanTitle : ''}\n\n`;
  });
  
  text = text.replace(/第([一二三四五六七八九十\d]+)篇[：:：]?\s*(.*?)(?=\n\n|第[一二三四五六七八九十\d]+(讲|篇)|$)/gs, (match, num, title) => {
    if (match.trim().startsWith('#')) {
      return match;
    }
    const number = convertChineseNumber(num);
    const cleanTitle = title.trim();
    return `\n# 第${number}篇${cleanTitle ? '：' + cleanTitle : ''}\n\n`;
  });
  
  // 清理多余的空白行
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.split('\n').map(line => line.trim()).join('\n');
  text = text.replace(/^#\s*$/gm, '');
  text = text.replace(/\n#\n#/g, '\n#');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/^#\s*$/gm, '');
  text = text.replace(/^\s*\n+/g, '');
  text = text.trim();
  
  return text;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node pdf-to-markdown-with-images.js <PDF文件路径> [输出MD文件路径]');
    console.log('示例: node pdf-to-markdown-with-images.js ./file.pdf ./output.md');
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
  
  await convertPdfToMarkdownWithImages(pdfPath, outputPath);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { convertPdfToMarkdownWithImages };
