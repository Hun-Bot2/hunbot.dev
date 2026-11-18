import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveEditorialReading } from '../src/utils/editorial-reading.ts';
const post=(id,data={})=>({id,data:{title:id,description:'A finished article',pubDate:new Date('2026-01-01'),...data}});
test('internal reading resolves actual published same-language slugs and source metadata',()=>{
 const links=resolveEditorialReading(['study/next'],[post('ko/study/next',{title:'실제 제목'})],'ko','ko/study/current');
 assert.equal(links[0].url,'/ko/blog/study/next/');assert.equal(links[0].title,'실제 제목');
});
test('drafts, placeholders, self, other languages, and unknown targets are withheld',()=>{
 const candidates=[post('ko/study/draft',{draft:true}),post('ko/study/template',{tags:['tag']}),post('en/study/english'),post('ko/study/self')];
 assert.deepEqual(resolveEditorialReading(['study/draft','study/template','study/english','study/self','study/missing'],candidates,'ko','ko/study/self'),[]);
});
test('explicit reading order is retained and duplicate selections are removed',()=>{
 const links=resolveEditorialReading(['study/b','study/a','study/b'],[post('ko/study/a'),post('ko/study/b')],'ko');
 assert.deepEqual(links.map(x=>x.url),['/ko/blog/study/b/','/ko/blog/study/a/']);
});

test('node art uses the destination post cover metadata, never a fabricated image',()=>{
 const result=resolveEditorialReading(['study/image','study/motif'],[post('ko/study/image',{heroImage:'/images/my-cover.webp'}),post('ko/study/motif',{editorial:{motif:'research'}})],'ko');
 assert.equal(result[0].image,'/images/my-cover.webp');
 assert.equal(result[1].motif,'research');
 assert.equal(result[1].image,undefined);
});
