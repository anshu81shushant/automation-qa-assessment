// bug #4 - same account in two browsers, does browser 1 survive?
// logs every api call with the token it used so you can see the 401
import { chromium } from 'playwright';
const B = 'https://demo.realworld.show';
const browser = await chromium.launch({ channel: 'msedge', headless: true });

const mk = async (name) => {
  const c = await browser.newContext(); const p = await c.newPage();
  p.on('response', r => {
    if (!r.url().includes('api.realworld.show')) return;
    const a = r.request().headers()['authorization'];
    console.log(name, r.request().method(), r.url().replace('https://api.realworld.show/api', ''), r.status(), a ? a.slice(0, 22) : '-');
  });
  return p;
};
const p1 = await mk('D1'), p2 = await mk('D2');
const u = 'qa' + Math.floor(Math.random() * 90000 + 10000), em = u + '@example.com';

// browser 1 signs up
await p1.goto(B + '/register', { waitUntil: 'networkidle' });
await p1.fill('input[placeholder="Username"]', u); await p1.fill('input[placeholder="Email"]', em); await p1.fill('input[placeholder="Password"]', 'pass1234');
await p1.click('button:has-text("Sign up")'); await p1.waitForTimeout(3000);

// browser 2 logs into the same account
console.log('--- D2 logs in');
await p2.goto(B + '/login', { waitUntil: 'networkidle' });
await p2.fill('input[placeholder="Email"]', em); await p2.fill('input[placeholder="Password"]', 'pass1234');
await p2.click('button:has-text("Sign in")'); await p2.waitForTimeout(3000);

// back on browser 1, try to write something
console.log('--- D1 opens editor');
await p1.goto(B + '/editor', { waitUntil: 'networkidle' }); await p1.waitForTimeout(2500);
console.log('D1 url:', p1.url());
console.log('D1 navbar:', (await p1.locator('nav').innerText()).replace(/\s+/g, ' '));
await p1.screenshot({ path: 'screenshots/07_device1_kicked_out.png', fullPage: true });
await browser.close();
