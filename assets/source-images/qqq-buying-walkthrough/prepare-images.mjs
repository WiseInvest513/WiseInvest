import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root = process.cwd();
const sourceDir = path.join(root, 'assets/source-images/qqq-buying-walkthrough');
const manifestPath = path.join(sourceDir, 'generation.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const signaturePath = path.join(root, manifest.signature);
const signatureBytes = await fs.readFile(signaturePath);
manifest.signatureSha256 = crypto.createHash('sha256').update(signatureBytes).digest('hex');
for (const item of manifest.assets) {
  const raw = path.join(sourceDir, item.id + '-generated.png');
  await fs.copyFile(item.generatedPath, raw);
  if (item.initialGeneratedPath) await fs.copyFile(item.initialGeneratedPath, path.join(sourceDir, item.id + '-initial-generated.png'));
  const meta = await sharp(raw).metadata();
  const unit = Math.ceil(Math.max(meta.width / 16, meta.height / 9));
  const width = unit * 16, height = unit * 9;
  const dx = width - meta.width, dy = height - meta.height;
  const padded = await sharp(raw).extend({
    left: Math.floor(dx / 2), right: Math.ceil(dx / 2),
    top: Math.floor(dy / 2), bottom: Math.ceil(dy / 2),
    background: item.id === 'cover' ? '#ffffff' : '#fae6d2'
  }).png().toBuffer();
  const brandWidth = Math.round(width * 0.16);
  const brand = await sharp(signatureBytes).resize({width: brandWidth}).png().toBuffer();
  const brandMeta = await sharp(brand).metadata();
  const radius = Math.round(brandMeta.height * 0.2);
  const mask = Buffer.from('<svg width="' + brandMeta.width + '" height="' + brandMeta.height + '"><rect width="100%" height="100%" rx="' + radius + '" ry="' + radius + '" fill="white"/></svg>');
  const roundedBrand = await sharp(brand).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
  const signed = path.join(sourceDir, item.id + '.png');
  await sharp(padded).composite([{input:roundedBrand,left:width - brandMeta.width - Math.round(width * 0.025),top:Math.round(height * 0.028)}]).png().toFile(signed);
  const isCover = item.id === 'cover';
  const webRel = isCover ? 'public/images/articles/covers/qqq-buying-walkthrough.webp' : 'public/images/articles/qqq-buying-walkthrough/' + item.id + '.webp';
  const web = path.join(root, webRel);
  await fs.mkdir(path.dirname(web),{recursive:true});
  await sharp(signed).resize({width:isCover?640:1280,height:isCover?360:720,fit:'contain'}).webp({quality:isCover?60:80}).toFile(web);
  if (isCover) {
    await fs.mkdir(path.join(root, 'assets/source-images/article-covers'),{recursive:true});
    await fs.copyFile(signed, path.join(root,'assets/source-images/article-covers/qqq-buying-walkthrough.png'));
    await fs.copyFile(raw, path.join(root,'assets/source-images/article-covers/qqq-buying-walkthrough-generated.png'));
  }
  item.sourceOriginal = path.relative(root,raw);
  item.sourceSigned = path.relative(root,signed);
  item.originalDimensions = [meta.width,meta.height];
  item.sourceDimensions = [width,height];
  item.webPath = webRel;
  item.webDimensions = isCover ? [640,360] : [1280,720];
  item.webBytes = (await fs.stat(web)).size;
  item.sha256 = crypto.createHash('sha256').update(await fs.readFile(signed)).digest('hex');
  console.log(JSON.stringify({id:item.id,source:signed,web:webRel,dimensions:item.sourceDimensions,webBytes:item.webBytes}));
}
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
