import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(dir, '../../../..');
const web = path.join(project, 'public/images/articles/qqq-buying-walkthrough');
const brand = fs.readFileSync(path.join(project, 'public/images/brand/wise-invest-signature.png')).toString('base64');
const C = { bg: '#f5f0e6', ink: '#172f46', muted: '#566a79', green: '#28755d', pale: '#e5f0e7', line: '#d9d2c4', gold: '#bc9556', white: '#fffdfa' };
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const text = (s, x, y, size = 30, fill = C.ink, weight = 500, anchor = 'start') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="${anchor}">${esc(s)}</text>`;
const lines = (ss, x, y, size = 30, fill = C.ink, weight = 500, lineHeight = 42) => ss.map((s, i) => text(s, x, y + i * lineHeight, size, fill, weight)).join('');
const rect = (x,y,w,h,fill=C.white,r=16,stroke='none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const line = (x1,y1,x2,y2,color=C.line) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2"/>`;
function svg(title, subtitle, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs><clipPath id="brand"><rect x="1525" y="54" width="307" height="84" rx="17"/></clipPath></defs>
  <style>text{font-family:'PingFang SC','Hiragino Sans GB','Arial',sans-serif}</style>
  ${rect(0,0,1920,1080,C.bg,0)}${rect(88,65,8,68,C.gold,4)}
  ${text(title,118,117,54,C.ink,750)}${text(subtitle,88,181,29,C.muted)}
  <image x="1525" y="54" width="307" height="84" preserveAspectRatio="xMidYMid meet" clip-path="url(#brand)" xlink:href="data:image/png;base64,${brand}"/>
  ${inner}</svg>`;
}

const rmbRows = [
  ['1,000 元','5.00 元','0.10 元','4.90 元'],
  ['5,000 元','5.00 元','0.25 元','4.75 元'],
  ['10,000 元','5.00 元','0.50 元','4.50 元'],
  ['100,000 元','5.00 元','5.00 元','0.00 元'],
];
let rmb = rect(88,226,1744,528,C.white,24);
rmb += rect(88,226,1744,104,C.ink,20);
const rmbXs = [280,715,1150,1585];
['单笔成交金额','最低 5 元 · 假设对照','最低 0.1 元 · 银河渠道','本次佣金差额'].forEach((s,i)=>{rmb+=text(s,rmbXs[i],291,31,'#fffdfa',650,'middle');});
rmbRows.forEach((row,i)=>{const y=330+i*106;if(i%2===1)rmb+=rect(90,y,1740,106,'#f6f5ef',0);rmb+=line(110,y+106,1810,y+106);row.forEach((s,j)=>{rmb+=text(s,rmbXs[j],y+68,42,j===2||j===3?C.green:C.ink,j===2?750:600,'middle');});});
rmb+=rect(88,785,1744,123,C.pale,18);
rmb+=text('银河 ETF / LOF 渠道：万 0.5，0.1 元起',115,833,34,C.green,750);
rmb+=text('入金 1.5 万元并留存 2 个月后申请，确认费率生效；不是全部银河账户默认费率，也不套用股票。',115,881,29,C.ink,500);
rmb+=lines(['计算：佣金 = max（成交额 × 0.005%，该方案最低收费）。仅比较买入佣金，不含溢价、持有和资金成本。','来源：用户确认渠道规则与原始银河费率截图；假设对照不代表其他券商统一收费。整理日期：2026-11-13。'],88,969,26,C.muted,500,43);

const brokerRows = [
  { name:['致富','直属客户网上交易'], whole:['平台 $0.008 / 股，最低 $0.99','结算 $0.003 / 股，最低 $0.01'], fraction:['本图不列碎股报价'], note:['1 股：上述两项合计 $1','两项各设成交额 3% 上限','最低收费优先'] },
  { name:['长桥香港','零佣优惠适用账户'], whole:['平台 $0.005 / 股，最低 $1','结算 $0.003 / 股等另计'], fraction:['平台费：成交额 0.99%','最高 $0.99'], note:['香港默认固定方案','不可套其他地区账户'] },
  { name:['BBAE','费表自 2026-07-01 生效'], whole:['平台 $0.0055 / 股，最低 $1','上限：成交额 2%'], fraction:['平台费：成交额 1%','最低 $0.01'], note:['$100 且不足 1 股：费 $1','上限低于最低值时取上限'] },
  { name:['BIT 证券','11-08 历史核验记录'], whole:['平台 $0.005 / 股','最低 $0.99'], fraction:['平台费：成交额 0.99%','最高 $0.99'], note:['本轮未重新核验','不适用于现货 QQQB'] },
];
let brokers = rect(88,218,1744,596,C.white,22) + rect(88,218,1744,76,C.ink,18);
const bx=[114,432,1045,1455];
['适用账户','数量不少于 1 股','数量不足 1 股','例子与边界'].forEach((s,i)=>brokers+=text(s,bx[i],268,31,'#fffdfa',650));
brokerRows.forEach((row,i)=>{const y=294+i*130;if(i%2)brokers+=rect(90,y,1740,130,'#f6f5ef',0);brokers+=line(108,y+130,1812,y+130);brokers+=text(row.name[0],bx[0],y+49,35,C.ink,750);brokers+=text(row.name[1],bx[0],y+90,24,C.muted);brokers+=lines(row.whole,bx[1],y+46,29,C.ink,550,43);brokers+=lines(row.fraction,bx[2],y+46,29,C.green,650,43);brokers+=lines(row.note,bx[3],y+37,25,C.muted,500,35);});
brokers+=rect(88,840,1744,92,C.pale,16);
brokers+=text('复星渠道：入金等值 10,000 港币，解锁对应免佣金。',112,877,29,C.green,700);
brokers+=text('平台费及适用代收费另计；交易前核对本人账户的完整费用报价。',112,915,27,C.ink);
brokers+=text('来源：chiefgroup.com.hk · longbridge.com/hk · bbae.com · bit.com；复星为用户确认渠道规则。',88,979,25,C.muted);
brokers+=text('整理：2026-11-13；BIT 依 2026-11-08 历史记录。仅列选定费用项目，其他适用费用另计；下单前重查。',88,1022,25,C.muted);

let tokens='';
function tokenPanel(x,title,scope,rows,activity){
  let s=rect(x,229,852,591,C.white,24);
  s+=text(title,x+32,290,43,C.ink,750)+text(scope,x+32,338,28,C.muted);
  s+=line(x+28,364,x+824,364);
  s+=text('收费方式',x+32,411,28,C.muted,600)+text('费率',x+395,411,28,C.muted,600)+text('交易额 1,000 USDT',x+560,411,27,C.muted,600);
  rows.forEach((r,i)=>{let y=472+i*77;s+=text(r[0],x+32,y,31,C.ink,600)+text(r[1],x+395,y,38,C.green,750)+text(r[2],x+560,y,36,C.green,750);if(i<2)s+=line(x+28,y+24,x+824,y+24);});
  s+=rect(x+22,683,808,115,C.ink,15)+lines(activity,x+42,727,26,'#fffdfa',550,39);
  return s;
}
tokens+=tokenPanel(88,'币安 · bStocks 现货','QQQB / USDT · 普通用户标准 Taker 示例',[
  ['Maker · 活动','0%','0 USDT'],['Taker · 基础','0.1%','1 USDT'],['Taker · BNB 抵扣*','0.075%','0.75 USDT'],
],['Maker 零费至 2026-11-30 23:59 UTC','即北京时间 2026-12-01 07:59；不是永久活动。']);
tokens+=tokenPanel(980,'Bitget · rToken','rQQQ / USDT · VIP 0–3 活动费表',[
  ['Maker','0.05%','0.5 USDT'],['Taker / StockRoute','0.05%','0.5 USDT'],['BGB 抵扣*','0.04%','0.4 USDT'],
],['活动结束时间另行公告，不是永久费率。','StockRoute 使用 Taker 费率。']);
tokens+=rect(88,846,1744,97,C.pale,16);
tokens+=text('限价单也可能是 Taker；* 抵扣需满足各平台条件。示例未预扣 20% 渠道返佣，也不假设优惠可叠加。',112,886,28,C.ink,600);
tokens+=text('这里只算对应代币现货的交易手续费，不含买卖价差、USDT 取得、网络转账和退出成本。',112,925,28,C.muted);
tokens+=text('官方依据：binance.com 手续费等级 / bStocks 活动公告；bitget.com rToken 费率表 / 活动延期公告。',88,991,25,C.muted);
tokens+=text('整理日期：2026-11-13。QQQB、rQQQ 是代币化产品，不等于证券账户里的 QQQ ETF 份额。',88,1030,25,C.muted);

const documents = [
  ['fees-rmb',svg('同样万 0.5，小额订单差在最低收费','只比较单笔 ETF / LOF 佣金 · 两列均按成交额 × 0.005% 计算',rmb)],
  ['fees-brokers',svg('买 QQQ：先分清整股与碎股','美元 / 单笔 · 仅列选定项目，不是全部交易、资金与持有成本',brokers)],
  ['fees-tokens',svg('股票代币手续费：看订单与活动条件','每笔交易额 1,000 USDT · 不把返佣、网络费和价差混进同一个数字',tokens)],
];
fs.mkdirSync(web,{recursive:true});
for(const [name,source] of documents){
  fs.writeFileSync(path.join(dir,`${name}.svg`),source);
  const png=await sharp(Buffer.from(source)).png().toBuffer();
  fs.writeFileSync(path.join(dir,`${name}.png`),png);
  await sharp(png).resize(1600,900).webp({quality:91,effort:6,smartSubsample:true}).toFile(path.join(web,`${name}.webp`));
}
const data={
  date:'2026-11-13',dimensions:[1920,1080],webDimensions:[1600,900],brandSource:'public/images/brand/wise-invest-signature.png',brandWidthPercent:16,
  sources:{
    galaxy:{type:'user_confirmed_channel',originalImage:'银河费率详情.png',rate:0.00005,minimumCny:0.1,conditions:'入金15000元并留存2个月后申请并确认费率生效',notOfficialDefault:true},
    chief:{url:'https://www.chiefgroup.com.hk/cn/cs/charges',scope:'直属客户网上交易'},
    longbridge:{url:'https://longbridge.com/hk/en/rate',scope:'香港实体、符合零佣优惠、默认固定方案'},
    bbae:{url:'https://www.bbae.com/fees/',effective:'2026-07-01'},
    bit:{url:'https://www.bit.com/helpcenter/articles/15897611',verified:'2026-11-08',status:'historical_local_audit_only_current_recheck_blocked'},
    fosun:{url:'https://www.fosunwealth.hk/zhCn/stock',type:'user_confirmed_channel_benefit',feeScheduleNotVerified:true},
    binance:{urls:['https://www.binance.com/en/vip-institutional-services','https://www.binance.com/en/support/announcement/detail/5a326408b6404d69b474f3fab7acfa66'],makerEndsUTC:'2026-11-30T23:59:00Z'},
    bitget:{urls:['https://www.bitget.com/support/articles/12560603891318','https://www.bitget.com/support/articles/12560603893944'],vip:'0–3',promotionEnd:null}
  },
  rmbTable:rmbRows,brokerRows,
  tokenExamples:{tradeAmountUsdt:1000,binance:{makerPromotionRate:0,makerFeeUsdt:0,takerBaseRate:0.001,takerFeeUsdt:1,bnbEligibleRate:0.00075,bnbFeeUsdt:0.75},bitget:{vip:'0–3',makerRate:0.0005,takerStockRouteRate:0.0005,feeUsdt:0.5,bgbEligibleRate:0.0004,bgbFeeUsdt:0.4},channelRebateDeducted:false},
  formulas:{galaxy:'max(tradeCny * 0.00005, 0.1)',hypotheticalComparison:'max(tradeCny * 0.00005, 5)',bbaeAtLeastOneShare:'min(max(shares * 0.0055, 1), tradeUsd * 0.02)',bbaeBelowOneShare:'max(tradeUsd * 0.01, 0.01)'},
  caveats:['示例只列注明费用，不是全包成本','没有将20%渠道返佣预先扣除','BIT证券历史费率不得用于BIT现货QQQB','原始签名原比例嵌入，圆角仅作用于成图副本']
};
fs.writeFileSync(path.join(dir,'data.json'),JSON.stringify(data,null,2)+'\n');
console.log('Rendered fees-rmb, fees-brokers, fees-tokens');
