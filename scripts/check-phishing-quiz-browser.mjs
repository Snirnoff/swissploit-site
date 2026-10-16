// Runs against installed Chrome using the project's existing CDP helper.
// No browser package or runtime dependency is needed.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { openBrowser, delay } from './seo-browser.mjs';
import { scenarios, categories } from '../assets/phishing-quiz-data.js';

assert.ok(scenarios.length >= 9);
assert.equal(Object.keys(categories).length, 3);
assert.ok(scenarios.filter(s => s.kind === 'legitimate').length >= 3);
assert.equal(new Set(scenarios.map(s => s.id)).size, scenarios.length);
for (const s of scenarios) {
  assert.match(s.id, /^[a-z][a-z0-9-]*$/);
  if (s.learnArticleUrl) await fs.access(path.resolve('.' + s.learnArticleUrl, 'index.html'));
  assert.ok(s.choices.some(c => c.id === s.correctAnswer), `${s.id}: valid correct answer`);
  assert.equal(new Set(s.choices.map(c => c.id)).size, s.choices.length);
  assert.ok(s.redFlags.length >= 3 && s.protectionTips.length >= 1);
  assert.ok(!JSON.stringify(s).includes('.example'), `${s.id}: no placeholder domains`);
  assert.ok(s.categories.every(c => Object.hasOwn(categories, c)));
  const points = s.type === 'search' ? s.content.results : s.inspections;
  for (const point of points) assert.match(point.id, /^[a-z][a-z0-9-]*$/);
  assert.equal(new Set(points.map(p => p.id)).size, points.length);
  assert.ok(s.redFlags.every(flag => !flag.target || points.some(p => p.id === flag.target)));
  for (const point of points) {
    const url = point.url || point.value;
    if (!url.startsWith('https://')) continue;
    const hostname = new URL(url).hostname;
    assert.ok(hostname.endsWith('.swissploit.ch') || (s.id === 'vignette' && point.id === 'official' && hostname === 'via.admin.ch'));
  }
}

