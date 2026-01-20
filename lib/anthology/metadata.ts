import type { Author } from "./types";

/**
 * 文集元数据（轻量级，用于列表显示和搜索）
 * 不包含文章内容，只包含 id 和 title
 * 这个文件会被预先加载，用于快速显示文章列表
 */
export const knowledgeBaseMetadata: Author[] = [
  {
    name: "段永平 (Duan Yongping)",
    categories: [
      {
        name: "商业逻辑",
        articles: [
          { id: "duan-business-1", title: "不做错事是最大的事情" },
          { id: "duan-business-2", title: "本分是核心价值观" },
        ],
      },
      {
        name: "投资语录",
        articles: [
          { id: "duan-invest-1", title: "买股票就是买公司" },
          { id: "duan-invest-2", title: "不懂不碰" },
        ],
      },
    ],
  },
  {
    name: "巴菲特 (Buffett)",
    categories: [
      {
        name: "1、股东大会",
        articles: [
          { id: "1957-1967股东大会", title: "1957-1967股东大会" },
          { id: "1968-1978 股东大会", title: "1968-1978股东大会" },
          { id: "1979-1989 股东大会", title: "1979-1989股东大会" },
          { id: "1990-2000 股东大会", title: "1990-2000股东大会" },
          { id: "2001-2010 股东大会", title: "2001-2010股东大会" },
          { id: "2011-2021 股东大会", title: "2011-2021股东大会" },
          { id: "2022-2025股东大会", title: "2022-2025股东大会" },
        ],
      },
      {
        name: "2、演讲合集",
        articles: [
          { id: "buffett-speech-test2", title: "测试2", path: "buffett/speeches/测试2.docx" },
        ],
      },
      {
        name: "3、名言合集",
        articles: [
          { id: "buffett-quote-test1", title: "测试1", path: "buffett/quotes/测试 1.docx" },
        ],
      },
    ],
  },
];

