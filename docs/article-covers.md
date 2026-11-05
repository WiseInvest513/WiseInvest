# 文章列表封面

## 使用范围

2026-11-05：60 篇文章中，58 篇使用集中管理的轻量封面；2 篇 BIT 按用户要求保留原图。26 张为本轮新制作（包含先前通过的 3 张样图），32 张保留已有银白玻璃画面，只制作轻量副本。

同日新增 `binance-referral`：在上述首批基础上新增 1 篇文章与 1 张集中封面（本批共覆盖 61 篇，其中 59 张集中轻量封面、2 张 BIT 保留原图；不含其他并行新增文章）。币安补绑封面经品牌差异化修订，改以真实 Binance 标志为主体；640×360 WebP，16,330 字节（约 15.9 KiB），只用于文章列表。旧通用主体原稿保留为 `assets/source-images/article-covers/binance-referral-v1-generic.png`。

继续新增 `bitget-referral`：使用真实 Bitget 交易所双向折角标志（不是 Bitget Wallet），保留青绿品牌色；640×360 WebP，17,186 字节（约 16.8 KiB）。本次只增加新文章列表封面，不覆盖既有 `bitget-exchange` 封面。原稿保存在 `assets/source-images/article-covers/bitget-referral.png`。

- 列表图：`public/images/articles/covers/<article-id>.webp`。
- 唯一映射：`lib/article-covers.ts` 中的 `articleCovers`，包含路径、alt 和主题标签。
- BIT 例外也在同一文件的 `preservedArticleCovers` 明确配置，沿用原 PNG URL。
- 新生成原稿：`assets/source-images/article-covers/<article-id>.png`，不对网页公开、不随列表加载。
- 原有分类文件夹中的 WebP 保留兼容历史链接，但文章列表只引用新的集中小图。

封面只用于文章列表，不插入正文、不替换教程截图、不改变详情页和 SEO/OG 图片。列表不再从正文第一张图片推断封面；新文章必须补充映射，没有配置时显示现有占位样式。

## 尺寸与加载

- 等比缩小至约 640×360，保留完整标题、主体与品牌，不裁切或拉伸。
- WebP：quality 60、effort 6、smartSubsample true，优先 10–20 KB，上限 25,000 字节。
- 首批 58 张总计 1,017,252 字节，平均 17,539 字节；范围 12,534–23,716 字节。
- 新增并修订币安补绑封面后，59 张总计 1,033,582 字节，平均约 17,518 字节；最大值仍为 23,716 字节。
- 再加入 Bitget 补绑/换绑封面后，上述批次 60 张共 1,050,768 字节，平均约 17,513 字节；不含其他并行新增素材。
- 新制 26 张共 386,862 字节，单张 12,534–16,546 字节。
- 原有 32 张从总计 3,406,290 字节降至 630,390 字节（约减少 81.5%），画面内容不变。
- `ArticleCard` 对集中小图直接加载，不经过 Next 再压缩/放大；容器维持 16:9 并完整显示图片，避免布局跳动和裁掉品牌。
- 首两张维持优先加载，其余图片懒加载。BIT 原图维持现有 Next 响应式优化。

机械导出使用项目现有 Sharp：

```js
await sharp(source)
  .resize({ width: 640, withoutEnlargement: true })
  .webp({ quality: 60, effort: 6, smartSubsample: true })
  .toFile(destination);
```

## 生成与品牌记录

新图采用内置 `image_gen`，沿用批准的 Wise 银白玻璃样图。品牌源图为 `public/images/brand/wise-invest-signature.png`，完整文字与人物作为小型右上角圆角签名参考，不改动品牌源文件。标题使用中性产品/教程描述，不添加未经核实的收益率或活动承诺。

平台主题封面要有各自的辨识度：币安使用项目已有真实 Binance 标志，后续 OKX、Bitget、Bybit、Gate 分别使用各自经核对的品牌图标，不反复套用账户卡、日历等通用主体。保持统一的是银白玻璃材质、克制金色、深蓝标题和右上角完整 Wise 小标识，不是把所有产品画成同一张图。原始平台标志的形状、比例、颜色不能凭记忆改画；可为准确轮廓增加立体材质，不能把概念封面伪装成产品真实界面。币安当前参考为 `public/images/perks/overview/binance.svg`；同名 favicon PNG 为空文件，不作素材来源。

完整提示词、主题、原图路径、尺寸、字节数与逐图检查记录：

- `docs/image-prompts/article-covers-priority.json`：3 张已批准样图。
- `docs/image-prompts/article-covers-guides.json`：7 张平台、网站和手机卡指南。
- `docs/image-prompts/article-covers-cards.json`：6 张虚拟卡指南。
- `docs/image-prompts/article-covers-accounts.json`：6 张银行指南。
- `docs/image-prompts/article-covers-brokers.json`：4 张券商指南。
- `docs/image-prompts/article-covers-retained.json`：32 张保留画面的压缩前后路径和体积。
- `docs/image-prompts/article-cover-binance-referral.json`：币安邀请码补绑系列首篇封面、生成提示词与小图验收。
- `docs/image-prompts/article-cover-bitget-referral.json`：Bitget 邀请码漏填/换绑封面、真实交易所标志参考与轻量小图验收。
- `docs/article-cover-prompts.json`：上一批 30 张画面的历史生成提示词，网页路径已更新至集中目录。

## 后续维护

2026-11-05 补齐 `nasdaq-investment-guide`（`/articles/index/gCSTzdEB`）列表封面：640×360 WebP，22,196 字节。内置 image_gen 生成主题画面，原始品牌签名按比例合成于右上角；只绑定列表，不加入正文。生成与压缩记录见 `docs/image-prompts/article-cover-nasdaq-investment-guide.json`。

1. 以稳定文章 ID 命名封面，不改文章 ID 或路由。
2. 原稿归档于 `assets/source-images/article-covers/`，仅轻量 WebP 放入公开目录。
3. 在 `lib/article-covers.ts` 添加对应的 `src`、`alt`、`topics`。
4. 更新相应提示词记录；检查桌面和手机端标题、品牌完整性。
5. 运行 `node --test tests/article-gallery.test.mjs`，检查全量映射、尺寸、体积、两篇 BIT 例外以及正文隔离。

已知原文问题不属于本轮封面改动：`jianhang` 正文是建行亚洲，但原文章标题写成工银亚洲；封面按正文使用“建行亚洲”，本轮未改原文。
