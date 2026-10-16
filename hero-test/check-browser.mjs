// Run from repository root: node hero-test/check-browser.mjs
// Existing native Chrome/CDP harness; no additional dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { openBrowser, delay } from '../scripts/seo-browser.mjs';

const browser = await openBrowser(4193, 9353);
const { call, evaluate, origin } = browser;
const output = '.visual-check/hero-test';
const core = 'document.querySelector("swissploit-security-core")';
const click = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()');
const focus = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').focus()');
const key = async (key, code = key, modifiers = 0) => {
  const windowsVirtualKeyCode = {Enter:13,Tab:9,Escape:27,ArrowRight:39,ArrowLeft:37,Home:36,End:35}[key];
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers, windowsVirtualKeyCode, ...(key === 'Enter' ? {text:'\r'} : {}) });
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers });
  await delay(60); // Native dialog close/focus events run after the key event.
};
async function ready() {
  for (let i = 0; i < 80; i++) {
    if (await evaluate('document.body?.dataset.contentReady === "true"')) break;
    await delay(100);
  }
  assert.equal(await evaluate('document.body.dataset.contentReady'), 'true', 'Content requests settled');
  await evaluate('document.fonts.ready');
  await evaluate(core + '.ready');
  await delay(1400);
  await evaluate('(()=>{const b=document.querySelector("#rotation-toggle");if(!b.disabled&&b.getAttribute("aria-pressed")==="false")b.click()})()');
}
const shot = async name => {
  const modal = await evaluate('!!document.querySelector("dialog[open]")');
  if (modal) await delay(300);
  const { data } = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !modal });
  await fs.writeFile(output + '/' + name + '.png', Buffer.from(data, 'base64'));
};
const bounds = () => evaluate(`[...document.querySelectorAll('main a,main button,.core-test-title-line')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1}).map(e=>e.textContent)`);
try {
  await fs.mkdir(output, { recursive: true });
  for (const [width, height] of [[320,740],[390,844],[768,1024],[900,700],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await call('Page.navigate', { url: origin + '/' });
    await ready();
    // Long category labels must not change module height, including during rapid clicks.
    const carouselSizes = await evaluate(`(() => {
      const sizes=[];
      for(let i=0;i<10;i++) {
        sizes.push([document.querySelector('.hub-updates').getBoundingClientRect().height,document.querySelector('.hub-offers').getBoundingClientRect().y]);
        document.querySelector('[data-short-step="1"]').click();
        document.querySelector('[data-article-step="1"]').click();
      }
      return sizes;
    })()`);
    assert.ok(carouselSizes.every(size => size.every((value, i) => Math.abs(value - carouselSizes[0][i]) < 1)), width + ': stable carousel layout');
    assert.equal(await evaluate('document.querySelector("#short-count").textContent'), '1 / 10');
    assert.equal(await evaluate('document.querySelector("#article-count").textContent'), '1 / 10');
    for (const theme of ['dark','light']) {
      await evaluate('document.documentElement.dataset.theme=' + JSON.stringify(theme));
      await delay(100);
      assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, width + ' overflow');
      assert.deepEqual(await bounds(), [], width + ' control bounds');
      assert.equal(await evaluate(core + '.dataset.theme'), theme);
      assert.ok(await evaluate(core + '.nodes.length') >= 400, 'Original particle mask');
      if (width >= 1440) {
        assert.equal(await evaluate('document.documentElement.scrollHeight > innerHeight'), false, width + ': one screen');
        assert.equal(await evaluate('document.querySelector(".hub-services").getBoundingClientRect().bottom <= innerHeight'), true);
        const overlap = await evaluate(`(() => {
          const c=${core},r=c.canvas.getBoundingClientRect();
          const ys=c.nodes.map(n=>r.top+c.height/2+n.y*c.scale);
          return {top:Math.min(...ys),bottom:Math.max(...ys),header:document.querySelector('.site-header').getBoundingClientRect().bottom,cards:document.querySelector('.core-test-footer').getBoundingClientRect().top};
        })()`);
        assert.ok(overlap.top < overlap.header, width + ': upper tip reaches navigation');
        assert.ok(overlap.bottom > overlap.cards + 5, width + ': lower tip overlaps learning cards');
        assert.equal(await evaluate(`(() => {
          const c=${core}.canvas,ctx=c.getContext('2d');
          return [ctx.getImageData(0,0,c.width,2),ctx.getImageData(0,c.height-2,c.width,2)].every(image=>image.data.every((n,i)=>i%4!==3||n===0));
        })()`),true,'No particles clipped at canvas edges');
      }
      if ([320,390,768,1440,1920].includes(width)) await shot(width + '-' + height + '-' + theme);
    }
  }
  console.log('Layout: 320–1920px, both themes; one screen at 1440×900 and 1920×1080.');

  await call('Emulation.setDeviceMetricsOverride', { width:1440,height:900,deviceScaleFactor:1,mobile:false });
  await evaluate('document.documentElement.dataset.theme="dark"');
  await click('#themeToggle');
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'light');
  await click('#themeToggle');
  assert.equal(await evaluate('localStorage.getItem("swissploit-theme")'), 'dark');
  assert.equal(await evaluate('document.querySelectorAll("iframe").length'), 0, 'No video loaded before interaction');
  assert.equal(await evaluate('document.querySelector("#short-source").textContent'), '', 'Redundant Shorts caption removed');
  const shorts = JSON.parse(await fs.readFile('data/youtube-shorts.json','utf8')).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,10);
  for (let i=0;i<10;i++) {
    assert.equal(await evaluate('document.querySelector(".hub-short-copy h3").textContent'), shorts[i].title);
    await click('[data-short-step="1"]');
    await delay(300);
    assert.equal(await evaluate('document.documentElement.scrollHeight > innerHeight'),false,'Every short fits one screen');
  }
  const articleLinks = new Set();
  for (let i=0;i<10;i++) {
    articleLinks.add(await evaluate('document.querySelector(".hub-article-link").getAttribute("href")'));
    await click('[data-article-step="1"]');
    await delay(300);
    assert.equal(await evaluate('document.documentElement.scrollHeight > innerHeight'),false,'Every article fits one screen');
  }
  assert.equal(articleLinks.size,10);
  await focus('[data-short-step="-1"]');
  await key('Enter');
  assert.equal(await evaluate('document.querySelector("#short-count").textContent'),'10 / 10');
  await click('[data-short-step="1"]');
  await click('.hub-short-poster');
  await delay(300);
  assert.equal(await evaluate('document.querySelector("#short-dialog").open'),true);
  assert.match(await evaluate('document.querySelector("#short-player iframe").src'), /youtube-nocookie.*mute=1/);
  assert.equal(await evaluate(core + '.frame'),0,'Dialog pauses particles');
  await key('Escape');
  await delay(100);
  assert.equal(await evaluate('document.querySelectorAll("iframe").length'),0,'Closing destroys player');
  assert.equal(await evaluate('document.activeElement.classList.contains("hub-short-poster")'),true);

  assert.equal(await evaluate('document.querySelector(".hub-business > a").getAttribute("href")'),'/unternehmen/#learn-for-business');

  assert.equal(await evaluate('document.querySelector("#challenge-dialog")'),null,'Mini-challenge removed');
  console.log('Carousels: ten real entries each; player lifecycle, dialog focus and Business destination.');

  const hoverElement = async target => {
    const selector = JSON.stringify(target);
    const point = await evaluate('(() => {const r=document.querySelector('+selector+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()');
    await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
    await delay(125);
  };
  const hover = mode => hoverElement('.core-test-resource[data-core="'+mode+'"]');
  const home = () => call('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:90});
  const settled = () => evaluate(core+'.nodes.every((n,i)=>Math.hypot(n.x-'+core+'.targets['+core+'.mode][i].x,n.y-'+core+'.targets['+core+'.mode][i].y)<.01)');
  await focus('#themeToggle');
  await evaluate('window.particleIdentities='+core+'.nodes.slice()');
  const allPixels = new Set();
  for (const mode of ['shorts','learn','quiz','game']) {
    await hover(mode);
    assert.equal(await evaluate(core+'.mode'),mode,'Current hovered card selects shape');
    await delay(1000);
    assert.equal(await settled(),true,'All particles arrive at '+mode);
    allPixels.add(await evaluate(core+'.canvas.toDataURL()'));
    await shot('morph-'+mode);
    assert.equal(await evaluate(core+'.nodes.every((n,i)=>n===window.particleIdentities[i])'),true,'Particles retain their identities');
    await home();
    assert.equal(await evaluate(core+'.mode'),'neutral','Leaving starts return immediately');
    await delay(900);
    assert.equal(await settled(),true,'Returns to original S coordinates');
  }
  assert.equal(allPixels.size,4,'Distinct particle shapes');
  const additionalShapes = [
    ['.hub-service-links [data-core="security-check"]','security-check'],
    ['.hub-service-links [data-core="datenschutz-care"]','datenschutz-care'],
    ['.hub-service-links [data-core="incident-readiness"]','incident-readiness'],
    ['#primaryNav [data-core="business"]','business'],
    ['#primaryNav [data-core="quiz-games"]','quiz-games']
  ];
  for (const [selector, mode] of additionalShapes) {
    await hoverElement(selector); await delay(1000);
    assert.equal(await evaluate(core+'.mode'),mode);
    assert.equal(await settled(),true,'New shape settles: '+mode);
    assert.equal(await evaluate(core+'.nodes.every((n,i)=>n===window.particleIdentities[i])'),true);
    await shot('morph-'+mode);
  }
  for (const mode of ['learn','shorts','quiz-games','business','neutral']) {
    await hoverElement('#primaryNav [data-core="'+mode+'"]');
    assert.equal(await evaluate(core+'.mode'),mode,'Navigation hover: '+mode);
  }
  await hoverElement('.hub-business');
  assert.equal(await evaluate(core+'.mode'),'business','Business panel selects buildings');
  for (const [selector, mode] of [...additionalShapes].reverse()) {
    await hoverElement(selector); await delay(40);
    assert.equal(await evaluate(core+'.mode'),mode,'Mixed rapid hover: '+mode);
  }
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:-10,y:-10});
  assert.equal(await evaluate(core+'.mode'),'neutral','Leaving the viewport clears the active target');
  await home(); await delay(900);
  const pointerPoint = await evaluate(`(() => {
    const c=${core},r=c.canvas.getBoundingClientRect(),n=c.nodes[Math.floor(c.nodes.length*.55)];
    return {x:r.left+c.width/2+n.x*c.scale,y:r.top+c.height/2+n.y*c.scale};
  })()`);
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...pointerPoint}); await delay(450);
  assert.equal(await evaluate(core+'.pointer.active'),true,'Direct logo hover is restored');
  const displacement = await evaluate(core+'.nodes.map(n=>Math.hypot(n.offsetX,n.offsetY))');
  assert.ok(displacement.some(d=>d>2),'Nearby particles react');
  assert.ok(displacement.every(d=>d<=15.01),'Displacement remains bounded');
  assert.ok(displacement.filter(d=>d>1).length < displacement.length / 2,'Reaction is local');
  await shot('logo-pointer');
  await home(); await delay(900);
  assert.equal(await evaluate(core+'.nodes.every(n=>Math.hypot(n.offsetX,n.offsetY)<.1)'),true,'Local offsets return softly');
  assert.equal(await settled(),true,'Logo shape remains intact');
  for(const mode of ['shorts','learn','game','quiz','shorts','game']) {
    await hover(mode); await delay(45);
    assert.equal(await evaluate(core+'.mode'),mode,'Rapid pointer switch selects only current card');
  }
  await home(); await delay(900);
  assert.equal(await settled(),true,'Interrupted morph returns home');
  await focus('#themeToggle'); await key('Tab');
  for(const mode of ['shorts','learn','quiz','game']) {
    await focus('.core-test-resource[data-core="'+mode+'"]');
    assert.equal(await evaluate(core+'.mode'),mode,'Keyboard focus selects '+mode);
  }
  for(const [selector, mode] of additionalShapes) {
    await focus(selector);
    assert.equal(await evaluate(core+'.mode'),mode,'Keyboard focus: '+mode);
  }
  for(const mode of ['learn','shorts','quiz-games','business','neutral']) {
    await focus('#primaryNav [data-core="'+mode+'"]');
    assert.equal(await evaluate(core+'.mode'),mode,'Navigation keyboard focus: '+mode);
  }
  await focus('#themeToggle'); await delay(50);
  assert.equal(await evaluate(core+'.mode'),'neutral','Leaving keyboard focus returns home');
  await hover('shorts');
  await evaluate('window.dispatchEvent(new Event("blur"))');
  assert.equal(await evaluate(core+'.mode'),'neutral','Window blur clears hover');
  await home();
  assert.equal(await evaluate('[...document.querySelectorAll(".site-header a,.site-header button,main a,main button")].filter(e=>e.getClientRects().length&&!e.disabled).every(e=>{const r=e.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)return true;const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);})'),true,'Controls are unobstructed');
  assert.equal(await evaluate('[...document.querySelectorAll("a")].some(a=>/[↗→←]/.test(a.textContent))'),false,'Decorative CTA arrows removed');
  assert.equal(await evaluate('document.querySelectorAll(".hub-carousel-controls button").length'),4);
  assert.equal(await evaluate('document.querySelector(".hub-business").textContent.includes("In Planung")'),false);
  assert.equal(await evaluate('document.querySelector(".hub-business > a").textContent.trim()'),'Learn for Business entdecken');
  for(const selector of ['.core-test-primary','.hub-business > a','.hub-service-links a','.hub-carousel-controls button']) {
    assert.match(await evaluate('getComputedStyle(document.querySelector('+JSON.stringify(selector)+')).backgroundImage'),/linear-gradient/,'Gradient: '+selector);
  }
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".core-test-resource .resource-motion")).animationIterationCount'),'infinite');
  const iconFrame = await evaluate('getComputedStyle(document.querySelector(".core-test-resource .resource-motion")).transform');
  await delay(400);
  assert.notEqual(await evaluate('getComputedStyle(document.querySelector(".core-test-resource .resource-motion")).transform'),iconFrame,'Icons move at rest');

  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await delay(120);
  const pixels = await evaluate(core + '.canvas.toDataURL()');
  await delay(200);
  assert.equal(await evaluate(core + '.canvas.toDataURL()'),pixels);
  assert.equal(await evaluate(core + '.frame'),0);
  await focus('.core-test-resource[data-core="learn"]');
  await delay(100);
  assert.equal(await settled(),true,'Reduced motion changes shape directly');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".resource-motion")).animationName'),'none');
  await shot('reduced-motion-book');
  await focus('#themeToggle');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  console.log('Morphing: nine target shapes, direct logo hover, stable identities, navigation/services, rapid switches, focus, return and reduced motion.');

  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await call('Emulation.setTouchEmulationEnabled',{enabled:true});
  await call('Page.navigate',{url:origin+'/'});
  await ready();
  assert.equal(await evaluate(core + '.frame'),0,'Touch devices render a still signet');
  await click('#menuToggle');
  assert.equal(await evaluate('document.querySelector("#navigationDialog").open'),true);
  await key('Escape');
  await delay(450); // Let the navigation close transition restore document scrolling.
  await evaluate('document.querySelector("#short-content").scrollIntoView({block:"center",behavior:"instant"})');
  await delay(150);
  const rect = await evaluate('(() => {const r=document.querySelector("#short-content").getBoundingClientRect();return {x:r.x+r.width*.8,y:r.y+60}})()');
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[rect]});
  for (let i=1;i<=5;i++) {
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rect.x-i*18,y:rect.y}]});
    await delay(20);
  }
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await delay(100);
  assert.equal(await evaluate('document.querySelector("#short-count").textContent'),'2 / 10','Real touch swipe advances');
  assert.equal(await evaluate('document.querySelector("#short-dialog").open'),false,'Swipe never plays a video');
  console.log('Motion and mobile: static reduced motion and touch, navigation, dialog and swipe.');

  // Local destinations and anchors are checked from the rendered page.
  const links = await evaluate('[...document.querySelectorAll("a[href]")].map(a=>a.href).filter(h=>h.startsWith(location.origin))');
  for (const href of new Set([...links, ...[...articleLinks].map(p=>origin+p)])) {
    const url = new URL(href);
    const response = await fetch(url);
    assert.equal(response.status,200,href);
    if (url.hash) assert.ok((await response.text()).includes('id="' + url.hash.slice(1) + '"'),href + ' anchor');
  }
  assert.deepEqual(browser.errors, [], 'No runtime exceptions');
  assert.deepEqual(browser.badResponses, [], 'No missing local assets');

  // Network failures preserve useful static destinations and disabled controls.
  const injection = await call('Page.addScriptToEvaluateOnNewDocument',{source:`const nativeFetch=window.fetch;window.fetch=(input,...args)=>['/assets/blog-posts.js','/data/youtube-shorts.json'].includes(input)?Promise.reject(new Error('offline test')):nativeFetch(input,...args);`});
  await call('Page.navigate',{url:origin+'/'});
  await ready();
  assert.equal(await evaluate('document.querySelectorAll(".hub-empty a").length'),2);
  assert.equal(await evaluate('[...document.querySelectorAll("[data-short-step],[data-article-step]")].every(b=>b.disabled)'),true);
  await shot('offline-mobile');
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
  await call('Emulation.setScriptExecutionDisabled',{value:true});
  await call('Page.navigate',{url:origin+'/'});
  await delay(1500);
  await shot('no-js-mobile');
  await call('Emulation.setScriptExecutionDisabled',{value:false});
  console.log('Links and fallback: all local routes/anchors, offline content fallbacks; no-JS screenshot saved.');
  console.log('Screenshots: ' + output);
} finally { browser.close(); }
