/** Export the reviewed article and its selected full-resolution assets. No publishing. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(sourceDir, '../../..');
const project = '/Users/balala/Persona/AIViedo/视频号/纳指投资系列/视频项目/QQQ购买方式';
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const output = path.resolve(option('--output') || path.join(project, '05_网站图文完整修订_2026-11-13'));
const previousDelivery = path.join(project, '04_网站图文交付_2026-11-13');
if (output === previousDelivery) throw new Error('旧版 04 交付包保留不覆盖；请导出到新的修订目录。');
const date = '2026-11-13';
const origin = 'https://www.wise-invest.org';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const exists = async (p) => { try { await fs.access(p); return true; } catch { return false; } };
const formal = path.join(root, 'content/articles/index/qqq-buying-walkthrough/index.md');
const draft = path.join(root, '.article-drafts/qqq-buying-walkthrough/body.md');
const input = path.resolve(option('--input') || (await exists(formal) ? formal : draft));
const inputText = await fs.readFile(input, 'utf8');
const body = inputText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
const bodySha = sha(body);
const expectedSha = option('--body-sha');
if (expectedSha && expectedSha !== bodySha) throw new Error('正文哈希已变化，重新检查后再导出。');
if (flag('--write') && !flag('--links-reviewed')) throw new Error('正式写入需要 --links-reviewed，确认主任务已完成链接核验。');
const plan = JSON.parse(await fs.readFile(path.join(root, '.article-drafts/qqq-buying-walkthrough/plan.json'), 'utf8'));
const frontmatter = inputText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
if (frontmatter) {
  const metadata = parseYaml(frontmatter[1]);
  plan.title = metadata.title || plan.title;
  plan.summary = metadata.summary || plan.summary;
  for (const [key,field] of [['audience','guideAudience'],['outcomes','guideOutcomes']]) if (metadata[field]) plan.guide[key] = String(metadata[field]).split('|').map(v=>v.trim()).filter(Boolean);
  plan.guide.prepare = metadata.guidePrepare || plan.guide.prepare;
  plan.guide.status = metadata.guideStatus || plan.guide.status;
}
const originalScreenManifest = JSON.parse(await fs.readFile(path.join(sourceDir, 'screenshots/manifest.json'), 'utf8'));
const restoredManifestPath = path.join(sourceDir, 'screenshots/restored-manifest.json');
const restoredScreenManifest = await exists(restoredManifestPath)
  ? JSON.parse(await fs.readFile(restoredManifestPath, 'utf8')) : [];
const screenManifest = [...originalScreenManifest, ...restoredScreenManifest];
for (const entry of screenManifest) {
  if (!entry.webFile || !entry.sourceCopy || !entry.originalFile) throw new Error('截图来源字段不完整：' + JSON.stringify(entry));
  const duplicate = screenManifest.find(other => other !== entry && other.webFile === entry.webFile);
  if (duplicate) throw new Error('截图网页路径重复，必须先核对：' + entry.webFile);
}
const generated = JSON.parse(await fs.readFile(path.join(sourceDir, 'generation.json'), 'utf8'));
const fees = JSON.parse(await fs.readFile(path.join(sourceDir, 'fees/data.json'), 'utf8'));
const narratorPath = path.join(project, '01_口播稿.txt');
const narration = await fs.readFile(narratorPath, 'utf8');
const narrationSha = sha(narration);
const narrationLines = narration.split(/\r?\n/);
const oldMapText = await fs.readFile(path.join(project, '02_图片与口播对应.txt'), 'utf8');
const oldMap = [...oldMapText.matchAll(/^\d+\. 图片\/(.+)\r?\n口播锚点：(.+)\r?\n对应段落：(.+)\r?\n说明：(.+)$/gm)].map(m => ({file:m[1],anchor:m[2],legacyParagraph:m[3],note:m[4]}));
const cues = {
  'six-routes': ['如果你手里只有人民币', '如果你已经有国内证券账户', '如果你希望直接持有美国上市的 QQQ', '如果你平时使用 USDT'],
  '01-alipay-search': ['首先打开支付宝', '然后直接搜索'],
  '02-alipay-fund-detail': ['南方纳斯达克100指数基金016452详情页', '当时显示单日限购10元'],
  '03-alipay-buy-order': ['支付宝基金买入金额页面', '支付宝基金付款确认页面'],
  '04-wiseetf-subscription-limits': ['这个网站叫 WiseETF'],
  '05-galaxy-jiashi-quote': ['嘉实', '银河证券ETF买入页面'],
  '06-galaxy-efund-quote': ['易方达', '银河证券ETF买入页面'],
  '07-galaxy-limit-order': ['银河证券ETF买入页面'],
  '08-galaxy-order-confirmation': ['银河证券ETF订单确认页面'],
  '09-wiseetf-premium': ['WiseETF场内ETF对比页面'],
  '10-galaxy-channel-fees': ['为什么我会推荐银河证券', '银河证券ETF佣金优惠说明'],
  'fees-rmb': ['银河证券ETF佣金优惠说明'],
  '11-fosun-qqq-quote': ['复星证券App首页及开户入口', '复星证券QQQ行情页面'],
  '12-fosun-bank-link': ['复星证券入金页面'],
  '13-longbridge-qqq-quote': ['长桥证券QQQ行情及买入页面', '长桥证券QQQ买入页面'],
  '14-bbae-qqq-quote': ['BBAE QQQ行情页面', 'BBAE QQQ买入页面'],
  '15-binance-qqqb': ['币安QQQB/USDT行情页面', '币安QQQB现货买入页面'],
  '16-bitget-rqqq': ['Bitget rQQQ/USDT行情页面', 'Bitget rQQQ买入页面'],
  '17-bit-spot-warning': ['BIT的特点，是它同时提供数字资产交易和传统证券服务', '这和前面介绍的QQQB、rQQQ有所区别', '我们这里讲的是BIT的证券账户'],
  '18-bit-securities-app': ['BIT App首页及证券入口', 'BIT开户教程截图'],
  '20-bit-deposit-network': ['BIT USDT充值页面'],
  '21-binance-send-to-bit': ['币安USDT提币页面'],
  'bit-securities-flow': ['BIT主账户与证券账户资金划转页面', 'BIT证券QQQ行情页面', 'BIT证券QQQ买入页面'],
  'fees-brokers': ['整股订单的平台费为每股0.0055美元', 'BIT证券美股收费页面'],
  'fees-tokens': ['币安bStocks手续费说明', 'Bitget rToken手续费说明']
};
function narratorClues(id, originalFile) {
  const matches = [];
  const filename = path.basename(originalFile || '');
  const registrationCues = /邀请码|注册|开户|费率/.test(filename) ? [
    ...(/银河/.test(filename) ? ['我们这次介绍的银河证券渠道', '银河证券ETF佣金优惠说明'] : []),
    ...(/复星/.test(filename) ? ['复星证券邀请码', '打开复星证券App，进入开户页面'] : []),
    ...(/致富/.test(filename) ? ['致富证券邀请码', '致富证券的开户流程'] : []),
    ...(/bbae/i.test(filename) ? ['首先打开BBAE，注册账号', 'BBAE渠道邀请码', '首次入金2000美元'] : []),
    ...(/币安/.test(filename) ? ['币安邀请码', '注册币安账号', 'WISEBNB1'] : []),
    ...(/bitget/i.test(filename) ? ['Bitget邀请码', '注册Bitget', 'wise5130'] : []),
    ...(/(^|_)bit[ _]/i.test(filename) ? ['BIT的邀请码', 'WISE666', 'BIT开户教程截图'] : []),
  ] : [];
  for (const cue of [...(cues[id] || []), ...registrationCues]) {
    const found = narrationLines.map((text,i) => ({line:i+1,text})).filter(x => x.text.includes(cue)).slice(0,3);
    for (const m of found) if (!matches.some(x => x.line === m.line)) matches.push(m);
  }
  return {sourceFile:narratorPath, matches, oldImageMap:oldMap.find(x => x.file === path.basename(originalFile || '')) || null,
    note:'仅作语义与文本行定位；旧稿配图编号及旧对应段落不等于本次配图序号。未生成时间码，未改写原口播。'};
}
function resolveAsset(url) {
  const shot = screenManifest.find(s => s.webFile === url);
  if (shot) return {id:path.basename(url,'.webp'),kind:shot.kind || 'existing-screenshot',source:shot.sourceCopy,originalFile:shot.originalFile,redacted:shot.redacted,redaction:shot.redaction,
    restored:restoredScreenManifest.includes(shot),sourceNotes:shot.cautions || shot.notes || shot.note || null};
  const gen = generated.assets.find(g => '/' + g.webPath.replace(/^public\//,'') === url);
  if (gen) return {id:gen.id,kind:'generated-concept',source:path.join(root,gen.sourceSigned),originalFile:gen.generatedPath,redacted:false};
  const fee = path.basename(url,'.webp');
  if (/^fees-(rmb|brokers|tokens)$/.test(fee)) return {id:fee,kind:'deterministic-fee-table',source:path.join(sourceDir,'fees',fee+'.png'),originalFile:path.join(sourceDir,'fees',fee+'.svg'),redacted:false};
  throw new Error('没有高清来源映射：' + url);
}
const blocks = [...body.matchAll(/\S[\s\S]*?(?=\n\s*\n|$)/g)].map((m,i)=>({index:i+1,start:m.index,end:m.index+m[0].length,text:m[0]}));
const imageMatches = [...body.matchAll(/!\[([^\]]*)\]\(([^)\n]+)\)/g)];
if (!imageMatches.length) throw new Error('正文没有图片，无法生成图文交付包。');
const expectedImages = option('--expected-images');
if (expectedImages !== undefined && (!/^\d+$/.test(expectedImages) || Number(expectedImages) !== imageMatches.length)) throw new Error('图片数与本次审阅记录不一致：实际 ' + imageMatches.length);
const entries = [];
for (const [i,m] of imageMatches.entries()) {
  const a = resolveAsset(m[2]);
  if (!await exists(a.source)) throw new Error('高清源图缺失：' + a.source);
  const isJpeg = /\.jpe?g$/i.test(a.source);
  const filename = String(i+1).padStart(2,'0')+'_'+a.id.replace(/^\d+-/,'').replace(/[^a-z0-9-]/gi,'-')+(isJpeg?'.jpg':'.png');
  const preceding = body.slice(0,m.index);
  const section = [...preceding.matchAll(/^## (.+)$/gm)].at(-1)?.[1] || '开篇';
  const subsection = [...preceding.slice(preceding.lastIndexOf('\n## ')).matchAll(/^### (.+)$/gm)].at(-1)?.[1] || null;
  const block = blocks.find(b => m.index >= b.start && m.index < b.end);
  const isProse = b => !/^#{1,6} |^!\[/.test(b.text);
  const before = blocks.filter(b => b.end <= m.index && isProse(b)).at(-1)?.text || '';
  const after = blocks.find(b => b.start > m.index && isProse(b))?.text || '';
  const meta = await sharp(a.source).metadata();
  entries.push({...a,order:i+1,caption:m[1],section,subsection,bodyLine:preceding.split('\n').length,bodyBlock:block?.index,
    paragraphBefore:before,paragraphAfter:after,localFile:'图片/'+filename,websitePath:m[2],websiteUrl:origin+m[2],dimensions:[meta.width,meta.height],sourceSha256:sha(await fs.readFile(a.source)),
    narratorClues:narratorClues(a.id,a.originalFile)});
}
const counts = Object.fromEntries([...new Set(entries.map(e=>e.kind))].map(k=>[k,entries.filter(e=>e.kind===k).length]));
const cover = generated.assets.find(a=>a.id==='cover');
const coverSource = path.join(root,cover.sourceSigned);
if (!await exists(coverSource)) throw new Error('封面源图缺失。');
const absoluteLink = href => href.startsWith('/') ? origin+href : href;
let imageIndex = 0;
const articleBody = body.replace(/(!?)\[([^\]]*)\]\(([^)\n]+)\)(\{card\})?/g,(all,bang,label,href)=>{
  if (bang) return '!['+label+']('+entries[imageIndex++].localFile+')';
  return '['+label+']('+absoluteLink(href)+')';
});
const guide = plan.guide;
const guideText = '## 阅读导读\n\n**本文适合谁**\n\n'+guide.audience.map(t=>'- '+t).join('\n')+'\n\n**你会得到什么**\n\n'+guide.outcomes.map(t=>'- '+t).join('\n')+'\n\n**准备和状态**\n\n'+guide.prepare+'\n\n'+guide.status;
const markdown = '# '+plan.title+'\n\n'+plan.summary+'\n\n'+guideText+'\n\n'+articleBody+'\n';
function toPlain(md) {
  return md.replace(/!\[([^\]]*)\]\((图片\/([^)]*))\)/g,(_,caption,file,name)=>'[配图 '+name.slice(0,2)+'：'+caption+']\n文件：'+file)
    .replace(/\[([^\]]+)\]\(([^)\n]+)\)/g,(_,label,url)=>label+'（'+url+'）')
    .replace(/^#{1,6}\s+/gm,'').replace(/^>\s?/gm,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1')
    .replace(/^\|(?:[ \t]*:?-+:?[ \t]*\|)+[ \t]*$/gm,'').replace(/^\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm,(_,row)=>row.replace(/[ \t]*\|[ \t]*/g,' ｜ '))
    .replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
