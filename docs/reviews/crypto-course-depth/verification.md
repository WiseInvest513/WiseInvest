# 加密入门课程第二轮内容验收

日期：2026-11-23。当前系列为 14 篇主线课、2 篇按需专题、6 个阶段。

## 内容范围

新增价格/市值/供给/深度、稳定币与赎回、区块浏览器查账、综合练习四篇。逐篇导读与大纲先 prepare，正文 compose/check 后人工复核，再 finalize；哈希与审阅说明见同目录 JSON。

局部修正七篇旧文：法币入口不再一律指向 C2C；网络示例与钱包能力分开；移除没有依据的冻卡概率承诺；调整前后课衔接和重复卡片。具体改动及前后稿哈希见 existing-article-updates.json。保留既有 ID、路由、发布时间和邀请权益。

四张封面均为 640×360 WebP、质量 60、13—16 KB，主题文字及原始品牌签名已目视复核。源图保留在 assets/source-images/article-covers/，提示词记录见 docs/image-prompts/crypto-course-depth.json。封面未插入正文。

## 浏览器验收

Browser 插件不可用，使用 Playwright 驱动独立 Chrome 会话，访问 http://127.0.0.1:3002；没有登录或使用管理员预览。桌面 1600×1000、手机 390×844、窄屏 320×740。

以下 11 篇均状态 200、标题一致、正文全部 H2 与原稿一致、末节可见、没有截断或预览遮罩。共检查 80 张本站引用卡及 84 张图片解码。

| 文章 ID | 完整 H2 | 站内卡片 | 图片 |
| --- | --- | --- | --- |
| crypto-market-basics | 7 | 2 | 2 |
| crypto-stablecoin-basics | 7 | 3 | 3 |
| crypto-explorer-reading | 7 | 3 | 3 |
| crypto-practice-check | 7 | 8 | 8 |
| crypto-first-steps | 8 | 15 | 16 |
| crypto-buying-platforms | 7 | 18 | 19 |
| crypto-transfer-basics | 7 | 8 | 9 |
| crypto-wallet-first-use | 8 | 2 | 2 |
| crypto-wallet-permissions | 7 | 3 | 3 |
| crypto-spot-futures | 8 | 9 | 10 |
| crypto-c2c-freeze | 7 | 9 | 9 |

实际点击验证：概览进入价格课；价格→稳定币→购买入口；转账→查账→钱包；授权→综合练习。系列参数保留。手机本篇目录定位计算题，目标标题未被固定栏遮挡；系列目录默认展开当前阶段，切换到稳定币后刷新仍保留系列。全屏进入/退出正常，深色与 320px 页面没有横向撑宽。

另以无 series 参数的综合练习入口验证完整匿名阅读；手机表格经鼠标横向滚动，scrollLeft 从 0 到 284，内容宽 640、容器宽 356。宽表格在容器内可滑动。

浏览器无 pageerror 或本次相关 console error。已有匿名账户接口 401 与 Vercel Analytics CSP 提示仍存在，未视为本轮新增问题。

本地证据：/private/tmp/crypto-depth-qa.json、/private/tmp/crypto-depth-table-qa.json；已目视检查 overview、desktop、mobile-calculation、mobile-directory、small-table 截图。验收不代表线上部署已成功。

## 代码和发布检查

- 新稿四篇严格检查全部通过，静态访问 PUBLIC，无警告。
- TypeScript 检查通过：npx tsc --noEmit --incremental false。
- 图片元信息生成通过：853 张、0 skipped；生成结果无额外文件差异。
- 十个相关文章测试文件：92 项，78 通过、14 失败。失败名称与第一轮提交前留存结果完全一致；本轮更新课程下一篇断言后没有新增失败。导读、邀请卡、公开访问、图片、预览及阅读推荐相关检查通过。
- 首次 article:validate 发现两篇已有股票文章的14项门禁错误。提交前获取并合入远端 de9577f 与187e78b：前者按用户要求记录无封面例外并修正章节，后者更新日历。重新校验116篇，0错误、0提示。
- 合入后 article:audit 检查116篇，0篇需检查。
- 在 /private/tmp/crypto-depth-build-20261123 创建独立的已跟踪代码副本，依赖和public素材只读复用；生产构建不与开发预览共用 .next。文章、图片与350项日历前置检查均通过；npm run build 退出0，编译成功、类型检查通过、123/123静态页面生成完成。构建日志：/private/tmp/crypto-depth-build.log。
- 合入远端门禁改动后，额外运行 article-validation 与 article-gallery 两个测试文件：33项，32通过、1失败。失败是5张历史未引用封面仍在public目录，与四张新封面无关；新封面映射和文章ID一一对应。
- git diff --check 通过。

既有测试失败分组：5 项文章/系列预期过期，1 项 ai-bubble-45-days 旧站内引用未转换，8 项 TOC 测试 harness 缺少 @/lib/articles mock。保留为独立维护事项，不以跳过门禁掩盖。

历史封面测试报告的文件为 chatgpt-how-to-subscribe.webp、chatgpt-which-card.webp、claude-how-to-subscribe.webp、series-chatgpt-subscribe-title-v2.webp、ucard-comparison-title-v2.webp；本轮未改动这些文件或其映射，不删除历史图片来掩盖测试。
