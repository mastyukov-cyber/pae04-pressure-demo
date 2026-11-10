'use strict';
const {test,expect}=require('@playwright/test');

const LOCAL='http://127.0.0.1:4173/diagnostics/demo/';
async function openDemo(browser,width,height){
 const context=await browser.newContext({
   viewport:{width,height},
   deviceScaleFactor:3,isMobile:true,hasTouch:true,
   locale:'ru-RU',storageState:{cookies:[],origins:[]},
 });
 const page=await context.newPage();
 const outside=[];
 page.on('request',r=>{
   if(!r.url().startsWith('http://127.0.0.1:4173/diagnostics/'))outside.push(r.url());
 });
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await page.goto(LOCAL,{waitUntil:'networkidle'});
 await expect(page.getByRole('heading',{name:'Настройки диагностики'})).toBeVisible();
 return {page,context,outside,errors};
}

for(const [label,width,height] of [
 ['compact-320',320,700],['iphone-390',390,844],['large-430',430,932]
]){
 test('PAE-04 diagnostic preview fits '+label+' and makes no external requests',async({browser})=>{
   const {page,context,outside,errors}=await openDemo(browser,width,height);
   try{
     const dims=await page.evaluate(()=>({
       scroll:document.documentElement.scrollWidth,
       inner:window.innerWidth,
       csp:document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content
     }));
     expect(dims.scroll).toBeLessThanOrEqual(width+1);
     expect(dims.inner).toBe(width);
     expect(dims.csp).toContain("connect-src 'none'");
     await expect(page.getByText('Ничего не отправляется',{exact:true})).toBeVisible();
     await expect(page.locator('#apply')).toBeDisabled();
     expect(outside).toEqual([]);
     expect(errors).toEqual([]);
   }finally{await context.close();}
 });
}

test('BASIC: exact seven fields, explicit consent, no pseudonymous ID, no network',async({browser})=>{
 const {page,context,outside,errors}=await openDemo(browser,390,844);
 try{
   await page.locator('#basic').check();
   await expect(page.locator('#consentPanel')).toBeVisible();
   await expect(page.locator('#syntheticRow')).toBeHidden();
   await expect(page.locator('#apply')).toBeDisabled();
   const payload=JSON.parse(await page.locator('#preview').innerText());
   expect(Object.keys(payload)).toEqual([
      'project','schema_version','mode','app_version','event_type','component_code','error_code'
   ]);
   expect(payload.mode).toBe('basic_errors');
   expect('qa_install_id' in payload).toBe(false);
   expect('session_id' in payload).toBe(false);
   expect('systolic' in payload).toBe(false);
   await page.locator('#consent').check();
   await expect(page.locator('#apply')).toBeEnabled();
   await page.locator('#apply').click();
   await expect(page.locator('#result')).toContainText('В демонстрации выбран режим');
   await page.locator('#disable').click();
   await expect(page.locator('#off')).toBeChecked();
   await expect(page.locator('#consentPanel')).toBeHidden();
   await expect(page.locator('#apply')).toBeDisabled();
   expect(outside).toEqual([]);
   expect(errors).toEqual([]);
 }finally{await context.close();}
});

test('QA_VERBOSE: requires opt-in AND synthetic confirmation; no transmission',async({browser})=>{
 const {page,context,outside,errors}=await openDemo(browser,390,844);
 try{
   await page.locator('#verbose').check();
   const payload=JSON.parse(await page.locator('#preview').innerText());
   expect(payload.qa_mode).toBe('verbose_synthetic');
   expect(payload.synthetic_only).toBe(true);
   expect(payload.qa_install_id).toMatch(/^[0-9a-f-]{36}$/);
   expect(payload.event_id).toMatch(/^[0-9a-f-]{36}$/);
   for(const field of ['systolic','pulse','medicine_name','email','access_token']){
      expect(field in payload).toBe(false);
   }
   await expect(page.locator('#syntheticRow')).toBeVisible();
   await expect(page.locator('#apply')).toBeDisabled();
   await page.locator('#consent').check();
   await expect(page.locator('#apply')).toBeDisabled();
   await page.locator('#synthetic').check();
   await expect(page.locator('#apply')).toBeEnabled();
   await page.locator('#apply').click();
   await expect(page.locator('#result')).toContainText('Отправка в Cloudflare отсутствует');
   await page.locator('#disable').click();
   await expect(page.locator('#off')).toBeChecked();
   expect(outside).toEqual([]);
   expect(errors).toEqual([]);
 }finally{await context.close();}
});
