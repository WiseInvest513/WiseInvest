# 虚拟 U 卡费用对比：事实与适用范围

核对日期：2026-11-17。改写已有 `ucard-comparison`，路由 `/articles/vcard/ACGrkqnQ` 不变；不是七张卡的同日实刷评测。费用、奖励、资格和支付支持以正文所列各产品官方帮助页为依据，作者成功付款记录只来自用户既有教程与本会话明确确认，不编造版本、账单或实测日期。

## 比较对象与重要修正

- **Bitget Wallet**：APAC 与旧 Fiat24 路径分别列示。APAC 充值费 0、加密兑换 0.05%–0.2%、非 USD 1.7%；不从月费、年费为 0 推断所有入口发行费也为 0。官方 APAC 新申请名单不包含中国大陆，不把旧大陆卡记录写成现行新申请保证。Assetback 的基础 2%／条件 3%、账户月合格消费额度、结算后 8 天领取与代币形式分别说明；7 月底结束的零手续费返还不与新奖励重复累计。
- **Bybit**：模型限定 APAC USD 卡，加密支付在平台兑换报价上另加 0.9%，非 USD FX 2%。AIFC 的 2% 国际交易费单独解释。Base 2% 每月最多 5 USD，Beta 月消费门槛 500 USD、2% 最多 50 USD；2026-10-05 起法币支付不参加该奖励。APAC Google Pay 支持、Apple Pay 不支持，不能借用其他地区规则。
- **Gate**：经典／铂金消费兑换 0.9%、低于 2 USD 固定 0.05 USD、非美元 0.4%。Blue／AI 常规充值 0.9%，首次 10 USDT 充值豁免；AI FX 1.5%，Blue 1.7%，不再加经典卡消费兑换费。退款、撤销、失败交易费用按卡种单列。T0 1%、每月 5U、单笔 2U；消费升级次月生效。AI 卡 T1 起每月首笔合格 AI 消费的 50%／10 USDT 上限是现金券，不当作可提现现金或所有卡通用优惠。Apple Pay 官方要求核对卡种；支付宝、美团和微信旧测试分别说明。
- **MP**：瞬行 Flash 于 2026-09-30 退役，已发行转云影、余额至 Total Assets；云影和无界从 2026-11-12 起列出 Apple Pay 支持。优先采用明确的退役公告，覆盖旧帮助页“已发卡继续使用”的旧说法。云影 10 USDT、无界 100 USDT；消费 0.8% 之外还要算兑换报价（1 USDT 约 0.993–0.998 USD）、通道费用及验证费用。Binance Pay 1% 与链上路径分别核算。MP 教程只同步本次查证变化，历史操作截图保留并标明退役卡，不扩大成全篇重新实测。
- **SafePal × Fiat24**：联名入口充值、开户、管理费 0；非 USD 1%，不是旧“非 EUR”口径。换币和 Gas 不免费。USDC 形成 USD 的模型不替其他加密资产兑换、独立 Fiat24 或其他联名卡定价。
- **BenPay Delta**：9.9U 开卡、1U 月费、50U 冻结保证金；符合销卡条件后 30／60 天各退 50%。充值 0.5% 最低 0.01 USD，USD 授权 0.05 USD；非 USD 授权 0.40 USD 加 1.5% 跨境费，费表两处提到同一个 1.5% 不叠成 3%。Apple Pay 另 0.15%、Google Pay 0.10%、3DS 0.38 USD。不能借用 Alpha 的微信支持。旧渠道消费 50U 返 2U 是一次任务，不是永久 4%。
- **UU Wallet**：公开钱包转账说明不是完整卡费表；未公开部分标为未核定，不参与数值排名。10U 虚拟卡开卡费返还沿用原教程渠道记录及表单，不推断所有消费免费或一般性消费返现。邀请码未改。

## 算例与图表

以已开卡、USD 结算、稳定币等值 1 USD 为条件；MP 单独按官方兑换区间。充值费从充值金额中扣除建模，实际可能因报价、四舍五入和扣费方式不同而变化。未包含开卡、月费、保证金、买币溢价、链上费、充值通道费、税和特殊验证费，也未扣返现。每项公式在正文公开，完整 Decimal 计算保存在 `assets/source-images/article-illustrations/ucard-comparison/cost-model.py` 与 `cost-model.json`。

- 20／200 USD：Bitget 20.01–20.04／200.10–200.40；Bybit 与 Gate 经典 20.18／201.80；Gate Blue／AI 20.18／201.82；MP 20.20–20.30／202.00–203.02；SafePal 指定路径 20／200；Delta 20.15／201.06。
- Delta 每月一笔 20 USD、把 1U 月费一起补入卡余额：`(20 + 0.05 + 1) / 0.995 = 21.16U`，仍未含首次发行费及保证金。
- CNY 300 + 3% = CNY 309 是订单显示外卡费时的条件示例。假定只按原订单返 2% 时得到 CNY 6，不能覆盖 CNY 9 外卡费；未伪造实时汇率。腾讯首绑国际卡减免例外有单独来源。
- 费用柱状图由确定性脚本绘制，不让生成模型填写数字；标题、轴标签、区间和脚注已视觉复核。

