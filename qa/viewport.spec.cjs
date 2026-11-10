'use strict';
const { test, expect } = require('@playwright/test');

// Browser engine: Linux Playwright WebKit with iPhone dimensions, NOT real iOS Safari.
// Public synthetic test page, no account creation or credential entry.
const profiles = [
  ['narrow-320-portrait', 320, 700],
  ['compact-375-portrait', 375, 812],
  ['iPhone-390-portrait', 390, 844],
  ['large-430-portrait', 430, 932],
  ['iPhone-844-landscape', 844, 390],
];

for (const [name, width, height] of profiles) {
  test('PAE-04 synthetic responsive layout ' + name, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: 'ru-RU',
      storageState: { cookies: [], origins: [] },
    });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Новое измерение' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Создать тестовый аккаунт' })).toBeVisible();

      const metrics = await page.evaluate(() => {
        const visibleWidth = window.innerWidth;
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const suspects = [];
        for (const element of document.querySelectorAll('body *')) {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (rect.width <= 0 || style.display === 'none' || style.position === 'fixed') continue;
          if (rect.right > visibleWidth + 1 || rect.left < -1) {
            suspects.push({
              tag: element.tagName.toLowerCase(),
              id: element.id || '',
              right: Math.round(rect.right),
              left: Math.round(rect.left),
            });
          }
        }
        return {
          viewport: visibleWidth,
          documentScrollWidth: docWidth,
          bodyScrollWidth: bodyWidth,
          overflowingElements: suspects.slice(0, 12),
        };
      });
      console.log('PAE04_QA_VIEWPORT', JSON.stringify({ name, ...metrics }));
      expect(metrics.documentScrollWidth, 'Document must fit the iPhone width').toBeLessThanOrEqual(width + 1);
      expect(metrics.bodyScrollWidth, 'Body must fit the iPhone width').toBeLessThanOrEqual(width + 1);
      expect(metrics.overflowingElements, 'Off-screen elements: ' + JSON.stringify(metrics.overflowingElements)).toEqual([]);

      // Validation only: no Supabase request, no password and no account creation.
      await page.getByRole('button', { name: 'Войти' }).click();
      await expect(page.locator('#status')).toContainText('Укажите тестовую почту');
      await expect(page.locator('#formPanel')).toBeHidden();
    } finally {
      await context.close();
    }
  });
}


test('PAE-04 password recovery: request email without logging in', async ({ browser }) => {
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'ru-RU',
      storageState:{cookies:[],origins:[]}});
  try{
    const page=await context.newPage();
    let sent=false;
    await page.route('https://ulkocxmtnhxkhfgdlupw.supabase.co/auth/v1/recover?**',async route=>{
      const request=route.request();
      const u=new URL(request.url());
      const payload=request.postDataJSON();
      sent=request.method()==='POST'&&
        payload.email==='synthetic.qa@example.test'&&
        Object.keys(payload).join(',')==='email'&&
        u.searchParams.get('redirect_to')==='https://mastyukov-cyber.github.io/pae04-pressure-demo/';
      await route.fulfill({status:200,contentType:'application/json',body:'{}'});
    });
    await page.goto('http://127.0.0.1:4173/');
    await page.getByLabel('Тестовая почта').fill('synthetic.qa@example.test');
    await page.getByRole('button',{name:'Забыли пароль?'}).click();
    await expect(page.locator('#status')).toContainText('Если тестовый аккаунт существует');
    expect(sent).toBe(true);
    await expect(page.locator('#recoveryPanel')).toBeHidden();
  }finally{await context.close()}
});

