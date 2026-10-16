import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { openBrowser, delay } from './seo-browser.mjs';

const browser = await openBrowser(4199, 9359);
const { call, evaluate, origin } = browser;
const folder = '.visual-check/homepage-v5.2';
await fs.mkdir(folder, { recursive: true });
const core = 'document.querySelector("swissploit-security-core")';
const waitFor = async expression => {
  for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await delay(40); }
  throw Error('Timed out: ' + expression);
};
const size = (width, height, mobile = false) => call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
const visit = async route => {
  await call('Page.navigate', { url: origin + route });
  await waitFor('document.readyState === "complete"');
};
const shot = async name => {
  const result = await call('Page.captureScreenshot', { format: 'png' });
  await fs.writeFile(`${folder}/${name}.png`, Buffer.from(result.data, 'base64'));
};
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const move = async selector => {
  const point = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
};

try {
  await size(1440, 900);
  // Observe every frame from document creation, including the pre-stylesheet interval.
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.particleFlashes = [];
    function inspect() {
      const core = document.querySelector('swissploit-security-core');
      const status = core?.shadowRoot?.querySelector('[role=status]');
      if (status && getComputedStyle(status).clipPath !== 'inset(50%)') particleFlashes.push('visible description');
      if (core?.querySelector('img') || core?.shadowRoot?.querySelector('img')) particleFlashes.push('fallback image');
      requestAnimationFrame(inspect);
    }
    requestAnimationFrame(inspect);
  ` });
  for (let refresh = 0; refresh < 5; refresh++) {
    if (!refresh) await visit('/'); else await call('Page.reload', { ignoreCache: true });
    await waitFor(`${core}?.introActive === true`);
    const start = await evaluate(`(() => {
      const c = ${core}, rect = c.canvas.getBoundingClientRect();
      window.originalNodes = c.nodes; window.originalTargets = c.targets.neutral;
      return { width: rect.width, height: rect.height, parent: c.canvas.parentElement.tagName,
        pointer: getComputedStyle(c.canvas).pointerEvents, canvases: document.querySelectorAll('body > canvas').length,
        spreadX: Math.max(...c.nodes.map(n=>n.startX))-Math.min(...c.nodes.map(n=>n.startX)),
        spreadY: Math.max(...c.nodes.map(n=>n.startY))-Math.min(...c.nodes.map(n=>n.startY)) };
    })()`);
    assert.ok(start.width >= 1410 && start.width <= 1440); assert.equal(start.height, 900);
    assert.equal(start.parent, 'BODY'); assert.equal(start.pointer, 'none'); assert.equal(start.canvases, 1);
    assert.ok(start.spreadX > .98 && start.spreadY > .98);
    if (!refresh) {
      for (const time of [.25, .8, 1.4]) {
        await waitFor(`${core}.elapsed - ${core}.introStart >= ${time}`);
        await shot('intro-' + time);
        if (time === .25) {
          const coverage = await evaluate(`(() => {
            const c=${core}, data=c.ctx.getImageData(0,0,c.canvas.width,c.canvas.height).data, bins=[0,0,0,0];
            for(let y=0;y<c.canvas.height;y++)for(let x=0;x<c.canvas.width;x++) {
              if(data[(y*c.canvas.width+x)*4+3]>15) bins[(y<c.canvas.height/2?0:2)+(x<c.canvas.width/2?0:1)]++;
            }
            return bins;
          })()`);
          assert.ok(coverage.every(n => n > 100), 'drawn particles across all viewport quadrants: ' + coverage);
        }
      }
    }
    await waitFor(`${core}.introActive === false`);
    assert.deepEqual(await evaluate('particleFlashes'), []);
    assert.ok(await evaluate(`${core}.canvas.parentNode === ${core}.stage`));
    assert.ok(await evaluate(`${core}.nodes === originalNodes && ${core}.targets.neutral === originalTargets`));
    assert.equal(await evaluate('document.querySelectorAll("body > canvas").length'), 0);
  }
  await shot('settled-1440');
  console.log('Five refreshs: full-viewport rendering, four-quadrant pixel coverage, no placeholder flashes, one canvas.');

  // Repeated native logo activation must reuse the document, particles and targets.
  await evaluate('window.documentMarker = 52');
  for (let repeat = 0; repeat < 3; repeat++) {
    await click('.site-brand');
    assert.ok(await evaluate(`${core}.introActive && window.documentMarker === 52 && ${core}.nodes === originalNodes && ${core}.targets.neutral === originalTargets`));
    await delay(160);
  }
  await waitFor(`${core}.introActive === false`);
  // Minimum distance and fractional coordinates catch the former mask scanline pattern.
  const distribution = await evaluate(`(() => {
    const points=${core}.targets.neutral; let minimum=Infinity;
    for(let i=0;i<points.length;i++)for(let j=0;j<i;j++)minimum=Math.min(minimum,Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y));
    return {minimum, rows:new Set(points.map(p=>p.y.toFixed(3))).size, count:points.length};
  })()`);
  assert.ok(distribution.minimum > 2.5, JSON.stringify(distribution));
  assert.ok(distribution.rows > distribution.count * .95);
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'hover', value: 'hover' }, { name: 'pointer', value: 'fine' }] });
  for (const mode of ['shorts','learn','quiz','game','security-check','datenschutz-care','incident-readiness','business','quiz-games']) {
    await move(`[data-core="${mode}"]`);
    await waitFor(`${core}.mode === ${JSON.stringify(mode)}`);
    await delay(850);
    assert.ok(await evaluate(`${core}.nodes.every((n,i)=>Math.hypot(n.x-${core}.targets[${JSON.stringify(mode)}][i].x,n.y-${core}.targets[${JSON.stringify(mode)}][i].y)<.1)`), mode);
  }
  await move('.core-test-visual'); await waitFor(`${core}.mode === 'neutral'`); await delay(850);
  const point = await evaluate(`(() => { const c=${core}, r=c.canvas.getBoundingClientRect(), n=c.nodes[Math.floor(c.nodes.length/2)]; return {x:r.x+c.width/2+n.x*c.scale,y:r.y+c.height/2+n.y*c.scale}; })()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point }); await delay(200);
  assert.ok(await evaluate(`${core}.pointer.active && ${core}.nodes.some(n=>Math.hypot(n.offsetX,n.offsetY)>.5)`));
  await click('.site-brand'); await move('#primaryNav [data-core="learn"]');
  assert.ok(await evaluate(`(() => { const a=document.querySelector('#primaryNav [data-core="learn"]'),r=a.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===a; })()`));
  await click('#primaryNav [data-core="learn"]'); await waitFor('location.pathname === "/learn/"');
  await click('.site-brand'); await waitFor(`${core}?.introActive === true`);
  console.log('Logo restart, stable organic targets, all nine morphs, cursor displacement, clickable navigation and return from Learn passed.');

  const layouts = [];
  for (const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,900],[390,844],[320,740]]) {
    await size(width,height,width<600); await visit('/'); await waitFor('document.body.dataset.contentReady === "true"');
    await waitFor(`${core}.introActive === false`);
    for (const theme of ['dark','light']) {
      await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await delay(80);
      const layout = await evaluate(`(() => {
        const poster=document.querySelector('.hub-short-poster').getBoundingClientRect(), card=document.querySelector('.hub-updates').getBoundingClientRect();
        return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
          posterWidth:poster.width,ratio:poster.width/poster.height,cardHeight:card.height, count:${core}.nodes.length};
      })()`);
      assert.ok(layout.scrollWidth <= width, JSON.stringify(layout));
      if(width>=1366)assert.ok(layout.scrollHeight <= height+2,JSON.stringify(layout));
      assert.ok(Math.abs(layout.ratio-9/16)<.002,JSON.stringify(layout));
      if(width<600)assert.equal(layout.count,460);
      if(theme==='dark')layouts.push(layout);
      await shot(`home-${width}-${theme}`);
      if(width<600) {
        await evaluate('document.querySelector(".hub-updates").scrollIntoView({block:"center",behavior:"instant"})');
        await shot(`video-${width}-${theme}`);
        await evaluate('window.scrollTo({top:0,behavior:"instant"})');
      }
    }
  }
  assert.ok(layouts[0].posterWidth > layouts[1].posterWidth && layouts[1].posterWidth > 148);
  assert.equal(layouts[2].posterWidth,124);
  await fs.writeFile(folder+'/layouts.json',JSON.stringify(layouts,null,2));
  console.log('Six viewports, both themes: proportional larger desktop thumbnails, compact 768px layout, no overflow, mobile particle budget.');

  await size(1440,900);
  await visit('/'); await waitFor(`${core}?.introActive === true`);
  await call('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:2,mobile:false});
  await delay(200);
  assert.ok(await evaluate(`${core}.canvas.width === Math.round(${core}.viewport.width * 2)`));
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await waitFor(`!${core}.introActive && ${core}.frame === 0`);
  await size(1440,900);
  await visit('/'); await waitFor(`${core}?.nodes.length > 0`); await delay(150);
  assert.ok(await evaluate(`!${core}.introActive && ${core}.frame === 0`));
  await click('.site-brand'); await delay(100);
  assert.ok(await evaluate(`!${core}.introActive && ${core}.frame === 0`));
  assert.equal(await evaluate('document.querySelector("#rotation-toggle").disabled'),true);
  await click('[data-short-step="1"]');
  assert.equal(await evaluate('document.querySelector("#short-content").getAnimations({subtree:true}).length'),0);
  await shot('reduced-motion');
  // Blocking the deferred shadow stylesheet must never expose descriptive text or an image.
  await call('Network.setBlockedURLs',{urls:['*security-core.css*']});
  await visit('/'); await delay(300);
  assert.deepEqual(await evaluate('particleFlashes'),[]);
  assert.equal(await evaluate(`${core}.nodes.length`),0);
  assert.equal(await evaluate(`${core}.frame`),0);
  await shot('stylesheet-unavailable');
  await call('Network.setBlockedURLs',{urls:[]});
  await call('Emulation.setEmulatedMedia',{features:[]});
  for(const slug of ['security-check','datenschutz-care','incident-readiness']) {
    await visit('/leistungen/'+slug+'/'); await waitFor(`${core}?.nodes.length > 0`);
    assert.equal(await evaluate(`${core}.mode`),slug);
    assert.equal(await evaluate(`${core}.canvas.parentNode === ${core}.stage`),true);
  }
  assert.deepEqual(browser.errors,[]); assert.deepEqual(browser.badResponses,[]);
  console.log('Reduced motion, stylesheet-failure flash prevention, unchanged service shapes and clean browser console passed. Screenshots: '+folder);
} finally { browser.close(); }
