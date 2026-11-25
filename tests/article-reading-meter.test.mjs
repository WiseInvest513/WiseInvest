import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url)), nativeRequire=createRequire(import.meta.url);
const modules=new Map(), jar=new Map(); let tier=null;
const ArticlesContent=()=>null, jsx=(type,props)=>({type,props});
function load(relative){
 const file=path.resolve(root,relative);if(modules.has(file))return modules.get(file).exports;
 const module={exports:{}};modules.set(file,module);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(name=>{
  if(name==='fs'||name==='path'||name.startsWith('node:'))return nativeRequire(name);
  if(name==='next/headers')return {cookies:async()=>({get:key=>jar.has(key)?{value:jar.get(key)}:undefined})};
  if(name==='@/lib/identity/content-viewer')return {getContentViewerTier:async()=>tier};
  if(name==='next/server')return {NextResponse:{json:(body,init)=>({body,...init,cookies:{set:(key,value,options)=>{jar.set(key,value);assert.equal(options.httpOnly,true);assert.equal(options.sameSite,'lax')}}})}};
  if(name==='next/navigation')return {notFound:()=>{throw Error('404')}};
  if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:'fragment'};
  if(name==='@/app/articles/articles-content')return {ArticlesContent};
  if(name==='next/cache')return {unstable_cache:fn=>fn};
  const resolved=name.startsWith('@/')?path.join(root,name.slice(2)):path.resolve(path.dirname(file),name);
  const target=['.ts','.tsx'].map(ext=>resolved+ext).find(fs.existsSync);if(!target)throw Error(name);return load(target);
 },module,module.exports);return module.exports;
}
const meter=load('lib/article-reading-meter.ts'), cookie=load('lib/article-reading-meter-cookie.ts'), server=load('lib/article-reading-meter-server.ts');
const api=load('app/api/articles/reading/route.ts'), list=load('app/api/articles-fs/route.ts'), page=load('app/articles/[categoryId]/[uid]/page.tsx');
const {getAllArticles,getArticleRoute}=load('lib/articles.ts');
const articles=getAllArticles();const now=Date.now(), key=i=>cookie.readingKey('test-'+i);
const req=(id,origin='http://localhost')=>({nextUrl:new URL('http://localhost/api/articles/reading'),headers:new Headers({origin}),json:async()=>({articleId:id})});
function reset(){jar.clear();tier=null;}

test('rolling window deduplicates articles, expires exact boundary and rejects corrupt records',()=>{
 const entries=meter.normalizeReadings([[key(1),now],[key(1),now-20],[key(2),now-meter.READING_WINDOW_MS],[key(3),now+1],['bad',now],null],now);
 assert.deepEqual(entries,[[key(1),now]]);
 assert.deepEqual(meter.recordReading(entries,key(1),now+100),entries);
 assert.equal(meter.recordReading(entries,key(2),now).length,2);
 assert.equal(meter.recordReading(entries,key(1),now+meter.READING_WINDOW_MS).length,1);
});
test('signed cookie rejects tampering, wrong keys, malformed input and stale entries',()=>{
 const encoded=cookie.encodeReadingCookie([[key(1),now]],'secret');
 assert.deepEqual(cookie.decodeReadingCookie(encoded,'secret',now),[[key(1),now]]);
 for(const value of [encoded+'x','invalid','a'.repeat(4000)])assert.deepEqual(cookie.decodeReadingCookie(value,'secret',now),[]);
 assert.deepEqual(cookie.decodeReadingCookie(encoded,'other',now),[]);
 assert.deepEqual(cookie.decodeReadingCookie(encoded,'secret',now+meter.READING_WINDOW_MS),[]);
});
test('real reading endpoint counts 5 and 15 distinct articles, caps at 15, never counts repeated or unknown IDs',async()=>{
 reset();assert.equal((await api.GET()).body.count,0);
 for(let i=0;i<15;i++){
  const response=await api.POST(req(articles[i].id));assert.equal(response.body.count,i+1);assert.equal(response.body.locked,i===14);
  assert.equal((await api.POST(req(articles[i].id))).body.count,i+1);
 }
 assert.equal((await api.POST(req(articles[15].id))).body.count,15);
 assert.equal((await api.POST(req('does-not-exist'))).status,404);
 assert.equal((await api.POST(req(articles[0].id,'https://outside.test'))).status,403);
 const proxied=req(articles[0].id,'http://127.0.0.1:3002');
 proxied.headers.set('host','127.0.0.1:3002');
 assert.equal((await api.POST(proxied)).body.count,15,'actual Host wins over Next internal localhost URL');
 assert.equal(await server.requiresReadingRegistration(),true);
});
test('locked SSR sends only a prefix and no hidden FAQ/body; canonical and series routes agree',async()=>{
 reset();jar.set(meter.READING_COOKIE,cookie.encodeReadingCookie(Array.from({length:15},(_,i)=>[key(i),Date.now()]),server.readingMeterSecret()));
 const article=articles.find(a=>a.id==='bank-fx-transfer-cost');const uid=getArticleRoute(article).split('/').at(-1);
 for(const query of [{},{series:'hk-stock-funding',route:'hk-card-to-hk-broker',fromSeries:'overseas',fromStage:'banks'}]){
  const tree=await page.default({params:Promise.resolve({categoryId:article.categoryId,uid}),searchParams:Promise.resolve(query)});
  const props=tree.props.children.find(c=>c.type===ArticlesContent).props;
  assert.equal(props.lockedContent.readingTrial,true);assert.ok(props.initialArticle.content.length<article.content.length*.31);
  assert.ok(article.content.startsWith(props.initialArticle.content));assert.deepEqual(props.initialFaqs,[]);
  assert.ok(!JSON.stringify(tree).includes('用两道题核对自己的报价表'));
  assert.ok(props.initialArticles.every(a=>!Object.hasOwn(a,'content')));
  const callback=new URL(props.lockedContent.loginHref,'http://local').searchParams.get('callbackUrl');
  if(query.series)assert.ok(callback.includes('series=hk-stock-funding'));
 }
});
test('ordinary members unlock without VIP and registration endpoint stops counting',async()=>{
 tier='MEMBER';assert.equal(await server.requiresReadingRegistration(),false);
 const before=jar.get(meter.READING_COOKIE);const result=await api.POST(req(articles[16].id));
 assert.equal(result.body.authenticated,true);assert.equal(result.body.locked,false);assert.equal(jar.get(meter.READING_COOKIE),before);
 const article=articles.find(a=>a.id==='bank-fx-transfer-cost');
 const tree=await page.default({params:Promise.resolve({categoryId:article.categoryId,uid:getArticleRoute(article).split('/').at(-1)}),searchParams:Promise.resolve({})});
 assert.equal(tree.props.children.find(c=>c.type===ArticlesContent).props.initialArticle.content,article.content);
});
test('search API never distributes bodies, regardless of guest/member status',async()=>{
 for(const value of [null,'MEMBER']){tier=value;const response=await list.GET();assert.equal(response.body.length,articles.length);assert.ok(response.body.every(a=>!Object.hasOwn(a,'content')&&!Object.hasOwn(a,'guideProfile')));}
 reset();assert.equal(await server.requiresReadingRegistration(),false);
});
