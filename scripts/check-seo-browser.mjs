// Cover all canonical pages on mobile, plus desktop and no-JS / failed-script fallbacks.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {openBrowser,delay} from './seo-browser.mjs';
const browser=await openBrowser();
const {call,evaluate,origin}=browser;
const urls=[... (await fs.readFile('sitemap.xml','utf8')).matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const blocked=['*fonts.googleapis.com*','*fonts.gstatic.com*','*youtube.com*','*youtube-nocookie.com*'];
const results=[];
try{
 await call('Network.setBlockedURLs',{urls:blocked});
 for(const mode of ['normal','no-js','failed-app']){
  const routes=mode==='failed-app'?['/','/learn/','/leistungen/microsoft-365-security-care/']:urls;
  for(const width of mode==='failed-app'?[320]:[375,1440]){
   await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<500});
   await call('Emulation.setScriptExecutionDisabled',{value:mode==='no-js'});
   await call('Network.setBlockedURLs',{urls:mode==='failed-app'?[...blocked,'*/assets/app.js']:blocked});
   for(const route of routes){
    await call('Page.navigate',{url:origin+route});await delay(180);
    // Re-enable only to inspect the document after its load scripts were skipped.
    if(mode==='no-js')await call('Emulation.setScriptExecutionDisabled',{value:false});
    await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])');
    const state=await evaluate(`(()=>{const invisible=[...document.querySelectorAll('main h1,main h2,main p,main li')].filter(el=>{if(el.closest('[hidden],dialog,details:not([open])'))return false;for(let p=el;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return true;}return false;});return {overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelector('h1')?.textContent,hidden:invisible.map(e=>e.textContent.slice(0,65)),nav:[...document.querySelectorAll('#primaryNav a')].map(e=>({width:e.getBoundingClientRect().width,display:getComputedStyle(e).display})),images:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src)};})()`);
    assert.equal(state.overflow,false,JSON.stringify({route,width,mode,state}));
    assert.deepEqual(state.images,[],`${route}: broken images`);
    if(mode!=='normal'){
     assert.deepEqual(state.hidden,[],`${route}: unavailable text with ${mode}`);
     assert.ok(state.nav.every(n=>n.width>0&&n.display!=='none'),`${route}: inaccessible fallback navigation`);
     if(route.includes('microsoft-365-security-care'))assert.match(state.h1,/365/);
    }
    if(mode==='normal'&&route.startsWith('/leistungen/')&&width<500){
     await evaluate('document.getElementById("menuToggle").click()');
     assert.equal(await evaluate('document.getElementById("menuToggle").getAttribute("aria-expanded")'),'true');
    }
    results.push({route,width,mode});
    if(mode==='no-js')await call('Emulation.setScriptExecutionDisabled',{value:true});
   }
  }
 }
 await call('Emulation.setScriptExecutionDisabled',{value:false});
 await call('Network.setBlockedURLs',{urls:blocked});
 for(const theme of ['dark','light']){
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await call('Page.navigate',{url:origin+'/leistungen/microsoft-365-security-care/'});await delay(250);
  await evaluate(`document.documentElement.dataset.theme='${theme}';document.getElementById('umfang').scrollIntoView({behavior:'instant'})`);
  assert.equal(await evaluate('getComputedStyle(document.getElementById("umfang")).opacity'),'1');
  const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(browser.folder,`service-${theme}.png`),Buffer.from(shot.data,'base64'));
 }
 const missing=await fetch(origin+'/nonexistent-seo-check/');assert.equal(missing.status,404);assert.match(await missing.text(),/noindex,follow/);
 const sitemap=await fetch(origin+'/sitemap.xml');assert.match(sitemap.headers.get('content-type'),/xml/);
 assert.deepEqual(browser.errors,[],'No browser exceptions');assert.deepEqual(browser.badResponses,[],'No missing local resources');
 console.log(JSON.stringify({folder:browser.folder,checks:results.length,errors:browser.errors.length,coverage:'all sitemap URLs; mobile/desktop; no JS; failed app.js; navigation; reduced motion; true 404'},null,2));
}finally{browser.close();}
