# 出海系列整理验收 · 2026-11-21

本次将 overseas 教程分成准备总览、常用账号注册、手机号与旅行上网三个阶段。新增 overseas-start 与 overseas-mobile-basics 两篇公开入门文章，保留原有五篇 ID 和路径，Telegram 只作为不可点击的折叠规划。Google 旧文开头改为衔接新的总览。

## 本地检查

- `article:validate`：104 篇，0 错误、0 提示。
- `article:audit`：104 篇，0 篇需要检查。
- TypeScript 检查及本次修改文件的 ESLint 通过。
- 系列定向回归 7 项通过，覆盖阶段、章节顺序、占位跳过、侧栏默认展开与既有路线行为。
- 文章导读、图片、邀请卡、预览、链接卡与系列组合检查：75 项中 69 项通过。6 项既有失败如下，未为了通过而修改无关旧文或删除断言。
- Playwright 使用全新未登录浏览器会话验证：7 个真实文章入口、3 个阶段、TG 折叠且无链接、两篇完整正文、9 个本站引用卡片、前后篇顺序跳过 TG、BeeSIM 注册目标与 7ARAN2JJ 复制、giffgaff 商品链接。1440px 桌面与 390px／320px 手机、深色模式、手机双目录标签和章节锚点均完成检查，无页面异常与整页横向溢出。另抽查 Nasdaq 原有阶段目录。
- 沿用运行中的 3002 开发服务，没有在同一 `.next` 下启动生产构建。本记录不代表远端发布或线上匿名验收。

## 既有失败记录

1. `article-library` 推荐位仍断言 BBAE 旧标题和摘要。
2. `article-library` 系列搜索“开户”的断言未包含 StarryBlu。
3. `article-library` 美股路线仍断言 27 篇，实际已为 28 篇。
4. `article-library` 华美占位后的下一篇断言仍为富途，实际为既有三家美资券商比较文。
5. `article-library` 指数系列断言未包含既有标普中期策略文。
6. `article-link-card` 全库扫描在旧文 `ai-bubble-45-days` 的纳指系列普通链接处失败；本次两篇新文的引用均已在真实页面检查为卡片。

## 图片制作

两张封面由内置 image_gen 独立生成，最终提示词保存在 [overseas-covers-prompts.json](../../../assets/source-images/article-covers/overseas-covers-prompts.json)。原图均为 1672×941，等比装入 640×360 后，在右上角合成原始 `public/images/brand/wise-invest-signature.png`（宽 106px，圆角为标识高度的 20%），以 WebP 质量 60 压缩。无裁字、无拉伸、人物与签名完整。

| 用途 | 网页文件 | 字节数 | 保留原图 |
| --- | --- | --- | --- |
| 准备总览 | `public/images/articles/covers/overseas-start.webp` | 18,974 | `assets/source-images/article-covers/overseas-start-generated.png` |
| 手机号与 eSIM | `public/images/articles/covers/overseas-mobile-basics.webp` | 17,372 | `assets/source-images/article-covers/overseas-mobile-basics-generated.png` |

封面只在列表与系列文章入口使用，不重复插入正文。事实、权益、封面与静态访问审阅详见两篇各自的 `plan.json` 与 `review.json`。