const plain = toPlain(markdown);
const bodyUrls = [...body.matchAll(/(?<!!)\[[^\]]+\]\(([^)\n]+)\)/g)].map(m=>absoluteLink(m[1]));
for (const url of bodyUrls) if (!markdown.includes(url)||!plain.includes(url)) throw new Error('导出遗漏链接：'+url);
const invitationLines = body.split('\n').filter(l=>/^> .*邀请码/.test(l));
for (const invite of invitationLines) {
  const code = invite.match(/邀请码[:：]\s*\*\*([^*]+)\*\*/)?.[1];
  if (code && (!markdown.includes(code)||!plain.includes(code))) throw new Error('邀请码丢失：'+code);
}
if (markdown.includes('{card}')) throw new Error('导出还残留 card 标记。');
// Keep each complete platform section, including its pictures and conditions.
// An index of invitation URLs alone would repeat the omissions of the first export.
const portableSections = articleBody.split(/(?=^## )/m).filter(section => /邀请码|银河[\s\S]*?(?:领取|联系|申请)/.test(section));
const portableRegistration = '# 开户、领取与邀请码图文\n\n以下按正文完整保留相关平台章节，包括原始图片、申请条件、邀请信息和可用入口；没有另外编造注册链接或下载地址。原文与完整费用比较见本包《01_网站文章.md》。\n\n'+portableSections.join('\n').trim()+'\n';
for (const invite of invitationLines) {
  const href = invite.match(/\]\(([^)]+)\)/)?.[1];
  if (href && !toPlain(portableRegistration).includes(absoluteLink(href))) throw new Error('开户图文遗漏邀请链接：'+href);
}
const packageManifest = {
  title:plan.title,createdOn:date,sourceArticle:input,sourceArticleSha256:sha(inputText),sourceBodySha256:bodySha,
  sourceNarration:narratorPath,sourceNarrationSha256:narrationSha,narrationUnmodified:true,
  originalNarrationCopy:'05_原始口播稿_完整保留.txt',
  contentStatus:'网站文章的可复用图文版本；不是另编的 YouTube 口播或 X 短帖，未发布到外部平台。',
  numbering:'按当前网站正文图片出现顺序，00 是独立封面；不是旧口播配图编号。bodyLine 对应无 frontmatter 正文行，bodyBlock 按空行分块并包含标题/表格/图片块。',
  feeDate:fees.date,feeHistoricalException:'BIT 证券费率采用 2026-11-08 历史核验记录，本轮不冒称当前复核通过。',
  missingScreenshot:'BIT 证券 QQQ 的真实下单与成交截图未提供；使用明确的概念流程图，QQQB 现货截图仅说明误入口。',
  invitationNote:'网站邀请卡的动态品牌权益以当前网页配置展示；独立稿保留本篇明确写入的条件。',
  linksReviewedForExport:flag('--links-reviewed'),links:[...new Set(bodyUrls)],invitationBlocks:invitationLines.length,counts,
  cover:{order:0,localFile:'图片/00_cover.png',source:coverSource,websitePath:'/images/articles/covers/qqq-buying-walkthrough.webp',dimensions:cover.sourceDimensions},images:entries
};
const orderLines = ['# 配图顺序与原稿对应线索','','按当前网站正文顺序导出 '+entries.length+' 张图，00 为独立封面。不是旧口播的图片编号，也不生成时间码。','','封面：[00_cover.png](图片/00_cover.png)；用于列表、封面或视频标题画面，未重复加入正文。',''];
for (const e of entries) {
  orderLines.push('## '+String(e.order).padStart(2,'0')+' · '+e.caption,'','- 章节：'+e.section+(e.subsection?' / '+e.subsection:''),'- 正文位置：第 '+e.bodyLine+' 行、空行分块 '+e.bodyBlock,'- 本地文件：['+path.basename(e.localFile)+']('+e.localFile+')','- 网站图片：'+e.websiteUrl,'- 本次安全高清来源：'+e.source,'- 原始素材来源：'+e.originalFile,'- 处理：'+(e.redacted?'已使用脱敏副本；'+e.redaction.reason:e.kind==='existing-screenshot'?'已有截图保持原尺寸；WebP 源无损解码为 PNG，不冒称增加清晰度。':e.kind==='existing-illustration'?'已有教学示意图保持原尺寸，不能作为真实操作截图。':'使用已签名高清 PNG，保留原有宽高与文字。'),'- 原口播对应线索：');
  if (e.narratorClues.matches.length) for (const c of e.narratorClues.matches) orderLines.push('  - 当前 01_口播稿.txt 第 '+c.line+' 行：'+c.text);
  else orderLines.push('  - 本次为网站补充素材，未找到完全对应原稿句子；按本节语义选用。');
  if(e.narratorClues.oldImageMap) orderLines.push('- 旧对应表锚点：'+e.narratorClues.oldImageMap.anchor+'（原表段落 '+e.narratorClues.oldImageMap.legacyParagraph+'，仅线索）');
  if(e.sourceNotes) orderLines.push('- 原图说明：'+(typeof e.sourceNotes==='string'?e.sourceNotes:JSON.stringify(e.sourceNotes)));
  orderLines.push('','配图前段落：'+e.paragraphBefore,'','配图后段落：'+e.paragraphAfter,'');
}
const instructions = '# 图文交付使用说明\n\n'+plan.title+'\n\n'+[
'01_网站文章.md：完整导读、正文、图注、表格、邀请信息与引用链接。图片改为本包本地路径；本站链接改为绝对网址；网站专用 {card} 标记移除。',
'02_纯文字稿.txt：同一篇网站稿的文字导出，保留网址和 [配图 xx] 标记。它不是重新创作的视频口播稿，未修改原始 01_口播稿.txt。',
'03_配图顺序.md / .json：网站正文图片顺序、章节与前后段落、原图和安全副本来源、原口播检索线索。旧稿配图号不等于新顺序；没有编造时间码。',
'04_开户与领取图文.md / .txt：从正文保留完整的平台开户相关章节，包含注册截图、邀请码、联系方式与原文已有的链接，便于制作独立的 X 图文或视频段落。没有另猜入口或重编步骤。',
'05_原始口播稿_完整保留.txt：原始 01_口播稿.txt 的逐字完整副本，与原文件 SHA-256 一致；不被网站文章的措辞或结构覆盖。',
'图片/：'+entries.length+' 张正文用图和 1 张独立封面，严格按正文出现顺序导出。原有注册、邀请码与福利图保留；原 WebP 只作无损 PNG 解码，不放大伪装高清。',
'来源记录/：保留概念图提示词、费用原始数据及本包所用截图清单。精确数据图由本地排版输出，概念图由内置 image_gen 生成。'
].map(x=>'- '+x).join('\n')+'\n\n网站稿按段落恢复，仍是经过排版与核验整理的网站版本，并非原稿逐字重排。原稿开头的行情点位及选举时点段落尚未在网站恢复为已核验事实，已完整保留在 05_原始口播稿_完整保留.txt 中，待作者审阅；不以网站措辞覆盖原稿。\n\n本次修订恢复原有注册、邀请码和渠道领取图文；旧版 04_网站图文交付_2026-11-13 保留，未覆盖。独立稿中的每个邀请入口均显示完整链接或明确的填写方法，图片与卡片各自保留。\n\n费用整理日期：2026-11-13；BIT 证券费率保留 2026-11-08 历史核验记录。币安 Maker 活动截至北京时间 2026-12-01 07:59，Bitget 活动条件及结束时间需按公告；费用图不是永久报价。\n\nBIT 证券 QQQ 下单及成交的真实截图尚未提供。流程图是教学示意，QQQB 现货画面只用于说明误入口，不能剪成证券 QQQ 成交证明。\n\n网站邀请卡的动态品牌权益以当前网页配置展示；独立稿保留本篇明确写入的条件。原截图中的行情、额度及日期为历史拍摄状态，旧邀请码、月份或宣传数字的差异见对应图注，实际操作使用本人实时账户信息。\n\n本包没有发布到 X 或 YouTube，没有制作视频。可据此进一步编排 X 内容或视频分镜；不会自动替代原口播。正文和图表更新后应重新导出，避免跨版本混用。\n\n正文 SHA-256：'+bodySha+'\n';

