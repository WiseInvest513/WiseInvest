import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";
const source = fs.readFileSync(new URL("../lib/article-library-filters.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const module = {exports:{}};
new Function("module", "exports", compiled)(module, module.exports);
const {readArticleLibraryFilters, updateArticleLibrarySearch, filterArticleLibrary, getSeriesAvailability} = module.exports;
const articles = [
  {id:"lesson-2",title:"第二课",summary:"开户步骤",categoryId:"broker",subcategoryId:"digital-broker",date:"2026-01-01",readTime:20},
  {id:"lesson-1",title:"第一课",summary:"开户比较",categoryId:"broker",subcategoryId:"us-broker",date:"2026-02-01",readTime:5},
  {id:"bank",title:"银行",summary:"开户准备",categoryId:"bank",date:"2026-03-01",readTime:10},
  {id:"unknown",title:"待整理",summary:"资料",categoryId:"broker"},
];
const ids = rows => rows.map(article=>article.id);
test("URL updates preserve navigation context and decode Chinese search terms",()=>{
 const search=updateArticleLibrarySearch("view=all&subcategory=digital-broker&series=abc&route=usd",{q:"开户 比较",topic:"broker",sort:"shortest"});
 const params=new URLSearchParams(search);
 assert.equal(params.get("view"),"all");assert.equal(params.get("subcategory"),"digital-broker");assert.equal(params.get("series"),"abc");assert.equal(params.get("route"),"usd");
 assert.deepEqual(readArticleLibraryFilters(search,["broker","bank"]),{q:"开户 比较",topic:"broker",sort:"shortest"});
 assert.deepEqual(readArticleLibraryFilters(updateArticleLibrarySearch(search,{q:"",topic:"",sort:""}),["broker"]),{q:"",topic:"",sort:""});
 assert.deepEqual(readArticleLibraryFilters("q=ok&topic=invalid&sort=random",["broker"]),{q:"ok",topic:"",sort:""});
});
test("search covers the library and topic filters narrow it without stale category scope",()=>{
 assert.deepEqual(ids(filterArticleLibrary(articles,{query:"开户",categoryId:"broker",subcategoryId:"us-broker"})),["lesson-2","lesson-1","bank"]);
 assert.deepEqual(ids(filterArticleLibrary(articles,{query:"开户",topic:"bank",categoryId:"broker"})),["bank"]);
 assert.deepEqual(ids(filterArticleLibrary(articles,{categoryId:"broker",subcategoryId:"digital-broker"})),["lesson-2"]);
 assert.deepEqual(filterArticleLibrary(articles,{query:"not-present",topic:"broker"}),[]);
});
test("explicit sorting preserves source data and puts missing values last",()=>{
 const snapshot=structuredClone(articles);
 assert.deepEqual(ids(filterArticleLibrary(articles,{sort:"newest"})),["bank","lesson-1","lesson-2","unknown"]);
 assert.deepEqual(ids(filterArticleLibrary(articles,{sort:"shortest"})),["lesson-1","bank","lesson-2","unknown"]);
 assert.deepEqual(ids(filterArticleLibrary(articles,{sort:"longest"})),["lesson-2","bank","lesson-1","unknown"]);
 assert.deepEqual(articles,snapshot);
});
test("the default course order remains until readers explicitly choose a sort",()=>{
 const options={categoryId:"broker",defaultOrder:["lesson-1","lesson-2"]};
 assert.deepEqual(ids(filterArticleLibrary(articles,options)),["lesson-1","lesson-2","unknown"]);
 assert.deepEqual(ids(filterArticleLibrary(articles,{...options,sort:"longest"})),["lesson-2","lesson-1","unknown"]);
});
test("an existing comprehensive guide is readable without inventing planned chapters",()=>{
 assert.deepEqual(getSeriesAvailability({chapters:[{title:"plan"}],existingArticleId:"guide"},new Set(["guide"])),{readableCount:1,chapterCount:0,hasExisting:true});
 assert.deepEqual(getSeriesAvailability({chapters:[{articleId:"guide"},{articleId:"guide"}],existingArticleId:"guide"},new Set(["guide"])),{readableCount:1,chapterCount:1,hasExisting:true});
 assert.deepEqual(getSeriesAvailability({chapters:[{}],existingArticleId:"missing"},new Set()),{readableCount:0,chapterCount:0,hasExisting:false});
});
