/* _test/dnd-pointer.js — real Chrome: the word banks q1 / q7 / q7b on the pointer drag (18.11.26,
   MOE Monday 13504392333). On the old native-drag code (deployments/2026-11-13) 8 checks fail:
   the returned q1 chip stays invisible (opacity 0) and touch places nothing in all three.
   NODE_PATH=C:/Users/Vadim/AppData/Local/Temp/lomda-test/node_modules node _test/dnd-pointer.js [componentDir] [shotDir]
   For q1 / q7 / q7b, at a short window (1366x640) and at 1920x1080:
     mouse drag chip -> blank N   : only that blank filled, nothing else placed, no text selected
     tap on a chip                : the first empty blank gets it (one placement only)
     click a filled blank         : the chip is back and VISIBLE within 300 ms (opacity 1, displayed)
     touch drag chip -> blank N   : placed (pointerType touch)
   Exit code 1 on any failure. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const OUT = process.argv[3] || require('os').tmpdir();
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const server = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0; const fail = [];
const ok = (n, c, d) => { if (c) pass++; else fail.push(n + (d ? ' -> ' + d : '')); };

const Q = [
  { q: 'q1', idx: 3, st: 'q1State', words: ['5', 'الأزرق', 'البارد والغامق'], drops: 3 },
  { q: 'q7', idx: 14, st: 'q7State', words: ['5', '6'], drops: 2 },
  { q: 'q7b', idx: 15, st: 'q7bState', words: ['18', '12'], drops: 2 },
];

server.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}/index.html`;
  const puppeteer = require('puppeteer-core');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  try {
    for (const [w, h] of [[1366, 640], [1920, 1080]]) {
      const page = await browser.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message));
      await page.setViewport({ width: w, height: h, hasTouch: true });
      await page.goto(base, { waitUntil: 'domcontentloaded' }); await sleep(2500);
      for (const c of Q) {
        const tag = `${c.q} @${w}x${h}`;
        await page.evaluate((i) => goTo(i), c.idx);
        await sleep(10000);   /* the chips' own entry animation (up to 9.4 s) */
        const rect = (sel) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }, sel);
        const state = () => page.evaluate((s) => JSON.stringify((0, eval)(s).drops), c.st);
        const placedCount = () => page.evaluate((q) => document.querySelectorAll(`#screen-${q} .${q}-chip.${q}-chip-placed`).length, c.q);
        const chipSel = (wd) => `#screen-${c.q} .${c.q}-chip[data-word="${wd}"]`;
        const dropSel = (n) => `#${c.q}-drop-${n}`;
        const reset = () => page.evaluate((q) => { for (let n = 1; n <= 3; n++) { const d = document.getElementById(q + '-drop-' + n); if (d && d.dataset.word) d.click(); } }, c.q);

        /* 1. mouse drag word[1] -> last blank */
        const lastDrop = c.drops, w1 = c.words[1];
        let a = await rect(chipSel(w1)), b = await rect(dropSel(lastDrop));
        await page.mouse.move(a.x, a.y); await page.mouse.down();
        for (let k = 1; k <= 12; k++) { await page.mouse.move(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12); await sleep(15); }
        await page.mouse.up(); await sleep(200);
        let d = JSON.parse(await state());
        ok(`${tag} mouse drag -> blank ${lastDrop}`, d[lastDrop] === w1, JSON.stringify(d));
        ok(`${tag} mouse drag placed one chip`, (await placedCount()) === 1, String(await placedCount()));
        ok(`${tag} no text selected`, (await page.evaluate(() => String(getSelection()))) === '');
        ok(`${tag} no ghost left`, (await page.evaluate(() => document.querySelectorAll('.pointer-drag-ghost').length)) === 0);

        /* 2. tap word[0] -> first empty blank (1) */
        a = await rect(chipSel(c.words[0]));
        await page.mouse.click(a.x, a.y); await sleep(200);
        d = JSON.parse(await state());
        ok(`${tag} tap -> first empty blank`, d[1] === c.words[0], JSON.stringify(d));
        ok(`${tag} tap placed one chip`, (await placedCount()) === 2, String(await placedCount()));

        /* 3. click blank 1 -> chip back, visible at once */
        b = await rect(dropSel(1));
        await page.mouse.click(b.x, b.y); await sleep(300);
        const vis = await page.evaluate((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return { disp: cs.display, op: cs.opacity, w: r.width }; }, chipSel(c.words[0]));
        ok(`${tag} returned chip visible within 300 ms`, vis.disp !== 'none' && Number(vis.op) > 0.95 && vis.w > 0, JSON.stringify(vis));

        /* 4. touch drag word[0] -> blank 1 */
        await reset(); await sleep(200);
        a = await rect(chipSel(c.words[0])); b = await rect(dropSel(1));
        await page.touchscreen.touchStart(a.x, a.y);
        for (let k = 1; k <= 12; k++) { await page.touchscreen.touchMove(a.x + (b.x - a.x) * k / 12, a.y + (b.y - a.y) * k / 12); await sleep(15); }
        await page.touchscreen.touchEnd(); await sleep(250);
        d = JSON.parse(await state());
        ok(`${tag} touch drag -> blank 1`, d[1] === c.words[0], JSON.stringify(d));
        if (w === 1366) await page.screenshot({ path: path.join(OUT, `${c.q}-after-touch.png`) });
        await reset(); await sleep(200);
      }
      ok(`@${w}x${h} no page error`, !errs.length, errs.slice(0, 2).join(' | '));
      await page.close();
    }
  } finally { await browser.close(); server.close(); }
  console.log(`[dnd-probe] pass ${pass} fail ${fail.length}`);
  fail.forEach((f) => console.log('  FAIL ' + f));
  process.exitCode = fail.length ? 1 : 0;
});
