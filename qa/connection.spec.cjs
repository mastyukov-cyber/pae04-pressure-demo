'use strict';
const {test,expect}=require('@playwright/test');
const LOCAL='http://127.0.0.1:4175/diagnostics/connection/';
async function open(browser,width,height,{simulateStatus=503,networkError=false}={}){
 const context=await browser.newContext({
   viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3,locale:'ru-RU',
   storageState:{cookies:[],origins:[]},
 });
 await context.addInitScript(({status,networkFail})=>{
   window.fetch=async()=>{
     if(networkFail)throw new TypeError('synthetic network failure');
     return {status};
   };
 },{status:simulateStatus,networkFail:networkError});
 const page=await context.newPage();
 const unexpected=[];
 const errors=[];
 page.on('request',req=>{
   if(!req.url().startsWith('http://127.0.0.1:4175/diagnostics/connection/')){
     unexpected.push(req.url());
   }
 });
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(LOCAL,{waitUntil:'load'});
 await expect(page.getByRole('heading',{name:'Проверка связи'})).toBeVisible();
 return {context,page,unexpected,errors};
}
for(const [label,w,h] of [
  ['320px iPhone SE',320,700],['390px iPhone',390,844],['430px iPhone Pro Max',430,932]
]){
 test('GitHub connectivity page fits '+label+' with no unsolicited requests',async({browser})=>{
   const {context,page,unexpected,errors}=await open(browser,w,h);
   try{
     const dims=await page.evaluate(()=>({
       scroll:document.documentElement.scrollWidth,viewport:window.innerWidth
     }));
     expect(dims.viewport).toBe(w);
     expect(dims.scroll).toBeLessThanOrEqual(w+1);
     await expect(page.getByText('Страница открылась')).toBeVisible();
     await expect(page.locator('#probe-state')).toHaveText('Ещё не проверяли');
     expect(unexpected).toEqual([]);
     expect(errors).toEqual([]);
   }finally{await context.close();}
 });
}
test('explicit tap: disabled remote API HTTP 503 shows success',async({browser})=>{
 const {context,page,unexpected,errors}=await open(browser,390,844);
 try{
   await page.locator('#probe').click();
   await expect(page.locator('#probe-state')).toHaveText('Cloudflare доступен');
   await expect(page.locator('#probe-caption')).toContainText('PASS');
   expect(unexpected).toEqual([]);
   expect(errors).toEqual([]);
 }finally{await context.close();}
});
test('explicit tap: no Cloudflare network correctly shows a warning',async({browser})=>{
 const {context,page,unexpected,errors}=await open(browser,390,844,{networkError:true});
 try{
   await page.locator('#probe').click();
   await expect(page.locator('#probe-state')).toHaveText('Нет ответа Cloudflare из браузера');
   await expect(page.locator('#probe-caption')).not.toContainText('PASS');
   expect(unexpected).toEqual([]);
   expect(errors).toEqual([]);
 }finally{await context.close();}
});
test('explicit tap: HTTP 204 must NEVER be shown as success',async({browser})=>{
 const {context,page,errors}=await open(browser,390,844,{simulateStatus:204});
 try{
   await page.locator('#probe').click();
   await expect(page.locator('#probe-state')).toHaveText('Неожиданное принятие запроса');
   await expect(page.locator('#probe-caption')).not.toContainText('PASS');
   expect(errors).toEqual([]);
 }finally{await context.close();}
});