const b = await openBrowser(4188, 9348);
const output = path.resolve('.visual-check/phishing-quiz');
await fs.mkdir(output, { recursive: true });
const evaluate = b.evaluate;
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function waitFor(expression) {
  for (let i = 0; i < 60; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw Error(`Timed out: ${expression}`);
}
async function screenshot(name) {
  await delay(name.startsWith('intro') ? 850 : 360);
  const shot = await b.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64'));
}
async function noOverflow(label) {
  const overflows = await evaluate(`({width:innerWidth,document:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('#main *')].filter(el=>{const r=el.getBoundingClientRect();return r.width && (r.right>innerWidth+1||r.left< -1)}).slice(0,8).map(el=>el.className)})`);
  assert.ok(overflows.document <= overflows.width, `${label}: ${JSON.stringify(overflows)}`);
}
async function load(width, theme) {
  await b.call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width <= 430 });
  await b.call('Page.navigate', { url: b.origin + '/phishing-quiz/' });
  await waitFor('document.getElementById("quiz-start")?.disabled === false');
  await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}; localStorage.setItem('swissploit-theme',${JSON.stringify(theme)});scrollTo(0,0)`);
}

try {
  await b.call('Network.setBlockedURLs', { urls: ['*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  // Footer must end the document, including tall screens and both theme backgrounds.
  // The compact homepage has its own layout regression; this footer belongs to the quiz.
  for (const route of ['/phishing-quiz/']) for (const theme of ['dark', 'light']) for (const width of [1440, 390]) {
    await b.call('Emulation.setDeviceMetricsOverride', { width, height: 1200, deviceScaleFactor: 1, mobile: width < 500 });
    await b.call('Page.navigate', { url: b.origin + route });
    await waitFor('document.body.classList.contains("navigation-ready")');
    await evaluate(`document.documentElement.dataset.theme='${theme}';scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`);
    await delay(400);
    const footer = await evaluate('(()=>{const f=document.querySelector(".site-footer"),r=f.getBoundingClientRect();return {gap:document.documentElement.scrollHeight-r.bottom-scrollY,bottom:r.bottom,viewport:innerHeight,background:getComputedStyle(f).backgroundColor,body:getComputedStyle(document.body).backgroundColor}})()');
    assert.ok(Math.abs(footer.gap) < 2 && Math.abs(footer.bottom - footer.viewport) < 2, `${route}/${theme}/${width}: footer ends page`);
    assert.equal(footer.background, footer.body);
  }
  // Keyboard activation, native mobile menu and theme persistence.
  await load(390, 'light');
  await click('#themeToggle');
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
  await b.call('Page.reload');
  await waitFor('document.getElementById("quiz-start")?.disabled === false');
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark');
  await click('#menuToggle');
  assert.equal(await evaluate('document.getElementById("navigationDialog").open'), true);
  await b.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await delay(300);
  assert.equal(await evaluate('document.getElementById("navigationDialog").open'), false);
  await evaluate('document.getElementById("quiz-start").focus()');
  await b.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await b.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  assert.equal(await evaluate('document.activeElement.id'), 'quiz-title');
  await evaluate('document.querySelector("[data-inspect]").focus()');
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden") === "true"'), false);
  await b.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  const touch = await evaluate('(()=>{const el=document.querySelector("[data-inspect]");el.scrollIntoView({block:"center",behavior:"instant"});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await b.call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [touch] });
  await b.call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await waitFor('document.querySelector("[data-inspect]").getAttribute("aria-expanded") === "true"');
  await b.call('Emulation.setTouchEmulationEnabled', { enabled: false });

  // Touch must inspect before deciding; an explicit confirmation is also available.
  async function tap(selector) {
    const point = await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
    await b.call('Input.dispatchTouchEvent', {type:'touchStart',touchPoints:[point]});
    await b.call('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]});
  }
  await b.call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  for (const confirm of ['.pq-result-title', '.pq-open-result']) {
    await load(390, 'light');
    await click('#quiz-start');
    await tap('.pq-result-title');
    assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'active');
    await tap(confirm);
    if (confirm === '.pq-result-title') {
      assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'active');
      assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'true');
      await tap('.pq-result-title');
      await tap('.pq-open-result');
    }
    assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'answered');
  }
  await b.call('Emulation.setTouchEmulationEnabled', { enabled: false });

  for (const theme of ['dark', 'light']) for (const width of [1440, 768, 390, 320]) {
    await load(width, theme);
    await noOverflow(`${theme}/${width}/intro`);
    if (width === 1440 || width === 390) await screenshot(`intro-${theme}-${width}`);
    await click('#quiz-start');
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      const label = `${theme}/${width}/${s.id}`;
      // Let the question reveal and its pending scroll events finish before
      // synthetic hover. Scrolling intentionally dismisses an open inspector.
      await evaluate('Promise.all(document.querySelector(".pq-scenario-heading").getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))');
      assert.equal(await evaluate('document.activeElement.id'), 'quiz-title');
      assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'active');
      assert.equal(await evaluate('document.getElementById("quiz-title").textContent'), s.question);
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".pq-surface")).backgroundColor'), 'rgb(255, 255, 255)');
      assert.equal(await evaluate('document.querySelectorAll(".is-flagged, .is-confirmed, .pq-investigation").length'), 0);
      const progressTop = await evaluate('document.querySelector(".pq-progress-head").getBoundingClientRect().top');
      assert.ok(progressTop >= 80, `${label}: progress visible, actual top ${progressTop}`);
      await noOverflow(label);
      if (s.type !== 'search') assert.ok(await evaluate('document.querySelector(".pq-decision").getBoundingClientRect().bottom < document.querySelector(".pq-evidence").getBoundingClientRect().top'), label + ': answers before simulation');
      if (s.type === 'sms') assert.ok(await evaluate('(()=>{const r=document.querySelector(".pq-phone").getBoundingClientRect();return r.height/r.width>=1.8})()'), label + ': phone proportions');
      assert.ok(await evaluate('!document.querySelector("#main").textContent.includes(".example")'));
      assert.ok(await evaluate('!document.querySelector(".pq-surface").textContent.includes("⌄")'));
      assert.equal(await evaluate('document.querySelectorAll(".pq-inspect-icon, .pq-inline-preview").length'), 0);
      assert.equal(await evaluate('document.querySelectorAll(".pq-surface a, .pq-surface input, .pq-surface form, .pq-surface iframe").length'), 0, 'Evidence cannot navigate or collect credentials');
      const inspectId = s.type === 'search' ? s.content.results[0].id : s.inspections[0].id;
      // A pointer hover reveals a destination without choosing an answer.
      await evaluate(`document.querySelector('[data-inspect="${inspectId}"]').dispatchEvent(new PointerEvent('pointerover',{bubbles:true}))`);
      assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden") === "true"'), false, label + ': hover preview');
      await click(`[data-inspect="${inspectId}"]`);
      assert.equal(await evaluate(`document.querySelector('[data-inspect="${inspectId}"]').getAttribute('aria-expanded')`), 'true');
      assert.equal(await evaluate('document.querySelectorAll(".pq-floating.is-open").length'), 1, 'One adjacent preview on all sizes');
      if (s.type === 'login') assert.ok(await evaluate('document.querySelector(".pq-address").getBoundingClientRect().width > 180'), 'Address stays readable alongside mobile preview');
      assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'active');
      if ((width === 1440 && theme === 'dark') || (width === 390 && theme === 'light')) {
        await evaluate('document.getElementById("quiz-stage").scrollIntoView({behavior:"instant"})');
        await screenshot(`${s.id}-${theme}-${width}`);
      }
      for (const point of (s.type === 'search' ? s.content.results : s.inspections)) {
        if (!await evaluate(`!!document.querySelector('[data-inspect="${point.id}"]')`)) {
          assert.ok(await evaluate(`!!document.querySelector('[data-clue="${point.id}"]')`));
          continue;
        }
        await evaluate('document.getElementById("quiz-title").focus({preventScroll:true})');
        await b.call('Input.dispatchKeyEvent', {type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
        await click(`[data-inspect="${point.id}"]`);
        assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden") === "true"'), false);
        await noOverflow(label + '/preview/' + point.id);
        assert.ok(await evaluate('(()=>{const r=document.getElementById("quiz-inspector").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()'), label + ': floating viewport bounds');
        assert.equal(await evaluate('document.querySelectorAll(".pq-floating-value strong").length'), 0);
        await click(`[data-inspect="${point.id}"]`);
      }
      const choice = theme === 'dark' ? s.correctAnswer : s.choices.find(c => c.id !== s.correctAnswer).id;
      await evaluate(`document.querySelector('[data-answer="${choice}"]').scrollIntoView({block:'center',behavior:'instant'})`);

      await click(`[data-answer="${choice}"]`);
      assert.ok(await evaluate('document.activeElement.classList.contains("pq-local-feedback")'));
      await delay(1000);
      assert.ok(await evaluate('(()=>{const r=document.querySelector(".pq-local-feedback").getBoundingClientRect();return r.top>=80&&r.bottom<innerHeight})()'), label + ': verdict visible after reveal');
      assert.ok(await evaluate('document.getElementById("quiz-feedback").getBoundingClientRect().bottom <= document.querySelector(".pq-evidence").getBoundingClientRect().top + 1'), label + ': feedback above simulation');
      assert.ok(await evaluate('document.querySelector(".pq-next").getBoundingClientRect().top >= document.querySelector(".pq-evidence").getBoundingClientRect().bottom'), label + ': Next below simulation');
      assert.equal(await evaluate('document.querySelector(".pq-local-feedback").dataset.correct'), String(theme === 'dark'));
      assert.equal(await evaluate('document.querySelector(".pq-more").open'), false);
      assert.equal(await evaluate('document.querySelectorAll(".pq-resources a").length'), Number(Boolean(s.learnArticleUrl)) + Number(Boolean(s.videoUrl)));
      assert.ok(await evaluate('[...document.querySelectorAll(".pq-resources a")].every(a=>a.target==="_blank" && a.rel.includes("noopener") && a.rel.includes("noreferrer"))'));
      if ((width === 1440 && theme === 'dark') || (width === 390 && theme === 'light')) {
        await evaluate('document.querySelector(".pq-local-feedback").scrollIntoView({block:"start",behavior:"instant"})');
        await screenshot(`${s.id}-feedback-${theme}-${width}`);
      }
      assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'answered');
      assert.equal(await evaluate('document.querySelectorAll("[data-answer]:not(:disabled)").length'), 0);
      assert.equal(await evaluate('document.querySelector(".pq-progress").value'), i + 1);
      await click(`[data-answer="${choice}"]`); // Repeat activation must not change score.
      assert.equal(await evaluate('document.querySelector(".pq-progress").value'), i + 1);
      await noOverflow(label + '/feedback');
      await click('.pq-more summary');
      assert.equal(await evaluate('document.querySelector(".pq-more").open'), true);
      await noOverflow(label + '/more');
      await click('[data-action="next"]');
    }
    assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'result');
    assert.equal(await evaluate('document.activeElement.id'), 'quiz-result-title');
    assert.ok((await evaluate('document.querySelector(".pq-score").textContent')).includes(`${theme === 'dark' ? scenarios.length : 0} von ${scenarios.length}`));
    assert.equal(await evaluate('document.querySelectorAll(".pq-category-grid meter").length'), 3);
    assert.ok(await evaluate('document.getElementById("quiz-result-title").getBoundingClientRect().top >= 80 && document.getElementById("quiz-result-title").getBoundingClientRect().top < innerHeight'), 'Result is visible immediately');
    await noOverflow(`${theme}/${width}/result`);
    if (width === 1440 || width === 390) await screenshot(`result-${theme}-${width}`);
    assert.equal(await evaluate('performance.getEntriesByType("resource").filter(r=>new URL(r.name).hostname.endsWith(".swissploit.ch")).length'), 0);
    const stores = await evaluate('({local:Object.keys(localStorage),session:Object.keys(sessionStorage)})');
    assert.deepEqual(stores, { local: ['swissploit-theme'], session: [] });
    await click('[data-action="restart"]');
    assert.equal(await evaluate('document.querySelector(".pq-progress").value'), 0);
    assert.equal(await evaluate('document.querySelectorAll("[data-inspect][aria-expanded=true]").length'), 0);
    console.log(`PASS ${theme}, ${width}px: all nine scenarios, feedback, result, restart`);
  }

  // Real mouse movement, hover persistence, edge flipping, and no content re-render
  // during cursor following. A temporary control isolates all four viewport edges.
  await load(1440, 'dark');
  await click('#quiz-start');
  await evaluate(`document.querySelector('.pq-result-title').scrollIntoView({block:'center',behavior:'instant'})`);
  await delay(100); // Deliver the scroll event before opening a pointer preview.
  const mouse = (x, y) => b.call('Input.dispatchMouseEvent', {type:'mouseMoved',x,y});
  await mouse(5, 95);
  const box = await evaluate(`(()=>{const r=document.querySelector('.pq-result-title').getBoundingClientRect();return {x:r.x+20,y:r.y+r.height/2}})()`);
  await mouse(box.x, box.y);
  await delay(150);
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'false');
  await evaluate(`window.inspectorMutations=0;window.inspectorObserver=new MutationObserver(()=>window.inspectorMutations++);window.inspectorObserver.observe(document.querySelector('.pq-floating-surface'),{subtree:true,childList:true,characterData:true});`);
  const firstPosition = await evaluate('document.getElementById("quiz-inspector").getBoundingClientRect().left');
  await mouse(box.x + 65, box.y);
  await delay(220);
  assert.ok(await evaluate('document.getElementById("quiz-inspector").getBoundingClientRect().left') > firstPosition + 40);
  assert.equal(await evaluate('window.inspectorMutations'), 0, 'Cursor movement must not reconstruct tooltip content');
  await evaluate('window.inspectorObserver.disconnect()');
  await screenshot('floating-search-desktop');
  const tip = await evaluate('(()=>{const r=document.getElementById("quiz-inspector").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
  await mouse(tip.x, tip.y);
  await delay(250);
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'false', 'Surface remains hoverable');
  await mouse(5, 95);
  await delay(250);
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'true');
  for (const [x, y] of [[20,110],[1400,110],[20,960],[1400,960]]) {
    await evaluate(`(()=>{document.getElementById('edge-probe')?.remove();const button=document.createElement('button');button.id='edge-probe';button.dataset.inspect='official';button.textContent='Edge';button.style.cssText='position:fixed;z-index:105;left:${x}px;top:${y}px;width:24px;height:24px;padding:0';document.getElementById('quiz-stage').append(button)})()`);
    await mouse(x+10,y+10);
    await delay(180);
    const bounds = await evaluate('(()=>{const r=document.getElementById("quiz-inspector").getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}})()');
    assert.ok(bounds.left >= 12 && bounds.right <= 1428 && bounds.top >= 12 && bounds.bottom <= 988, JSON.stringify(bounds));
    assert.ok(!(x+10 >= bounds.left && x+10 <= bounds.right && y+10 >= bounds.top && y+10 <= bounds.bottom), 'Never cover the cursor');
    if (x > 700) assert.ok(bounds.right < x+10, 'Flip left at right edge');
    if (y > 700) assert.ok(bounds.bottom < y+10, 'Flip above at bottom edge');
    await mouse(5,95);
    await delay(200);
  }
  await evaluate('document.getElementById("edge-probe").remove()');
  // Touch source toggles closed; tapping outside and scrolling also dismiss.
  await load(390, 'light');
  await click('#quiz-start');
  await click('[data-answer="official"]');
  await click('[data-action="next"]');
  await b.call('Emulation.setTouchEmulationEnabled', {enabled:true,maxTouchPoints:1});
  await tap('[data-inspect="sender"]');
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'false');
  await screenshot('floating-sender-mobile');
  await tap('[data-inspect="sender"]');
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'true');
  await tap('[data-inspect="link"]');
  await screenshot('floating-link-mobile');
  await tap('#quiz-title');
  assert.equal(await evaluate('document.getElementById("quiz-inspector").getAttribute("aria-hidden")'), 'true');
  await b.call('Emulation.setTouchEmulationEnabled', {enabled:false});
  await click('.pq-mail-details summary');
  assert.ok(await evaluate('document.querySelector(".pq-mail-details").open'));
  assert.ok((await evaluate('document.querySelector(".pq-mail-details").textContent')).includes('Antwort an'));
  await click('.pq-mail-details summary');
  await click('.pq-forward summary');
  assert.ok(await evaluate('document.querySelector(".pq-forward").open'));
  assert.equal(await evaluate('document.querySelectorAll(".pq-surface input, .pq-surface form").length'), 0);

  // Mixed score and category calculation; reduced motion throughout the complete flow.
  await b.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await load(1440, 'dark');
  await click('#quiz-start');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".pq-scenario-heading")).animationName'), 'none');
  for (const [i, s] of scenarios.entries()) {
    const choice = i % 2 === 0 ? s.correctAnswer : s.choices.find(c => c.id !== s.correctAnswer).id;
    await click(`[data-answer="${choice}"]`);
    await click('[data-action="next"]');
  }
  assert.ok((await evaluate('document.querySelector(".pq-score").textContent')).includes(`${Math.ceil(scenarios.length / 2)} von ${scenarios.length}`));
  assert.deepEqual(await evaluate('[...document.querySelectorAll(".pq-category-grid meter")].map(m=>[m.value,m.max])'), Object.keys(categories).map(id => [scenarios.filter((s, i) => i % 2 === 0 && s.categories.includes(id)).length, scenarios.filter(s => s.categories.includes(id)).length]));
  // Optional video and title fields, tested only in memory: no invented public resource.
  await load(1440, 'dark');
  await evaluate(`import('/assets/phishing-quiz-data.js').then(({scenarios})=>{scenarios[0].videoUrl='https://www.youtube.com/watch?v=resource-test';scenarios[0].videoTitle='Test video';})`);
  await click('#quiz-start');
  await click('[data-answer="official"]');
  assert.equal(await evaluate('document.querySelectorAll(".pq-resources a").length'), 2);
  assert.ok((await evaluate('document.querySelector(".pq-resources").textContent')).includes('Test video'));
  assert.ok(await evaluate('[...document.querySelectorAll(".pq-resources a")].every(a=>a.target==="_blank" && a.rel==="noopener noreferrer")'));
  await load(1440, 'dark');
  await evaluate(`import('/assets/phishing-quiz-data.js').then(({scenarios})=>{delete scenarios[0].learnArticleUrl;scenarios[0].videoUrl='javascript:alert(1)';})`);
  await click('#quiz-start');
  await click('[data-answer="lookalike"]');
  assert.equal(await evaluate('document.querySelectorAll(".pq-resources a").length'), 0);
  assert.ok((await evaluate('document.querySelector(".pq-local-feedback").textContent')).includes('Das wäre die Falle gewesen'));
  // Complete a decision and advance using the keyboard alone.
  await load(1440, 'dark');
  await click('#quiz-start');
  await evaluate('document.querySelector(".pq-result-title").focus()');
  await b.call('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await b.call('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.getElementById("quiz-stage").dataset.phase'), 'answered');
  for (let i = 0; i < 30; i++) {
    if (await evaluate('document.activeElement.dataset.action === "next"')) break;
    await b.call('Input.dispatchKeyEvent', {type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await b.call('Input.dispatchKeyEvent', {type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  }
  assert.equal(await evaluate('document.activeElement.dataset.action'), 'next');
  await b.call('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await b.call('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.getElementById("quiz-title").textContent'), scenarios[1].question);
  // Public Learn entry remains usable alongside the existing article search.
  for (const width of [1440, 390]) {
    await b.call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await b.call('Page.navigate', { url: b.origin + '/learn/' });
    await waitFor('document.body.classList.contains("navigation-ready") && !!document.querySelector(".learn-quiz-link")');
    await noOverflow(`Learn/${width}`);
    assert.equal(await evaluate('document.querySelector(".learn-quiz-link").getAttribute("href")'), '/phishing-quiz/');
    await evaluate('document.getElementById("blogSearch").value="phishing"; document.getElementById("blogSearch").dispatchEvent(new Event("input",{bubbles:true}))');
    assert.ok(await evaluate('[...document.querySelectorAll("#blogGrid .blog-card")].some(card=>!card.hidden)'));
    await click('.learn-quiz-link');
    await waitFor('document.getElementById("quiz-start")?.disabled === false');
    assert.equal(await evaluate('location.pathname'), '/phishing-quiz/');
  }
  // Block the module to exercise graceful fallback; the static page still offers learning.
  await b.call('Network.setBlockedURLs', { urls: ['*phishing-quiz.js', '*fonts.googleapis.com*', '*fonts.gstatic.com*'] });
  await b.call('Page.navigate', { url: b.origin + '/phishing-quiz/' });
  await waitFor('document.getElementById("quiz-load-note") !== null');
  assert.equal(await evaluate('document.getElementById("quiz-start").disabled'), true);
  assert.equal(await evaluate('document.getElementById("quiz-load-note").hidden'), false);
  // No JavaScript: same semantic entry and useful internal content links.
  await b.call('Emulation.setScriptExecutionDisabled', { value: true });
  await b.call('Page.reload');
  await delay(400);
  const html = await b.call('DOM.getDocument', { depth: -1 });
  assert.ok(JSON.stringify(html).includes('JavaScript ist deaktiviert'));
  await b.call('Emulation.setScriptExecutionDisabled', { value: false });
  assert.deepEqual(b.errors, [], 'No uncaught runtime errors');
  assert.deepEqual(b.badResponses, [], 'No missing local resources');
  console.log(`PASS keyboard, hover/tap, theme persistence, menu, mixed score, reduced motion, Learn entry, module failure and no-JS fallback\nScreenshots: ${output}`);
} finally {
  b.close();
}
