import type { Section } from "./types";

/**
 * 文集元数据（轻量级，用于列表显示和搜索）
 * 不包含文章内容，只包含 id 和 title
 * 这个文件会被预先加载，用于快速显示文章列表
 */
export const knowledgeBaseMetadata: Section[] = [
  {
    name: "名人文章",
    authors: [
      {
        name: "段永平",
    categories: [
      {
        name: "1、商业逻辑",
        articles: [
          { id: "duan-business-1998_段永平对步步高所有营销人员的讲话", title: "1998年段永平对步步高所有营销人员的讲话", path: "duan/business/1998_段永平对步步高所有营销人员的讲话.md" },
          { id: "duan-business-1999_段永平", title: "1999年段永平：遵循本分，用平常心迎接21世纪", path: "duan/business/1999_段永平.md" },
          { id: "duan-business-2011年段永平学长在浙江大学的毕业演讲", title: "2011年段永平学长在浙江大学的毕业演讲", path: "duan/business/2011年段永平学长在浙江大学的毕业演讲.md" },
          { id: "duan-business-2018段永平斯坦福大学53问", title: "2018年段永平斯坦福大学53问", path: "duan/business/2018段永平斯坦福大学53问.md" },
          { id: "duan-business-2025段永平方略访谈", title: "2025年段永平方略访谈", path: "duan/business/2025段永平方略访谈.md" },
          { id: "duan-business-2025段永平浙大", title: "2025年段永平1月5日浙大师生见面会问答实录", path: "duan/business/2025段永平浙大.md" },
          { id: "duan-business-段永平论快乐人生", title: "段永平论快乐人生", path: "duan/business/段永平论快乐人生.md" },
        ],
      },
      {
        name: "2、投资语录",
        articles: [
          { id: "duan-invest-段永平 2021 年经典语录", title: "段永平2021年经典语录", path: "duan/investment/段永平 2021 年经典语录.md" },
          { id: "duan-invest-段永平80 条语录", title: "段永平80条语录", path: "duan/investment/段永平80 条语录.md" },
          { id: "duan-invest-段永平语录100条", title: "段永平语录100条", path: "duan/investment/段永平语录100条.md" },
        ],
      },
    ],
      },
      {
        name: "巴菲特",
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
          { id: "buffett-speech-1985巴菲特电视采访", title: "1985年巴菲特电视采访", path: "buffett/speeches/1985巴菲特电视采访.md" },
          { id: "buffett-speech-1990-巴菲特在斯坦福大学的演讲", title: "1990年巴菲特在斯坦福大学的演讲", path: "buffett/speeches/1990年巴菲特在斯坦福大学的演讲.md" },
          { id: "buffett-speech-1991巴菲特对圣母大学对MBA学生的演讲", title: "1991年巴菲特对圣母大学MBA学生的演讲", path: "buffett/speeches/1991巴菲特对圣母大学对MBA学生的演讲.md" },
          { id: "buffett-speech-1998巴菲特在佛罗里达大学商学院的演讲", title: "1998年巴菲特在佛罗里达大学商学院的演讲", path: "buffett/speeches/1998巴菲特在佛罗里达大学商学院的演讲.md" },
          { id: "buffett-speech-1998-巴菲特与比尔盖茨在华盛顿大学的对话", title: "1998年巴菲特与比尔盖茨在华盛顿大学的对话", path: "buffett/speeches/1998年巴菲特与比尔盖茨在华盛顿大学的对话.md" },
          { id: "buffett-speech-2005堪萨斯商学院学生于伯克希尔总部与沃伦·巴菲特的问答", title: "2005年堪萨斯商学院学生于伯克希尔总部与沃伦·巴菲特的问答", path: "buffett/speeches/2005堪萨斯商学院学生于伯克希尔总部与沃伦·巴菲特的问答.md" },
          { id: "buffett-speech-2007-央视专访巴菲特", title: "2007年央视专访巴菲特", path: "buffett/speeches/2007年央视专访巴菲特.md" },
          { id: "buffett-speech-2008巴菲特答Emory与Austin大学商学院学生问巴菲特答", title: "2008年巴菲特答Emory与Austin大学商学院学生问", path: "buffett/speeches/2008巴菲特答Emory与Austin大学商学院学生问巴菲特答.md" },
          { id: "buffett-speech-2010央视财经采访巴菲特", title: "2010年央视财经采访巴菲特", path: "buffett/speeches/2010央视财经采访巴菲特.md" },
          { id: "buffett-speech-2010-CNBC采访巴菲特全文", title: "2010年CNBC采访巴菲特全文", path: "buffett/speeches/2010年CNBC采访巴菲特全文.md" },
          { id: "buffett-speech-2011-巴菲特与南京大学EMBA学生畅言谈投资与人生全中文纪录", title: "2011年巴菲特与南京大学EMBA学生畅言谈投资与人生", path: "buffett/speeches/2011年巴菲特与南京大学EMBA学生畅言谈投资与人生全中文纪录.md" },
          { id: "buffett-speech-2013巴菲特与马里兰大学MBA学生的交流发言", title: "2013年巴菲特与马里兰大学MBA学生的交流发言", path: "buffett/speeches/2013巴菲特与马里兰大学MBA学生的交流发言.md" },
          { id: "buffett-speech-2015沃伦·巴菲特答Ivey商学院MBA学生问沃伦·巴菲特答", title: "2015年沃伦·巴菲特答Ivey商学院MBA学生问", path: "buffett/speeches/2015沃伦·巴菲特答Ivey商学院MBA学生问沃伦·巴菲特答.md" },
          { id: "buffett-speech-2016-巴菲特与8所大学MBA学生见面会的20个问答", title: "2016年巴菲特与8所大学MBA学生见面会的20个问答", path: "buffett/speeches/2016年巴菲特与8所大学MBA学生见面会的20个问答.md" },
          { id: "buffett-speech-2017-CNBC采访巴菲特", title: "2017年CNBC采访巴菲特", path: "buffett/speeches/2017年CNBC采访巴菲特.md" },
          { id: "buffett-speech-2017-哥伦比亚大学——人生最美好的事是什么？巴菲特：没考上哈佛大学", title: "2017年哥伦比亚大学——人生最美好的事是什么？", path: "buffett/speeches/2017年哥伦比亚大学——人生最美好的事是什么？巴菲特：没考上哈佛大学.md" },
          { id: "buffett-speech-2017-巴菲特对话北京大学学生：最好的投资是投资自己", title: "2017年巴菲特对话北京大学学生：最好的投资是投资自己", path: "buffett/speeches/2017年巴菲特对话北京大学学生：最好的投资是投资自己.md" },
          { id: "buffett-speech-2018-巴菲特再度邀请北大光华学子共进午餐问答全记录", title: "2018年巴菲特再度邀请北大光华学子共进午餐问答全记录", path: "buffett/speeches/2018年巴菲特再度邀请北大光华学子共进午餐问答全记录.md" },
          { id: "buffett-speech-2019-5月雅虎财经专访巴菲特", title: "2019年5月雅虎财经专访巴菲特", path: "buffett/speeches/2019年5月雅虎财经专访巴菲特.md" },
          { id: "buffett-speech-2020-沃伦·巴菲特接受CNBC专访", title: "2020年沃伦·巴菲特接受CNBC专访", path: "buffett/speeches/2020年沃伦·巴菲特接受CNBC专访.md" },
          { id: "buffett-speech-2022巴菲特和查理罗斯对谈", title: "2022年巴菲特和查理罗斯对谈", path: "buffett/speeches/2022巴菲特和查理罗斯对谈.md" },
          { id: "buffett-speech-2023-伯克希尔股东大会", title: "2023年伯克希尔股东大会", path: "buffett/speeches/2023年伯克希尔股东大会.md" },
          { id: "buffett-speech-2024-伯克希尔股东大会", title: "2024年伯克希尔股东大会", path: "buffett/speeches/2024年伯克希尔股东大会.md" },
          { id: "buffett-speech-2025-伯克希尔股东大会", title: "2025年伯克希尔股东大会", path: "buffett/speeches/2025年伯克希尔股东大会.md" },
        ],
      },
      {
        name: "3、名言合集",
        articles: [
          { id: "buffett-quote-100条巴菲特经典语录", title: "100条巴菲特经典语录", path: "buffett/quotes/100条巴菲特经典语录.md" },
          { id: "buffett-quote-巴菲特 25句致富名言", title: "巴菲特25句致富名言", path: "buffett/quotes/巴菲特 25句致富名言.md" },
          { id: "buffett-quote-巴菲特经典语录合集", title: "巴菲特经典语录合集", path: "buffett/quotes/巴菲特经典语录合集.md" },
          { id: "buffett-quote-股神巴菲特名言合集", title: "股神巴菲特名言合集", path: "buffett/quotes/股神巴菲特名言合集.md" },
        ],
      },
    ],
      },
    ],
  },
  {
    name: "投资思想",
    authors: [
      // 可以在这里添加投资思想相关的作者和文章
    ],
  },
];

