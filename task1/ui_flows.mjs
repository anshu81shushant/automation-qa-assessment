// main flows in the browser + axe scan + a few edge cases. writes ui_log.txt and screenshots/
// needs: npm install (playwright + axe-core), uses the installed Edge
import { chromium } from 'playwright';
import fs from 'fs';
const axe = fs.readFileSync('node_modules/axe-core/axe.min.js','utf8');
const B='https://demo.realworld.show';
const browser = await chromium.launch({ channel:'msedge', headless:true });
const ctx = await browser.newContext({ viewport:{width:1280,height:800} });
const page = await ctx.newPage();
const log=[]; page.on('console', m=>{ if(m.type()==='error') log.push('console: '+m.text().slice(0,200)); });
page.on('dialog', async d=>{ log.push('DIALOG FIRED: '+d.message()); await d.dismiss(); });
page.on('pageerror', e=>log.push('pageerror: '+e.message.slice(0,200)));
let t=Date.now(); await page.goto(B,{waitUntil:'networkidle'}); log.push('home load ms '+(Date.now()-t));
await page.screenshot({path:'screenshots/01_home.png'});
// a11y
await page.addScriptTag({content:axe});
const res = await page.evaluate(async()=>{const r=await axe.run(); return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help}))});
log.push('AXE home: '+JSON.stringify(res));
// signup empty
await page.goto(B+'/register',{waitUntil:'networkidle'});
const btn = page.locator('button[type=submit], button:has-text("Sign up")').first();
log.push('signup button disabled when empty: '+await btn.isDisabled());
await page.screenshot({path:'screenshots/02_register_empty.png'});
const u='qa'+Math.floor(Math.random()*90000+10000);
await page.fill('input[placeholder="Username"]',u);
await page.fill('input[placeholder="Email"]','not-an-email');
await page.fill('input[placeholder="Password"]','1');
log.push('signup btn disabled w/ bad email & 1-char pw: '+await btn.isDisabled());
await btn.click(); await page.waitForTimeout(2500);
log.push('after bad-email signup url: '+page.url());
await page.screenshot({path:'screenshots/03_register_bad_email_accepted.png'});
const ls = await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
log.push('localStorage: '+ls.slice(0,300));
const ck = await ctx.cookies(); log.push('cookies: '+JSON.stringify(ck.map(c=>({n:c.name,httpOnly:c.httpOnly}))));
// create XSS article
await page.goto(B+'/editor',{waitUntil:'networkidle'});
await page.fill('input[placeholder="Article Title"]','XSS check '+u);
await page.fill('input[placeholder*="this article about"]','desc');
await page.fill('textarea','Hello\n\n<img src=x onerror="alert(\'xss-img\')">\n\n[click me](javascript:alert(\'xss-link\'))\n\n<a href="javascript:alert(1)">raw link</a>');
await page.click('button:has-text("Publish")'); await page.waitForTimeout(3000);
log.push('after publish url: '+page.url());
const html = await page.locator('.article-content, [class*=article]').first().innerHTML().catch(e=>'ERR '+e.message);
log.push('rendered body html: '+html.slice(0,600));
const hrefs = await page.$$eval('a', as=>as.map(a=>a.getAttribute('href')).filter(h=>h&&h.startsWith('javascript')));
log.push('javascript: hrefs in DOM: '+JSON.stringify(hrefs));
await page.screenshot({path:'screenshots/04_article_xss.png', fullPage:true});
// whitespace article
await page.goto(B+'/editor',{waitUntil:'networkidle'});
await page.fill('input[placeholder="Article Title"]','   ');
await page.fill('input[placeholder*="this article about"]','   ');
await page.fill('textarea','   ');
const pub=page.locator('button:has-text("Publish")');
log.push('publish disabled for whitespace: '+await pub.isDisabled());
await pub.click(); await page.waitForTimeout(3000);
log.push('after whitespace publish url: '+page.url());
await page.screenshot({path:'screenshots/05_whitespace_publish.png', fullPage:true});
await page.goto(B+'/profile/'+u,{waitUntil:'networkidle'}); await page.waitForTimeout(1500);
await page.screenshot({path:'screenshots/06_profile_ghost_article.png', fullPage:true});
const ghost = page.locator('a.preview-link, .article-preview a').filter({hasText:''}).first();
const links = await page.$$eval('.article-preview a.preview-link', as=>as.map(a=>a.getAttribute('href')));
log.push('profile preview links: '+JSON.stringify(links));
// second session in another context
const ctx2 = await browser.newContext(); const p2 = await ctx2.newPage();
await p2.goto(B+'/login',{waitUntil:'networkidle'});
await p2.fill('input[placeholder="Email"]','not-an-email'); await p2.fill('input[placeholder="Password"]','1');
await p2.click('button:has-text("Sign in")'); await p2.waitForTimeout(2500);
log.push('device2 login url: '+p2.url());
// back in device1 try to publish
await page.goto(B+'/editor',{waitUntil:'networkidle'});
await page.fill('input[placeholder="Article Title"]','Draft written on device 1');
await page.fill('input[placeholder*="this article about"]','d');
await page.fill('textarea','A long draft that took 20 minutes to write...');
await page.click('button:has-text("Publish")'); await page.waitForTimeout(3000);
log.push('device1 publish after device2 login url: '+page.url());
const errs = await page.locator('.error-messages').allInnerTexts().catch(()=>[]);
log.push('device1 error msgs: '+JSON.stringify(errs));
await page.screenshot({path:'screenshots/07_device1_session_killed.png', fullPage:true});
fs.writeFileSync('ui_log.txt', log.join('\n'));
console.log(log.join('\n')); console.log('USER', u);
await browser.close();