test('PAE-04 password recovery: valid synthetic link changes password only on user action',async ({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},
    storageState:{cookies:[],origins:[]}});
  try{
    const page=await context.newPage();
    let validationCalls=0,updateCalls=0,validPayload=false;
    await page.route('https://ulkocxmtnhxkhfgdlupw.supabase.co/auth/v1/user',async route=>{
      const req=route.request();
      if(req.method()==='GET'){
        validationCalls++;
        expect(req.headers().authorization).toBe('Bearer fake-recovery-access-token');
        await route.fulfill({status:200,contentType:'application/json',
          body:JSON.stringify({id:'fake-synthetic-user',email:'synthetic.qa@example.test'})});
      }else if(req.method()==='PUT'){
        updateCalls++;
        validPayload=req.headers().authorization==='Bearer fake-recovery-access-token'&&
          req.postDataJSON().password==='Synthetic_only_password_1234!';
        await route.fulfill({status:200,contentType:'application/json',
          body:JSON.stringify({id:'fake-synthetic-user'})});
      }else await route.fulfill({status:405,body:'Not allowed'});
    });
    await page.goto('http://127.0.0.1:4173/#access_token=fake-recovery-access-token&refresh_token=fake-refresh&type=recovery');
    await expect(page.locator('#recoveryPanel')).toBeVisible();
    await expect(page.locator('#authPanel')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('');
    expect(validationCalls).toBe(1);
    expect(updateCalls).toBe(0);
    await page.locator('#new-password').fill('Synthetic_only_password_1234!');
    await page.locator('#confirm-password').fill('Different_password_4567!');
    await page.getByRole('button',{name:'Сохранить новый пароль'}).click();
    await expect(page.locator('#status')).toContainText('Пароли не совпадают');
    expect(updateCalls).toBe(0);
    await page.locator('#confirm-password').fill('Synthetic_only_password_1234!');
    await page.getByRole('button',{name:'Сохранить новый пароль'}).click();
    await expect(page.locator('#status')).toContainText('Новый пароль сохранён');
    await expect(page.locator('#recoveryPanel')).toBeHidden();
    await expect(page.locator('#authPanel')).toBeVisible();
    expect(updateCalls).toBe(1);
    expect(validPayload).toBe(true);
    const stored=await page.evaluate(()=>sessionStorage.getItem('pae04_qa_session_v1'));
    expect(stored).toBeNull();
  }finally{await context.close()}
});

test('PAE-04 password recovery: expired synthetic link cannot set a password',async ({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:700},
    storageState:{cookies:[],origins:[]}});
  try{
    const page=await context.newPage();
    await page.route('https://ulkocxmtnhxkhfgdlupw.supabase.co/auth/v1/user',async route=>
       route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({msg:'expired token'})}));
    await page.goto('http://127.0.0.1:4173/#access_token=fake-expired-token&type=recovery');
    await expect(page.locator('#status')).toContainText('недействительна или просрочена');
    await expect(page.locator('#recoveryPanel')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('');
  }finally{await context.close()}
});


for(const [name,width,height] of [
  ['iPhone-320-focus',320,700],
  ['iPhone-390-focus',390,844],
]){
  test('PAE-04 Safari editable-field focus zoom guard '+name,async({browser})=>{
    const ctx=await browser.newContext({
      viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:3,
      locale:'ru-RU',storageState:{cookies:[],origins:[]},
    });
    try{
      const page=await ctx.newPage();
      await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
      // The form is revealed only in synthetic browser DOM; no authentication request.
      await page.evaluate(()=>{document.querySelector('#formPanel').hidden=false});
      for(const selector of ['#email','#password','#pulse','#recorded']){
        await page.locator(selector).focus();
        const m=await page.locator(selector).evaluate(el=>{
          const rect=el.getBoundingClientRect();
          return {
            fontSize:parseFloat(getComputedStyle(el).fontSize),
            left:rect.left,right:rect.right,
            viewport:window.innerWidth,
            docWidth:document.documentElement.scrollWidth,
            visualScale:window.visualViewport?.scale??1,
          };
        });
        console.log('PAE04_QA_FOCUS',JSON.stringify({name,selector,...m}));
        expect(m.fontSize,'Editable controls should not trigger iOS input zoom').toBeGreaterThanOrEqual(16);
        expect(m.left,'Input should remain inside viewport').toBeGreaterThanOrEqual(-1);
        expect(m.right,'Input should remain inside viewport').toBeLessThanOrEqual(width+1);
        expect(m.docWidth,'Document should not overflow on focus').toBeLessThanOrEqual(width+1);
        expect(m.visualScale,'Emulated visual scale should stay at 1').toBeLessThanOrEqual(1.01);
      }
    }finally{await ctx.close()}
  });
}
