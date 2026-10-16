// Run from the repository root.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { openBrowser, delay } from '../../scripts/seo-browser.mjs';
const b = await openBrowser(4194,9354);
const {call,evaluate,origin}=b;
const click=s=>evaluate('document.querySelector('+JSON.stringify(s)+').click()');
async function ready(){for(let i=0;i<60;i++){if(await evaluate('document.body?.dataset.dashboardReady==="true"'))break;await delay(100)}assert.equal(await evaluate('document.body.dataset.dashboardReady'),'true');await evaluate('document.fonts.ready');await delay(600)}
async function key(key,code){await call('Input.dispatchKeyEvent',{type:'keyDown',key,windowsVirtualKeyCode:code});await call('Input.dispatchKeyEvent',{type:'keyUp',key});await delay(100)}
async function shot(name,full=false){const m=await call('Page.getLayoutMetrics');const r=await call('Page.captureScreenshot',{format:'png',...(full?{captureBeyondViewport:true,clip:{x:0,y:0,width:m.cssContentSize.width,height:m.cssContentSize.height,scale:1}}:{})});await fs.writeFile('.visual-check/hero-v4/'+name+'.png',Buffer.from(r.data,'base64'))}
try{
 for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[768,1024],[390,844],[320,740]]){
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await call('Page.navigate',{url:origin+'/unternehmen/'});await ready();
  for(const theme of ['dark','light']){
   await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme));await delay(80);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,width+': overflow');
   const heightBefore=await evaluate('document.querySelector("#dashboard").getBoundingClientRect().height');
   for(const name of ['content','people','evidence','overview']){
    await click('[data-tab="'+name+'"]');await delay(220);
    assert.equal(await evaluate('document.querySelector("#panel-'+name+'").hidden'),false);
    assert.ok(Math.abs(await evaluate('document.querySelector("#dashboard").getBoundingClientRect().height')-heightBefore)<1,'Stable tabs');
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,width+': tab overflow');
   }
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".dashboard-kpi strong")].map(e=>e.textContent)'),['25','19','76 %','6']);
   if([1920,1440,390].includes(width)){await shot('business-'+width+'-'+theme);if(width===390)await shot('business-'+width+'-'+theme+'-full',true)}
  }
 }
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 await evaluate('document.documentElement.dataset.theme="dark";document.querySelector("#tab-overview").focus()');
 await key('ArrowRight',39);assert.equal(await evaluate('document.activeElement.id'),'tab-content');
 await click('.module-card');assert.equal(await evaluate('document.querySelector("#module-dialog").open'),true);
 assert.match(await evaluate('document.querySelector("#module-detail").textContent'),/speichert keine Resultate/);
 await key('Escape',27);assert.equal(await evaluate('document.activeElement.className'),'module-card');
 await click('[data-tab="people"]');
 await evaluate('document.querySelector("#status-filter").value="open";document.querySelector("#status-filter").dispatchEvent(new Event("change"))');
 assert.equal(await evaluate('document.querySelectorAll("#people-rows tr").length'),3);
 assert.match(await evaluate('document.querySelector("#filter-summary").textContent'),/0 abgeschlossen.*3 offen.*0 %/);
 await evaluate('document.querySelector("#module-filter").value="phishing";document.querySelector("#module-filter").dispatchEvent(new Event("change"))');
 assert.match(await evaluate('document.querySelector("#people-rows").textContent'),/Keine Beispielzuweisung/);
 await evaluate('document.querySelector("#module-filter").value="all";document.querySelector("#module-filter").dispatchEvent(new Event("change"))');
 await click('#people-rows button');assert.equal(await evaluate('document.activeElement.id'),'tab-evidence');
 assert.match(await evaluate('document.querySelector("#evidence-preview").textContent'),/Abschluss ausstehend.*Noch kein Ergebnis/s);
 await evaluate('document.querySelector("#evidence-person").value="DEMO-01";document.querySelector("#evidence-person").dispatchEvent(new Event("change"))');
 assert.ok((await evaluate('document.querySelector("#evidence-preview").textContent')).includes('8 / 10 richtig (80 %)'));
 await evaluate('window.scrollTo(0,0)');await shot('business-evidence');
 await click('[data-tab="content"]');await shot('business-content');
 await click('[data-tab="people"]');await evaluate('document.querySelector("#status-filter").value="all";document.querySelector("#status-filter").dispatchEvent(new Event("change"))');await shot('business-people');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await click('[data-tab="overview"]');assert.equal(await evaluate('getComputedStyle(document.querySelector("#panel-overview")).animationName'),'none');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 await evaluate('document.querySelector("#dashboard").scrollIntoView({block:"start",behavior:"instant"})');await delay(300);
 const point=await evaluate('(()=>{const r=document.querySelector("#tab-content").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(150);
 assert.equal(await evaluate('document.querySelector("#tab-content").getAttribute("aria-selected")'),'true','Touch tab');
 await click('#menuToggle');assert.equal(await evaluate('document.querySelector("#navigationDialog").open'),true);await key('Escape',27);
 const links=await evaluate('[...document.querySelectorAll("a[href]")].map(a=>a.href)');
 assert.ok(links.some(h=>h.startsWith('mailto:hello@swissploit.ch?subject=Swissploit%20Learn')));
 for(const href of new Set(links.filter(h=>h.startsWith(origin)))){const u=new URL(href),r=await fetch(u);assert.equal(r.status,200,href);if(u.hash)assert.ok((await r.text()).includes('id="'+u.hash.slice(1)+'"'),href)}
 assert.deepEqual(b.errors,[]);assert.deepEqual(b.badResponses,[]);
 await call('Page.reload');await ready();assert.equal(await evaluate('document.querySelector("#status-filter").value'),'all','No persistence');
 await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Page.navigate',{url:origin+'/unternehmen/'});await delay(800);await shot('business-no-js-mobile');await call('Emulation.setScriptExecutionDisabled',{value:false});
 console.log('Business passed: six sizes, both themes, four stable tabs, keyboard, dialog focus, touch, filters, evidence, links, reduced motion and no persistence.');
}finally{b.close()}

