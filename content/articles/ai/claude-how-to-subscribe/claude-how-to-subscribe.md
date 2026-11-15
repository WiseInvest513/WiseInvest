---
id: claude-how-to-subscribe
authoringVersion: 1
guideAudience: 想用 Claude 写作、阅读资料或编程，准备开通个人套餐的读者 | 已有支付卡，需要把套餐选择、计费周期与网页付款串起来的人
guideOutcomes: 按使用需求理解 Free、Pro、Max 和 Ultra，分清月付与年付 | 从 Settings 和 Billing 找到升级入口，逐项填写卡片及账单信息后完成订阅
guidePrepare: 准备本人 Claude 账号、符合支持地区政策的使用资格、可用支付卡及真实账单资料；按所选计费周期准备足够余额。
guideStatus: 套餐、地区与网页付款说明于 2026-11-16 核对。Wise 对 Bybit、Gate 和 MP 的反馈是近期 AI 订阅实付记录，尚未拆分为逐卡种的 Claude 测试；文中配图是教学示意，不是支付成功凭证。
title: 怎么订阅 Claude？用哪些卡付、账单地址怎么填
categoryId: ai
date: 2026-11-16
readTime: 10
summary: 先了解 Claude 的用途和个人套餐，再结合已有 Bybit、Gate、MP 卡选择付款路径。按 Settings、Billing、Upgrade plan 找到入口，选清月付或年付，填写卡片和账单资料后提交订阅。
---

## 一、Claude 是什么，为什么考虑订阅？

Claude 是 Anthropic 提供的 AI 助手，可以在网页、桌面或手机端使用。你可以围绕上传的资料提问、整理文章、讨论代码，也可以把同一个工作的背景放到项目里持续处理。对刚开始尝试的人，先用免费版完成几项自己的真实任务，更容易判断是否需要升级。

付费主要解决**使用额度和功能访问**。经常长时间写作、处理文件或编程的人，可能需要比免费版更多的用量；偶尔问几个问题，则不必仅因为看到“更高套餐”就一次买满一年。各套餐仍有用量边界，不等于无限使用。

这篇讲的是**在自己的 Claude 账户里购买个人套餐**，重点演示 Pro。第三方共享、代订以及开发者 API 账单属于另外的购买关系，先不要混到同一笔付款里。

## 二、先选套餐，再决定按月还是按年付款

