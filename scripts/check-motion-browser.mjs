// Motion and shared navigation checks using the installed browser; no new dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import {openBrowser, delay} from './seo-browser.mjs';
import {checkSignal} from './check-signal-browser.mjs';
const browser = await openBrowser(4186, 9346);
const {call, evaluate, origin, folder} = browser;
const shot = async name => {
  const result = await call('Page.captureScreenshot', {format:'png'});
  await fs.writeFile(path.join(folder, name+'.png'), Buffer.from(result.data,'base64'));
};
const move = async expression => { await evaluate(expression); await delay(120); };
try {
  await call('Network.setBlockedURLs', {urls:['*fonts.googleapis.com*','*fonts.gstatic.com*','*youtube.com*','*youtube-nocookie.com*']});
  const pages = [];
  for (const file of await fg('**/*.html',{ignore:['node_modules/**','.git/**']})) {
    if ((await fs.readFile(file,'utf8')).includes('class="site-header shared-header"')) pages.push('/'+file.replace(/index.html$/,''));
  }
  // Every generated header loads the same styles/controller; both themes and menu modes.
  for (const width of [320, 850, 1024, 1440]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    const routes = width === 320 || width === 1440 ? pages : ['/','/learn/','/leistungen/microsoft-365-security-care/'];
    for (const route of routes) {
      await call('Page.navigate',{url:origin+route}); await delay(350);
      if (route === '/') await move('document.getElementById("hero").scrollIntoView({behavior:"instant"})');
      for (const theme of ['dark','light']) {
        await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme));
        const state = await evaluate(`(() => {
          const nav=document.getElementById('primaryNav'), header=document.querySelector('.shared-header');
          const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
          const rects=[...header.querySelectorAll('a,button')].filter(e=>e.getClientRects().length).map(e=>({name:e.textContent.trim(),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}));
          return {ready:document.body.classList.contains('navigation-ready'),count:nav.querySelectorAll('a').length,overflow:document.documentElement.scrollWidth>innerWidth,duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),rects,learn:nav.querySelector('.site-learn').getAttribute('href'),headerHeight:header.offsetHeight};
        })()`);
        assert.ok(state.ready,route); assert.equal(state.count,5,route); assert.deepEqual(state.duplicates,[],route);
        if(state.overflow) console.log(await evaluate(`JSON.stringify([...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||r.left<0)}).map(e=>({tag:e.tagName,cl:e.className,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})).slice(0,20))`)); assert.equal(state.overflow,false,route+' '+width+' '+theme); assert.equal(state.headerHeight,width<=850?77:81,route);
        for (const rect of state.rects) assert.ok(rect.left>=0 && rect.right<=width,JSON.stringify({route,width,rect}));
        if(route.startsWith('/en/')) assert.equal(state.learn,'/en/learn/');
        if (width<=850) {
          await move('document.getElementById("menuToggle").click()');
          assert.equal(await evaluate('document.getElementById("navigationDialog").matches(":modal")'),true);
          assert.equal(await evaluate('document.activeElement.classList.contains("menu-close")'),true);
          const fit=await evaluate('[...document.querySelectorAll("#primaryNav a")].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})');
          assert.ok(fit,route);
          await evaluate('document.querySelector("#primaryNav a:last-child").focus()');
          await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
          assert.equal(await evaluate('document.activeElement.classList.contains("menu-close")'),true);
          if (route==='/learn/' && theme==='light' && width===320) await shot('menu-light-320');
          await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); await delay(260);
          assert.equal(await evaluate('document.activeElement.id'),'menuToggle');
        }
      }
      if (route==='/learn/' && width===1440) await shot('header-light-1440');
    }
    console.log('Navigation checked: '+routes.length+' pages at '+width+'px, both themes');
  }
  for (const width of [320,375,768,1440]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:origin+'/'}); await delay(200);
    await checkSignal(browser,width);
    for(const id of ['security-check','datenschutz-care','incident-readiness']) {
      await move(`document.querySelector('#${id} .product-motif').scrollIntoView({block:'center',behavior:'instant'})`);
      await delay(750);
      assert.equal(await evaluate(`document.querySelector('#${id} .product-motif').classList.contains('is-running')`),true);
      const sample=()=>evaluate(`getComputedStyle(document.querySelector('#${id} .product-motif').querySelector('.scan-beam,.rule-focus,.step-focus')).transform`);
      const first=await sample();await delay(500);assert.notEqual(await sample(),first,'Illustration moves without interaction');
      assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
      if(width===1440) await shot(id);
    }
    await move('scrollTo({top:0,behavior:"instant"})');await delay(750);
    assert.equal(await evaluate('document.querySelectorAll(".product-motif.is-running").length'),0,'Offscreen loops paused');
    assert.equal(await evaluate('document.getElementById("security-check").classList.contains("is-revealed")'),false,'Offscreen reveal resets');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".rule-focus")).animationName'),'none');
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    console.log('Motion checked at '+width+'px: scroll, reverse, idle, loops, reduced motion');
  }
  // Native static navigation remains available even when scripts do not execute.
  await call('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});
  await call('Emulation.setScriptExecutionDisabled',{value:true});
  await call('Page.navigate',{url:origin+'/learn/'});await delay(250);
  await call('Emulation.setScriptExecutionDisabled',{value:false});
  assert.equal(await evaluate('[...document.querySelectorAll("#primaryNav a")].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth})'),true);
  assert.deepEqual(browser.errors,[],'No browser exceptions');
  assert.deepEqual(browser.badResponses,[],'No missing local resources');
  console.log(JSON.stringify({folder,pages:pages.length,checks:'navigation, themes, responsive, keyboard, no JS, motion, reduced motion, layout, requests'}));
} finally { browser.close(); }