## 来源和作者记录的界线

正文每组费用、奖励、支付支持紧邻官方来源。本人近期用 Bybit、Gate、MP 成功订阅 AI 的表述来自用户本会话确认，没有补写具体商户、日期或卡片版本。支付宝／微信等旧结果来自已有单卡教程，并标为既有记录，未冒充本轮实刷。

官方 APAC 发行价和 UU 完整卡费缺乏统一公开依据，已透明保留未知项；不以“免费”“支持”填充空白。申请资格不能仅从卡片可消费或交易所 KYC 通过推导出来。

## 同步范围

更新原对比文、独立封面、两张正文配图、图片尺寸索引及系列短标题；同步 `/card` 的 Bitget、Bybit、Gate、MP、SafePal、BenPay 相关字段，保留其他产品与现有邀请码。UU 无新官方卡费，资料库不强行更新核验日期。MP 教程保留 ID、路由、封面、历史截图与邀请卡，只纠正现行卡种、Apple Pay 和费用说明。正文站内教程使用共享引用卡，外部一手来源使用文字链接。本轮不新增注册福利卡或新的渠道承诺。

## 本轮核对的一手资料索引

- [Bitget APAC 申请条件](https://web3.bitget.com/helpCenter/425)
- [Bitget APAC](https://web3.bitget.com/helpCenter/431)
- [Bitget 旧卡](https://web3.bitget.com/helpCenter/241)
- [Bybit](https://www.bybit.com/en/help-center/article/Fees-and-Spending-Limits-Bybit-Card)
- [Gate 经典／铂金](https://www.gate.com/help/gatecard/gcd1213/50034)
- [Gate Blue／AI](https://www.gate.com/help/gatecard/gc7/100745/gate-card-fee-rates-limits)
- [MP 开卡费](https://help.mp.net/en/articles/14178557-how-much-does-it-cost-to-apply-for-a-virtual-card-u-card-what-is-the-issuance-fee)
- [SafePal 费用](https://safepalsupport.zendesk.com/hc/en-us/articles/22647224575643-Fee-Rates-for-the-SafePal-Fiat-Gateway-and-Mastercard)
- [BenPay 费用](https://support.benpay.com/eng/docs/Rate-and-limit-issues)
- [BenPay 保证金规则](https://support.benpay.com/eng/docs/BenPay-Card-Security-Deposit-Guide)
- [Bybit 资金来源说明](https://www.bybit.com/en/help-center/article/FAQ-Bybit-Card-General-Inquiries)
- [MP 最新费用](https://help.mp.net/en/articles/12351033-mpchat-card-limits-and-fees)
- [MP 兑换报价说明](https://help.mp.net/en/articles/16392630-mpcard-fx-rates-and-fee-explainer)
- [BenPay 充值规则](https://support.benpay.com/eng/docs/Recharge-FAQs)
- [UU 钱包出入金说明](https://www.uuwallet.com/faq/details?from=h5&id=34)
- [MP Binance Pay 充值说明](https://help.mp.net/en/articles/12352662-how-do-i-use-binance-pay-to-top-up-my-mpchat-account)
- [腾讯外卡支付说明](https://www.tencent.com/en-us/articles/2202372.html)
- [Assetback 规则](https://web3.bitget.com/helpCenter/article/867)
- [旧零手续费权益转换说明](https://web3.bitget.com/ko/helpCenter/488)
- [Bybit 奖励计划](https://www.bybit.com/en/help-center/article/Introduction-to-Bybit-Card-Rewards)
- [Gate 积分和等级规则](https://www.gate.com/help/gatecard/benefits/49985)
- [Gate AI 卡专属权益](https://www.gate.com/help/gatecard/benefits/102560/ai-elite-card-exclusive-benefits)
- [Bitget APAC](https://web3.bitget.com/helpCenter/433)
- [Gate 绑定指引](https://www.gate.com/help/gatecard/basics/49745)
- [SafePal 绑定步骤](https://safepalsupport.zendesk.com/hc/en-us/articles/22558243869211-How-to-Check-the-Details-of-Your-SafePal-Mastercard-and-Link-it-to-Paypal-Apple-Google-and-Samsung-Pay)
- [BenPay 分卡种说明](https://support.benpay.com/eng/docs/Which-platform-merchants-and-online-payment-platforms-does-BenPay-Card-support)
- [MP 瞬行退役与迁移说明](https://help.mp.net/en/articles/17013713-flash-card-permanently-retired-on-30-september-2026-issued-cards-converted-to-cloud-cards-balances-moved-to-total-assets)
