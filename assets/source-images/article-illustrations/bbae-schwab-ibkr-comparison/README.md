# BBAE、嘉信与 IBKR 正文配图

用于文章 `bbae-schwab-ibkr-comparison`（2026-11-17 补图）。正文第 1、4、5 节分别放置关系图、费用图和资金流程图；列表封面独立保留。

| 成品 | 内容 | 网页路径 | 尺寸 / 大小 |
| --- | --- | --- | --- |
| [账户关系图](account-relationships.png) | BBAE / Redbridge / Apex 分工，嘉信国际账户主体，IBKR 实际签约实体核对 | `/images/articles/illustrations/bbae-schwab-ibkr-comparison/account-relationships.webp` | 1120×630 / 44,102 字节 |
| [费用对比图](fee-comparison.png) | 两笔 5,000 美元整股订单的佣金与平台费 | `/images/articles/illustrations/bbae-schwab-ibkr-comparison/fee-comparison.webp` | 1120×840 / 25,212 字节 |
| [资金往返图](funding-round-trip.png) | 本人银行、券商现金、证券持仓、结算与可提取的往返流程 | `/images/articles/illustrations/bbae-schwab-ibkr-comparison/funding-round-trip.webp` | 1120×630 / 35,018 字节 |

三张网页版合计 104,332 字节，约 102 KiB；使用正文图片组件的懒加载和放大功能。

## 制作方式与提示词

- 账户关系、资金往返：内置 image_gen 工具。提示词分别保存在 [account-relationships-prompt.txt](account-relationships-prompt.txt) 和 [funding-round-trip-prompt.txt](funding-round-trip-prompt.txt)。原始输出保留在同名 `-raw.png`。
- 风格参考：`/Users/balala/.codex/skills/wise-silver-glass/assets/studio-reference.webp`，仅继承材质与光线，没有沿用上涨柱状物或收益箭头。
- 真实品牌参考：项目的 `public/images/registration/bbae.jpg`、`public/images/capital-flow/schwab.jpeg`、`public/images/capital-flow/ibkr.jpeg`。
- 费用图：使用 [fee-chart.py](fee-chart.py) 通过 Matplotlib 确定性绘制，字体为 macOS PingFang；图表数值由 Decimal 重算，并与正文表格逐项核对。没有用图像生成模型估计柱长或价格。
- [prepare-web-images.cjs](prepare-web-images.cjs) 等比添加原始 `wise-invest-signature.png`，宽度约 16%，圆角约标识高度 20%，右上角留安全间距；随后等比缩至 1120px 宽，输出 WebP。原始品牌签名文件保持不变。

## 内容核对

- 关系图的连线表达机构职责，不是资金汇款步骤；正文保留 BBAE 现金账户及银行清扫的独立说明。IBKR 没有默认写成美国 LLC，也没有画出未核验的具体签约地区。
- 费用图采用正文已核验的公开费率（2026-11-17），两笔订单均为 5,000 美元：100 股×50 美元，以及 1,000 股×5 美元；BBAE 分别 1 / 5.50 美元，嘉信 0 / 0 美元，IBKR Tiered 0.35 / 3.50 美元，Fixed 1 / 5 美元。统一美元坐标，标明不含全部第三方费用及价差；嘉信两笔 0 元保留零值标记，未画成最小收费。
- 流程图区分卖出、结算和可提取；没有承诺即时到账、无条件出金或确定办理时间。换汇标为按需。
- 原始金额、产品规则、来源链接、标题、文章 ID、访问配置及列表封面均沿用原稿。新增图片说明没有增加新的费率、优惠或开户资格承诺。
