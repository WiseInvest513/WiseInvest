# ETF 迁入文章：编辑与配图复核

日期：2026-11-06。范围仅为本轮迁入的六篇 ETF 知识文；未发布、未推送。

## 修改

- 重做 6 张独立银白玻璃列表封面，每张约 8–14 KB；新增 6 张米白、深蓝、金色的正文概念图，每张约 18–32 KB。
- 主体由内置 image_gen 生成；使用原始 Wise 签名资产进行最终品牌导出。原图、完整提示词与来源记录见 `../../assets/source-images/etf-learning/image-generation.json`。
- 合并重复论述，重写逐篇导读与结尾；外部资料集中到文末，保留真实学习链接及工具入口。原来源逐篇保存在本目录的 original-sources.json。
- 产品一览移除异日期规模与单年度排名快照，保留十只产品身份、分类和读表方法；回撤文保留有口径的历史事件表。
- 旧图片原文件保留，收益与溢价算例 SVG 继续用于计算说明。

## 阅读预览

| 文章 | 本地路径 | URL 链接数（原稿→现稿） |
| --- | --- | --- |
| etf-how-it-works | http://127.0.0.1:3002/articles/index/OOy6MP9A | 31 → 3 |
| etf-major-products | http://127.0.0.1:3002/articles/index/ekPFyBVH | 54 → 4 |
| etf-nasdaq-vs-sp500 | http://127.0.0.1:3002/articles/index/OYI4svII | 12 → 2 |
| etf-premium-nav | http://127.0.0.1:3002/articles/index/ammF22zK | 7 → 2 |
| etf-understand-returns | http://127.0.0.1:3002/articles/index/E4W4l3nh | 11 → 1 |
| etf-historical-drawdowns | http://127.0.0.1:3002/articles/index/Cor9u5oW | 10 → 1 |

链接数按 http(s) 形式计数，原稿中包括主站的绝对 URL；现稿主站链接采用相对路径，ETF 工具外链仍保留。

## 验证

流程：主站指数目录 → 六篇文章 → 正文配图/资料/下一篇；图像点击后出现放大对话框。

| 检查 | 结果 |
| --- | --- |
| 页面身份、非空正文、框架错误层 | 六篇状态 200、标题匹配、全文图片解码；无框架报错 |
| 封面 | 六张均在实际指数文章列表解码 |
| 图片放大 | 点击正文图后出现对话框 |
| 手机 | 390px 与 320px 无整页横向溢出，宽表格可滚动 200px |
| 深色 | 查看正文配图与文字，保留现有配色 |
| 目录/导读/图片/预览/邀请卡测试 | 45 项通过 |
| TypeScript | tsc --noEmit --incremental false 通过 |
| 全站文章校验 | 71 篇、0 错误；Bybit 旧文章 7 个编号提示，未改无关内容 |
| 列表元信息审阅 | 71 篇，0 篇待检查 |
| 控制台 | 本地 Vercel analytics CSP 拦截；模拟登录的 activity/content-library 请求为 401，正文访问单独通过 |

Browser plugin not available；使用已有 Chrome / Playwright。本次未测试生产环境账号、支付或部署。没有在共享开发服务的 .next 目录运行生产构建。

## 证据与哈希

- `review.json`：逐篇审阅、文章/计划/封面/正文图 SHA256。
- `plans.json`：改写前拟定的逐篇导读与大纲。
- `qa.json`：真实页面、图像与手机检查结果。
- 本机截图：`/tmp/wise-etf-editorial/desktop-illustration.png`、`mobile-390-image.png`、`mobile-320-table.png`、`covers-desktop.png`。

历史表已与原蓝皮书相关记录对照，未重新下载市场全量序列计算。产品费用和规模不在本轮冒充最新数据。
