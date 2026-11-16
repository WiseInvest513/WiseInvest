const path=require('path'),fs=require('fs');
const root=path.resolve(__dirname,'../../../..');
const sharp=require(path.join(root,'node_modules/sharp'));
(async()=>{
 const web=path.join(root,'public/images/articles/illustrations/bbae-schwab-ibkr-comparison');
 const manifest=[];
 for(const name of ['account-relationships','fee-comparison','funding-round-trip']){
  const raw=path.join(__dirname,name+'-raw.png'),meta=await sharp(raw).metadata();
  const sigWidth=Math.round(meta.width*.16);
  const sig=await sharp(path.join(root,'public/images/brand/wise-invest-signature.png')).resize({width:sigWidth}).png().toBuffer();
  const sm=await sharp(sig).metadata();
  const mask=Buffer.from(`<svg width="${sm.width}" height="${sm.height}"><rect width="100%" height="100%" rx="${Math.round(sm.height*.2)}" fill="white"/></svg>`);
  const rounded=await sharp(sig).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  const source=path.join(__dirname,name+'.png');
  await sharp(raw).composite([{input:rounded,left:meta.width-sm.width-Math.round(meta.width*.018),top:Math.round(meta.height*.022)}]).png().toFile(source);
  const final=path.join(web,name+'.webp');
  const quality=name==='fee-comparison'?76:62;
  await sharp(source).resize({width:1120,withoutEnlargement:true}).webp({quality,effort:6,smartSubsample:true}).toFile(final);
  const out=await sharp(final).metadata();
  manifest.push({name,src:'/images/articles/illustrations/bbae-schwab-ibkr-comparison/'+name+'.webp',width:out.width,height:out.height,bytes:fs.statSync(final).size,quality});
 }
 fs.writeFileSync(path.join(__dirname,'web-assets.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify(manifest,null,2));
})();
