const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const sharp = require(path.join(root, 'node_modules/sharp'));
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'research-shiller.json'),'utf8'));
const output = path.join(root,'public/images/articles/sp500-midterm-strategy');
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const C={ink:'#14243c',sub:'#61718a',blue:'#3265a8',light:'#edf3fa',gold:'#b88b42',goldLight:'#fbf6e9',grid:'#dce5ef'};
const t=(x,y,text,size=24,color=C.ink,weight=400,anchor='start')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${escape(text)}</text>`;
const rect=(x,y,w,h,fill,r=0)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" rx="${r}"/>`;
const line=(x1,y1,x2,y2,stroke,width=1,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const svg=(w,h,content)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><style>text{font-family:'PingFang SC','Heiti SC','Arial',sans-serif}</style>${rect(0,0,w,h,'#fff')}${content}</svg>`;
function returnsSvg(){
 const w=1400,h=1100,x=166,plotWidth=1040,top=347,rowH=30.7,max=35;
 const values=data.rows.map(r=>r.twelve_month_return);
 if(data.rows.length!==19||data.rows[0].year!==1950||data.rows.at(-1).year!==2022)throw new Error('Unexpected sample');
 data.rows.forEach(r=>{if(Math.abs((r.october_price/r.start_price-1)*100-r.twelve_month_return)>1e-8)throw new Error('Formula mismatch');});
 const mean=values.reduce((a,b)=>a+b,0)/values.length,median=[...values].sort((a,b)=>a-b)[9],positive=values.filter(v=>v>0).length;
 let s=t(64,95,'标普 500：10 月到次年 10 月',43,C.ink,700)+t(64,143,'1950–2022 年中期选举 · 10 月均价 → 次年 10 月均价',25,C.sub);
 [{x:64,label:'算术平均回报',value:mean.toFixed(1)+'%'},{x:497,label:'中位数回报',value:median.toFixed(1)+'%'},{x:930,label:'正回报样本',value:`${positive} / ${values.length}`}].forEach(({x,label,value},i)=>{
 s+=rect(x,182,406,110,i===2?C.goldLight:C.light,16)+t(x+25,219,label,23,C.sub)+t(x+25,267,value,39,i===2?C.gold:C.blue,700);
 });
 for(const tick of [0,5,10,15,20,25,30,35]){
 const tx=x+tick/max*plotWidth;
 s+=line(tx,top-12,tx,top+18*rowH+27,C.grid,1)+t(tx,top-23,tick+'%',19,C.sub,400,'middle');
 }
 data.rows.forEach((r,i)=>{
 const cy=top+i*rowH,barWidth=r.twelve_month_return/max*plotWidth;
 s+=t(126,cy+19,r.year,22,C.ink,500,'end');
 s+=rect(x,cy,barWidth,23,r.year===1954?C.gold:C.blue,4);
 s+=t(x+barWidth+12,cy+18,r.twelve_month_return.toFixed(2)+'%',20,C.ink,500);
 });
 s+=line(64,964,1336,964,C.grid,1);
 s+=t(64,1004,'价格回报，不含分红、费用与税；月均价比较不是实际成交。',24,C.ink,600);
 s+=t(64,1041,'数据：Robert J. Shiller 月度价格序列（P）；Wise 按固定窗口复算。',21,C.sub);
 s+=t(64,1073,'1957 年前为前身指数历史序列；历史样本不代表下一次结果。核验：2026-11-06',20,C.sub);
 return svg(w,h,s);
}
function windowsSvg(){
 const w=1400,h=820;
 let s=t(64,95,'同一个策略，先把起点说清楚',44,C.ink,700)+t(64,144,'历史月均价窗口 ≠ 个人实际成交窗口',26,C.sub);
 const rows=[
 {y:185,title:'历史窗口 A',note:'约 6 个月',start:'10 月均价',end:'次年 4 月均价',endX:825,color:C.blue,fill:C.light},
 {y:332,title:'历史窗口 B',note:'约 12 个月',start:'10 月均价',end:'次年 10 月均价',endX:1200,color:C.blue,fill:C.light},
 {y:479,title:'真实交易',note:'按真实成本复盘',start:'实际成交日',end:'预先约定退出日',endX:1120,color:C.gold,fill:C.goldLight}
 ];
 rows.forEach((r,i)=>{
 s+=rect(64,r.y,1272,128,r.fill,16)+t(88,r.y+43,r.title,28,C.ink,700)+t(88,r.y+82,r.note,22,C.sub);
 const startX=450,cy=r.y+43;
 s+=line(startX,cy,r.endX,cy,r.color,4,i===2?'stroke-dasharray="10 7"':'');
 s+=`<circle cx="${startX}" cy="${cy}" r="8" fill="${r.color}"/><circle cx="${r.endX}" cy="${cy}" r="8" fill="${r.color}"/>`;
 s+=`<path d="M ${r.endX-16} ${cy-10} L ${r.endX} ${cy} L ${r.endX-16} ${cy+10}" fill="none" stroke="${r.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
 s+=t(startX,cy+45,r.start,24,C.ink,600,'middle')+t(r.endX,cy+45,r.end,24,C.ink,600,'middle');
 });
 s+=rect(64,641,1272,119,C.goldLight,14)+rect(64,641,5,119,C.gold,2);
 s+=t(90,686,'已过 10 月，不能沿用 10 月成本',30,C.ink,700);
 s+=t(90,727,'个人回报取决于实际成交价格，以及分红、费用与税；时间轴仅示意比较口径。',23,C.sub);
 s+=t(64,796,'示意图 · 历史窗口用于研究；实际交易需另行制定入场、退出与风险安排。',21,C.sub);
 return svg(w,h,s);
}
async function write(name,source){
 const svgFile=path.join(__dirname,name+'.svg');fs.writeFileSync(svgFile,source);
 const raster=await sharp(Buffer.from(source)).png().toBuffer();
 const width=224,original=path.join(root,'public/images/brand/wise-invest-signature.png'),metadata=await sharp(original).metadata();
 const height=Math.round(width*metadata.height/metadata.width);
 const mask=Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${Math.round(height*.2)}" fill="white"/></svg>`);
 const mark=await sharp(original).resize({width}).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
 const png=await sharp(raster).composite([{input:mark,left:1112,top:26}]).png().toBuffer();
 fs.writeFileSync(path.join(__dirname,name+'.png'),png);
 const dest=path.join(output,name+'.webp');await sharp(png).webp({quality:82}).toFile(dest);
 const final=await sharp(dest).metadata();const bytes=fs.statSync(dest).size;
 if(bytes>200000)throw new Error('Chart too large');
 return {name,width:final.width,height:final.height,bytes};
}
(async()=>{fs.mkdirSync(output,{recursive:true});console.log(JSON.stringify(await Promise.all([write('returns',returnsSvg()),write('windows',windowsSvg())]),null,2));})().catch(e=>{console.error(e);process.exit(1)});