2026 年 11 月 16 日核对 [Claude 官方定价页](https://claude.com/pricing)时，个人套餐如下。表中美元价格未计适用税费，最终以账户结账总额为准。

| 套餐 | 官方美元价格 | 如何判断是否需要 |
| --- | --- | --- |
| Free | 免费 | 先用自己的写作、阅读或代码任务试用 |
| Pro | 月付 20 美元；年付一次支付 200 美元 | 需要更多日常用量，并使用 Pro 开放的项目、模型和 Claude Code 等功能 |
| Max | 每月 100 美元 | 已经明确碰到 Pro 用量上限，再比较更高额度 |
| Ultra | 每月 200 美元 | 更长时间、高强度使用，先确认具体额度与账户验证条件 |

Pro 年付页面显示的“约 17 美元／月”，是 **200 美元一年摊算后的展示金额**，不是每个月只扣 17 美元。第一次付费、还不确定用量时，可以先比较月付；确定长期需要后再决定是否年付。

定价页当前将 Max 的用量列为 Pro 的 5 倍，Ultra 的每周用量列为 Pro 的 10 倍；Ultra 对已验证账户取消五小时限制，仍有每周等用量规则。它们解决的是持续使用需求，不能据此推导每项任务都一定更快或更好。

**Pro 订阅与 API 消费分开管理。** 当前 Max、Ultra 页面另外列有 API 额度权益，但需按对应条款在 Console 查看；不能把任何个人会员都当作通用 API 余额。本篇按网页个人订阅操作，不展开开发者计费。[Claude 账单说明](https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs)

## 三、大陆读者选卡，先看已有卡和申请条件

**Wise 的近期使用反馈是：Bybit、Gate 和 MP 的卡都成功订阅过 AI 产品。** 因为没有逐笔拆分订阅产品和卡种，本文保留这条经验，不额外宣称三张卡的所有版本都完成了 Claude 实测。

如果已经持有可正常消费的卡，就先确认卡片资料和余额；不必为了 Claude 再开一圈卡。新申请则按下面区分：

| 卡片 | 已经有卡时 | 还没有卡时 |
| --- | --- | --- |
| MPCard | 查看卡号、有效期、安全码，并确认钱已划到卡片余额 | 先了解云影卡，核对真实身份材料、开卡费和申请条件；MP 官方把 Claude 列入订阅场景 |
| Bybit Card | 检查对应卡项目的消费账户和可用额度 | 先核支持居住国及卡片认证；交易所 KYC 不代表卡片申请已通过 |
| Gate Card | 确认卡片状态、资料及实际可消费余额 | 看本人 Gate 卡片申请页的地区、材料与费用，不能套用他人地区卡 |
| BenPay Delta / Bitget Wallet Card 等 | 查自己持有卡种的商户和地区条件 | 不作为大陆新用户的通用直开方案；BenPay 当前 Delta 限制名单含 China，Bitget Wallet APAC 有指定地区资格 |

材料、充值和各张卡的教程，集中放在选卡篇，避免你在多个产品之间来回找：

[AI 订阅选卡：近期实付记录、申请条件与充值准备](/articles/ai/4yMMHKEa){card}

**卡片能支付与 Claude 对你提供服务，仍需分别满足。** Anthropic 当前政策未将中国大陆列为支持地区；Pro 开通帮助要求用户身处支持地点，注册还需要支持地点的电话号码。大陆身份证持有人若在支持地区生活，应按真实情况核对；人在不支持地点时，持有境外卡也不会改变服务资格。[支持地区政策](https://www.anthropic.com/legal/supported-regions)、[Pro 注册条件](https://support.claude.com/en/articles/8325609-how-do-i-sign-up-for-the-pro-plan)

网页付款按官方说明使用**信用卡或借记卡**。发卡方宣传支持 Claude 的虚拟卡，也要由实际结账受理。网页帮助没有把 Google Pay、Apple Pay 列成通用付款入口；通过手机应用订阅则由 App Store 或 Google Play 处理，具体方式由商店账户决定。[官方付款方式](https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs)

## 四、从哪里进入订阅？按这六步走

下面的流程图看 **Claude 这一行**。图片是根据官方文档整理的示意，实际菜单位置可能随版本调整，认准 Settings、Billing 和 Upgrade plan 这几个名称即可。

![Claude 官方订阅路径示意：登录 claude.ai，进入 Settings 和 Billing，选择 Upgrade plan、Get Pro plan 后填写付款资料](/images/articles/ai-subscription/subscribe-route.webp)

### 第一步：登录自己的 Claude 账户

打开 [claude.ai](https://claude.ai/)。已有账号直接登录；新用户按页面选择邮箱或 Google 账户，并完成验证。确认当前账户是自己准备长期使用的那一个。

### 第二步：打开 Settings

点击页面左下角的名字、头像或姓名缩写，在菜单里选择 **Settings（设置）**。手机窄屏可能先需要展开侧栏。

### 第三步：进入 Billing

在设置中打开 **Billing（账单）**，找到 **Upgrade plan（升级套餐）**。这是个人账户的订阅入口；不要进入开发者 Console 给 API 充值。

### 第四步：选择 Get Pro plan

进入套餐页，找到 Pro，点击 **Get Pro plan**。如果你明确需要其他套餐，则选择账户实际提供的对应方案，并重新核对价格。

### 第五步：选清 Monthly 或 Annual

**Monthly 是月付，Annual 是年付。** 看清本次会扣的完整金额，尤其不要把年付摊算月价当作这次只扣一个月。确认币种、税费和自动续费说明，再进入填卡环节。

### 第六步：填卡、填地址，点击 Subscribe

按下一节填入付款资料。检查无误后点击 **Subscribe（订阅）**；如果银行要求短信或 App 验证，按提示完成。这条按钮路径依据 [Claude 官方 Pro 开通流程](https://support.claude.com/en/articles/8325609-how-do-i-sign-up-for-the-pro-plan)整理。

## 五、付款信息和账单地址怎么填

把发卡 App 打开，显示准备使用的那张卡。卡号、有效期和安全码都从同一张卡复制；姓名按该卡登记资料填写。

| 付款字段 | 从哪里取值 |
| --- | --- |
| Card number | 卡片详情中的完整卡号 |
| MM / YY | 卡片到期月份和年份 |
| CVC / CVV | 卡片安全码，不是账户登录密码 |
| Name on card | 发卡方登记的持卡人姓名 |
| Billing address | 此支付方式对应的真实账单资料 |

### 地址的每一格怎么对应

Claude 官方要求支付方式的账单地址与银行留存资料一致。个人套餐的账单地址也会跟随支付方式；后续更正时，在 **Settings → Billing → 当前支付方式旁的 Update** 处理。[账单地址说明](https://support.claude.com/en/articles/12997130-understanding-your-billing-address-and-tax-calculation)

![Claude 与 ChatGPT 结账常见地址字段示意：按卡片账单记录填写国家、街道、城市、州或省和邮编](/images/articles/ai-subscription/billing-fields.webp)

填写时可按下面的顺序逐项核对：

1. **Country / Region：** 选择这张卡实际账单资料对应的国家或地区，不统一选美国。
2. **Address line 1：** 填门牌号、街道等主要地址。
3. **Address line 2：** 有公寓或单元号时填写，没有可留空。
4. **City：** 填同一地址中的城市。
5. **State / Province：** 选择同一地址对应的州或省。
6. **ZIP / Postal code：** 填对应邮编，再核一遍姓名和完整地址。

看不到卡片账单地址时，先查银行资料或联系卡方确认。地址生成器可以用来认识英文表单，但不能把生成的姓名、电话或地址当作自己的银行记录。ChatGPT 篇中的生成器截图也是这个用途，两篇采用相同的资料核对原则。

### Google Pay、Apple Pay 和 3DS 容易混淆在哪里？

Google Play 是 Android 应用商店的订阅渠道；Google Pay 是支付工具，它们不是同一个入口。能够把卡加进 Apple Wallet，也不代表 Claude 网页一定出现 Apple Pay 按钮。本文按网页填卡流程完成即可。

**3DS 是银行卡的支付身份验证**，可能要求接收一次性验证码，或在银行 App 中确认。它不是让你提供账户密码，也不是把 CVV 发给客服。需要验证时保持结账页，按卡方提示完成。[Claude 拒付与验证说明](https://support.claude.com/en/articles/9402418-why-was-my-card-declined)

## 六、提交付款后，开通就完成了

最后核对套餐、周期、金额和资料，点击 Subscribe 并完成必要验证。**付款成功，账户显示所选套餐后，就可以回到 Claude 开始使用。** 收据留存即可，不需要额外激活操作。

订阅默认按选择的周期续费；以后不再使用时，从原购买渠道取消。若付款没有完成，先按页面提示检查：

| 遇到的情况 | 下一步 |
| --- | --- |
| 提示资金不足 | 核对卡片余额是否覆盖整笔月付或年付、税费和卡方费用 |
| 要求验证但未完成 | 查看短信／发卡 App，完成 3DS |
| 地址或卡片被拒 | 核对银行留存资料与账单地区，再联系发卡方查询 |
| 已付款却仍显示 Free | 先检查是否登录了另一个邮箱，在 Billing 查看支付状态，再联系官方支持 |
| 所在地区不支持 | 按官方服务条件处理，换卡并不能改变这一条件 |

其中账号仍显示 Free 的排查路径可见 [Claude 账单 FAQ](https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs)。不要在上一笔状态不清楚时反复提交。

这套操作里，最重要的就是把三件事接上：选好适合自己的套餐，准备能用的卡和真实账单资料，再从账户内 Billing 完成付款。需要对照另一个产品时，继续看：

[ChatGPT 官网升级与付款教程](/articles/ai/AvKolCFm){card}
[GamsGo 第三方订阅与交付检查](/articles/ai/AYoe5wH7){card}
[AI 工具订阅指南](/articles/series/chatgpt-subscribe){card}