const summary={input,output,bodySha256:bodySha,counts,bodyImages:entries.length,totalWithCover:entries.length+1,links:packageManifest.links.length,narrationSha256:narrationSha};
if (!flag('--write')) { console.log(JSON.stringify({mode:'validated-dry-run',...summary},null,2)); process.exit(0); }

const generatedFiles = {};
const ownershipPath = path.join(output,'.export-manifest.json');
const previous = await exists(ownershipPath) ? JSON.parse(await fs.readFile(ownershipPath,'utf8')) : {files:{}};
async function save(rel,data) {
  const target = path.resolve(output,rel);
  if (!target.startsWith(output+path.sep)) throw new Error('非法导出路径');
  const buffer = Buffer.isBuffer(data)?data:Buffer.from(data);
  if (await exists(target)) {
    const oldHash=sha(await fs.readFile(target));
    if(oldHash!==sha(buffer) && previous.files?.[rel]!==oldHash) throw new Error('发现非脚本或被手动修改的文件，未覆盖：'+target);
  }
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,buffer); generatedFiles[rel]=sha(buffer);
}
await save('图片/00_cover.png',await fs.readFile(coverSource));
for (const e of entries) {
  const bytes=/\.webp$/i.test(e.source)?await sharp(e.source).png().toBuffer():await fs.readFile(e.source);
  await save(e.localFile,bytes); e.exportSha256=sha(bytes);
  const exported=await sharp(bytes).metadata();
  if(exported.width!==e.dimensions[0]||exported.height!==e.dimensions[1]) throw new Error('图片尺寸改变：'+e.localFile);
}
await save('00_使用说明.md',instructions);
await save('01_网站文章.md',markdown);
await save('02_纯文字稿.txt',plain);
await save('03_配图顺序.md',orderLines.join('\n'));
await save('03_配图顺序.json',JSON.stringify(packageManifest,null,2)+'\n');
await save('04_开户与领取图文.md',portableRegistration);
await save('04_开户与领取图文.txt',toPlain(portableRegistration));
await save('05_原始口播稿_完整保留.txt',await fs.readFile(narratorPath));
if (sha(await fs.readFile(path.join(output,'05_原始口播稿_完整保留.txt')))!==narrationSha) throw new Error('原始口播副本与源文件不一致。');
await save('来源记录/生成图提示词与来源.json',JSON.stringify(generated,null,2)+'\n');
await save('来源记录/费用数据与出处.json',JSON.stringify(fees,null,2)+'\n');
await save('来源记录/本篇选用截图.json',JSON.stringify(screenManifest.filter(s=>entries.some(e=>e.websitePath===s.webFile)),null,2)+'\n');
for(const [rel,oldHash] of Object.entries(previous.files||{})) if(!(rel in generatedFiles)) {
  const target=path.resolve(output,rel);
  if(target.startsWith(output+path.sep) && await exists(target) && sha(await fs.readFile(target))===oldHash) await fs.unlink(target);
}
await fs.writeFile(ownershipPath,JSON.stringify({sourceBodySha256:bodySha,files:generatedFiles},null,2)+'\n');
const supplemental=path.join(project,'图片/网站新增配图_2026-11-13');
await fs.mkdir(supplemental,{recursive:true});
const feeNames={'fees-rmb':'19_人民币ETF佣金对照.png','fees-brokers':'20_证券平台费与碎股对照.png','fees-tokens':'21_股票代币手续费对照.png'};
const preservedSupplementalFeeImages=[];
for(const [id,name] of Object.entries(feeNames)) {
  const source=path.join(sourceDir,'fees',id+'.png'),target=path.join(supplemental,name);
  if(await exists(target)) {
    if(sha(await fs.readFile(target))!==sha(await fs.readFile(source))) preservedSupplementalFeeImages.push(name);
  } else await fs.copyFile(source,target);
}
if(sha(await fs.readFile(narratorPath))!==narrationSha) throw new Error('原始口播在执行期间发生变化，请核查。');
const finalFiles=await fs.readdir(path.join(output,'图片'));
if(finalFiles.length!==entries.length+1) throw new Error('导出图片目录应为 '+(entries.length+1)+' 个文件，实际 '+finalFiles.length+'；检查额外文件，不自动删除用户文件。');
console.log(JSON.stringify({mode:'written-and-verified',...summary,files:Object.keys(generatedFiles).length,supplementalFeeImages:Object.values(feeNames),preservedSupplementalFeeImages},null,2));
