export const topicGuides: Record<string, { intro: string; checks: [string, string][] }> = {
  exchanges: { intro: "从注册入口到手续费福利，先了解邀请关系和适用条件，再决定在哪个平台开始。", checks: [["注册资格", "核对服务地区、身份认证要求与账户状态。"], ["福利条件", "分清新用户、补绑与活动任务，确认返佣范围和领取条件。"], ["账户安全", "核验官方网址，设置双重验证，不向他人提供验证码。"]] },
  brokers: { intro: "准备投资港美股，先分清证券账户与资金通道，再比较申请材料、入金方式和持有成本。", checks: [["账户与材料", "确认开户实体、居住地要求及所需身份证明、税务资料。"], ["资金路径", "核对支持的入金方式、同名账户要求及出入金费用。"], ["交易与持有", "阅读交易费率、托管安排与转仓规则，不只比较开户速度。"]] },
  banking: { intro: "围绕收款、转账与券商入金选择账户，分别了解香港银行、海外账户和见证开户的准备流程。", checks: [["开户准备", "确认线上或线下申请方式，以及证件、地址证明等材料。"], ["账户用途", "核对支持币种、收付款范围及与本人券商账户的衔接。"], ["维护成本", "留意账户管理费、汇兑成本、转账限额与日常维护条件。"]] },
  cards: { intro: "把订阅支付与日常消费分开考虑，先看开卡门槛、充值路径和使用限制，再比较总费用。", checks: [["申请条件", "确认服务地区、身份认证和开卡资格。"], ["支付场景", "核对商户、币种与订阅扣款支持情况，不默认所有场景通用。"], ["完整费用", "同时查看开卡、充值、换汇和退款费用，以及余额处理规则。"]] },
  ipo: { intro: "港美股、链上和 A 股申购采用不同的账户与规则。先弄清资格、资金占用和分配方式，再看具体入口。", checks: [["申购资格", "确认账户、持仓或市值等要求，区分不同市场的准入条件。"], ["资金安排", "了解冻结资金、融资成本与未获配资金的退回时间。"], ["发行风险", "阅读发行资料、定价与交易规则，打新不等于保本获利。"]] },
  tools: { intro: "从境外号码到 eSIM 管理，再到订阅工具，补齐出海过程中的通信与日常使用需求。", checks: [["设备适配", "确认设备、系统和 SIM / eSIM 支持情况再购买。"], ["长期使用", "了解激活、充值、保号及自动续费规则。"], ["账号与隐私", "区分独立账号与共享服务，留意权限、恢复方式和数据隐私。"]] },
};

export const entryGuides: Record<string, { purpose: string; description: string; focus: string }> = {
  binance: { purpose: "注册与邀请福利", description: "了解币安合作入口、注册步骤与手续费福利，核对自己的账户是否符合参与条件。", focus: "邀请关系 · 返佣条件" },
  bitget: { purpose: "新人任务与费用", description: "整理 Bitget 新人福利与手续费相关入口，区分注册权益和需要额外完成的任务。", focus: "任务要求 · 费用范围" },
  okx: { purpose: "交易所与钱包", description: "分别查看 OKX 交易账户和钱包相关福利，避免混淆不同产品的活动要求。", focus: "产品区别 · 适用条件" },
  "bit-account-guide": { purpose: "证券账户与资金路径", description: "从账户结构、身份认证到银行或稳定币入金，了解 BIT 美股账户的完整准备流程。", focus: "账户权利 · 入金方式" },
  bbae: { purpose: "开户、入金与转仓", description: "按教程了解 BBAE 的账户申请和资金转入，已有证券持仓也可先了解转仓步骤。", focus: "申请资料 · 转仓规则" },
  schwab: { purpose: "美股账户申请", description: "梳理嘉信证券的申请材料与审核流程，先确认账户要求，再准备身份与税务资料。", focus: "开户资格 · 材料准备" },
  "hong-kong-bank": { purpose: "香港账户准备", description: "汇总汇丰、众安等香港银行入口，对照自己的材料与用途了解不同开户方式。", focus: "申请方式 · 账户用途" },
  "overseas-bank": { purpose: "跨境收付款", description: "了解 Wise、iFAST 等账户与汇款服务，比较币种、资金路径和使用要求。", focus: "账户性质 · 转账费用" },
  "witness-account": { purpose: "见证开户流程", description: "梳理见证开户的预约、材料与办理步骤，提前了解申请条件和现场准备事项。", focus: "预约流程 · 证明材料" },
  "gate-card": { purpose: "开卡与支付", description: "从申请到日常支付，了解 Gate Card 的开通步骤、资金准备和费用说明。", focus: "申请条件 · 使用费用" },
  "bitget-card": { purpose: "钱包与卡片衔接", description: "了解 Bitget Wallet Card 的钱包准备、身份认证与支付绑定流程。", focus: "钱包准备 · 支付绑定" },
  "safepal-card": { purpose: "认证与充值", description: "梳理 SafePal Card 的申请、认证与充值步骤，先确认使用场景和限制。", focus: "认证材料 · 充值路径" },
  "traditional-broker-ipo": { purpose: "传统券商申购", description: "了解港美股打新的券商入口，阅读申购方式、资金安排与相关费用。", focus: "申购规则 · 资金占用" },
  "onchain-broker-ipo": { purpose: "链上申购入口", description: "查看链上打新产品与操作指南，先辨别持有权利、发行安排和退出方式。", focus: "资产权利 · 流动性" },
  "a-share-ipo": { purpose: "A 股账户准备", description: "从证券账户与申购资格入手，了解 A 股打新的准备事项和操作流程。", focus: "申购资格 · 账户准备" },
  "global-access": { purpose: "号码与长期保号", description: "查看境外手机卡、激活与保号资源，为收短信和日常通信做好准备。", focus: "激活方式 · 保号条件" },
  "esim-reader": { purpose: "eSIM 配置管理", description: "了解 Xesim、BeeSIM 等工具卡和读卡器，核对设备兼容性与配置步骤。", focus: "设备适配 · 套餐管理" },
  "other-resources": { purpose: "订阅与效率工具", description: "汇总 AI 订阅和其他工具入口，了解服务方式、购买流程与使用注意事项。", focus: "服务权限 · 续费规则" },
};
