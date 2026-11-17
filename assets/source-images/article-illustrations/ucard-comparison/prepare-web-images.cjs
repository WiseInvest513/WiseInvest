const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../../..');
const sharp=require(path.join(root,'node_modules/sharp'));
(async()=>{
 const manifest=[];
 const tasks=[
  {name:'payment-cost-flow',raw:path.join(__dirname,'payment-cost-flow-raw.png'),out:'public/images/articles/illustrations/ucard-comparison/payment-cost-flow.webp',width:1120,height:630,quality:62},
  {name:'usd-cost-model',raw:path.join(__dirname,'usd-cost-model-raw.png'),out:'public/images/articles/illustrations/ucard-comparison/usd-cost-model.webp',width:1120,height:784,quality:76},
  {name:'ucard-comparison-fees',raw:path.join(root,'assets/source-images/article-covers/ucard-comparison-fees-raw.png'),out:'public/images/articles/covers/ucard-comparison-fees.webp',width:640,height:360,quality:60},
 ];
 for(const t of tasks){
  const meta=await sharp(t.raw).metadata();
  const sig=await sharp(path.join(root,'public/images/brand/wise-invest-signature.png')).resize({width:Math.round(meta.width*.16)}).png().toBuffer();
  const sm=await sharp(sig).metadata();
  const mask=Buffer.from(`<svg width="${sm.width}" height="${sm.height}"><rect width="100%" height="100%" rx="${Math.round(sm.height*.2)}" fill="white"/></svg>`);
  const rounded=await sharp(sig).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  const source=t.raw.replace('-raw.png','.png');
  await sharp(t.raw).composite([{input:rounded,left:meta.width-sm.width-Math.round(meta.width*.018),top:Math.round(meta.height*.025)}]).png().toFile(source);
  const out=path.join(root,t.out);fs.mkdirSync(path.dirname(out),{recursive:true});
  await sharp(source).resize(t.width,t.height,{fit:'contain',background:'#fbfbfa'}).webp({quality:t.quality,effort:6,smartSubsample:true}).toFile(out);
  manifest.push({name:t.name,path:t.out,width:t.width,height:t.height,quality:t.quality,bytes:fs.statSync(out).size});
 }
 fs.writeFileSync(path.join(__dirname,'web-assets.json'),JSON.stringify(manifest,null,2)+'\n');console.log(manifest);
})();
