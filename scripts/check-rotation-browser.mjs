import assert from 'node:assert/strict';
import { openBrowser, delay } from './seo-browser.mjs';
const browser=await openBrowser(4196,9356),{call,evaluate,origin}=browser;
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(80);}throw Error('Timed out: '+expression);};
async function visit(route){await call('Page.navigate',{url:origin+route});await waitFor('document.readyState === "complete"');}
try {
 await call('Emulation.setFocusEmulationEnabled',{enabled:true});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await visit('/');await waitFor('document.body.dataset.contentReady === "true"');
 const count=()=>evaluate('document.querySelector("#short-count").textContent');
 assert.equal(await evaluate('document.querySelectorAll(".hub-articles").length'),0);
 assert.equal(await evaluate('document.querySelector("swissploit-security-core").querySelectorAll("img").length'),0);
 assert.equal(await evaluate('getComputedStyle(document.querySelector("#rotation-toggle")).clipPath'),'inset(50%)');
 await evaluate('document.querySelector("#rotation-toggle").focus()');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("#rotation-toggle")).clipPath'),'none');
 await evaluate('document.activeElement.blur()');
 // Focus deliberately adds a cooldown; reload for the initial automatic slot.
 await visit('/');await waitFor('document.body.dataset.contentReady === "true"');
 await delay(9300);assert.equal(await count(),'2 / 10');
 await click('[data-short-step="1"]');assert.equal(await count(),'3 / 10');
 assert.equal(await evaluate('document.querySelector("#rotation-toggle").getAttribute("aria-pressed")'),'true');
 assert.ok(await evaluate('document.querySelector("#short-content").getAnimations({subtree:true}).some(a=>a.effect.getKeyframes().some(k=>k.filter?.includes("blur")))'));
 await delay(21000);assert.equal(await count(),'3 / 10');
 console.log('Automatic rotation, manual arrow, blur-fade and persistent manual pause passed.');
 await click('#rotation-toggle');await delay(9300);assert.equal(await count(),'4 / 10');
 await click('#rotation-toggle');const held=await count();await delay(9300);assert.equal(await count(),held);
 await click('#rotation-toggle');await delay(1100);assert.equal(await count(),'4 / 10');
 await evaluate('document.querySelector(".hub-short-copy a").focus()');await delay(9300);assert.equal(await count(),'4 / 10');
 assert.equal(await evaluate('document.querySelectorAll(".hub-play").length'),1);
 await click('.hub-short-poster');assert.equal(await evaluate('document.querySelector("#short-dialog").open'),true);
 assert.match(await evaluate('document.querySelector("#short-player iframe").src'),/^https:\/\/www.youtube-nocookie.com\/embed\//);
 await delay(100);await click('[data-dialog-close]');
 await waitFor('document.querySelectorAll("#short-player iframe").length===0');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(200);assert.equal(await evaluate('document.querySelector("#rotation-toggle").disabled'),true);
 await click('[data-short-step="1"]');assert.equal(await count(),'5 / 10');
 assert.equal(await evaluate('document.querySelector("#short-content").getAnimations({subtree:true}).length'),0);
 console.log('Video rotation, keyboard-visible motion control, persistent manual pause, focus pause, player cleanup and reduced motion passed.');

 assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.badResponses,[]);
} finally {browser.close();}
