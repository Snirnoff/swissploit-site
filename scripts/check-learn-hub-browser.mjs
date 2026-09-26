// Uses installed Chrome and the native Node WebSocket; no test dependency.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {previewServer} from './preview.mjs';
import assert from 'node:assert/strict';
import {readShorts} from './youtube-shorts.mjs';

const mode=process.argv[2] || 'after';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'swissploit-learn-'));
const server=previewServer();
const chrome=process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const child=spawn(chrome,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9338',`--user-data-dir=${path.join(folder,'profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket; let sequence=0; const pending=new Map();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function call(method,params={}) {const id=++sequence;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},15000);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
try {
 let tabs;
 for(let n=0;n<80;n++){try{tabs=await(await fetch('http://127.0.0.1:9338/json')).json();break;}catch{await delay(200);}}
 if(!tabs)throw Error('Chrome not available');
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timeout);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
 await call('Page.enable'); await call('Network.enable');
 await call('Network.setBlockedURLs',{urls:['*fonts.googleapis.com*','*fonts.gstatic.com*','*youtube.com*','*youtube-nocookie.com*']});

 const videos=await readShorts();
 const errors=[]; const requests=[];
 await call('Runtime.enable');
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);});
 const results=[];
 const visible=selector=>`[...document.querySelectorAll(${JSON.stringify(selector)})].filter(e=>e.getBoundingClientRect().width>0)`;
 const search=async value=>{await evaluate(`document.getElementById('blogSearch').value=${JSON.stringify(value)};document.getElementById('blogSearch').dispatchEvent(new Event('input'))`);};
 const key=async()=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});};
 for(const language of ['de','en'])for(const theme of ['dark','light'])for(const width of [1440,768,360]){
  requests.length=0;
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:'http://127.0.0.1:4173/'+(language==='en'?'en/':'')+'learn/'});
  await delay(300);
  await evaluate(`localStorage.setItem('swissploit-reading-state','invalid legacy data');document.documentElement.dataset.theme='${theme}'`);
  assert.equal(await evaluate('document.querySelectorAll("#videoGrid iframe").length'),videos.length);
  assert.equal(requests.some(u=>/youtube|ytimg/.test(u)),false,'No YouTube requests before interaction');
  assert.equal(await evaluate('!!document.querySelector(".learn-progress,.learn-continue,.learn-featured,.learn-card-status,.learn-card-progress")'),false);
  const articleCount=await evaluate(`${visible('#blogGrid .blog-card')}.length`);
  assert.ok(articleCount>0);
  const top=await evaluate('document.getElementById("blogGrid").getBoundingClientRect().top');
  if(width===1440)assert.ok(top<800,`Articles too far down: ${top}`);
  await search('phishing');
  assert.ok(await evaluate(`${visible('#blogGrid .blog-card')}.length`)>0);
  await search('zzzxnomatches');assert.equal(await evaluate('document.getElementById("noResults").hidden'),false);
  await search('');
  const filterCounts={all:articleCount};
  for(const filter of ['phishing','fraud','links-qr','passwords','mfa','accounts','workplace']){
   await evaluate(`document.querySelector("[data-learn-filter=${filter}]").click()`);
   filterCounts[filter]=await evaluate(`${visible('#blogGrid .blog-card')}.length`);
   assert.ok(filterCounts[filter]>0,`Empty article filter: ${filter}`);
  }
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await evaluate('document.querySelector("[data-learn-filter=video]").focus()');
  const focus=await evaluate('getComputedStyle(document.activeElement).outlineStyle');assert.notEqual(focus,'none');
  await key();
  assert.equal(await evaluate('document.querySelector("[data-learn-filter=video]").getAttribute("aria-pressed")'),'true');
  assert.deepEqual(await evaluate(`${visible('.learn-video-card')}.map(c=>c.dataset.videoId)`),videos.map(v=>v.id));
  assert.equal(await evaluate(`${visible('#blogGrid .blog-card')}.length`),0);
  await delay(350);
  const geometry=await evaluate(`(()=>{const grid=document.getElementById('videoGrid');const c=grid.firstElementChild;const preview=c.querySelector('.learn-short-preview').getBoundingClientRect();const card=c.getBoundingClientRect();const chip=getComputedStyle(document.querySelector('[data-learn-filter=video]'));const rows=new Set([...document.querySelectorAll('.filter-chip')].map(e=>Math.round(e.getBoundingClientRect().top)));const eyebrow=document.querySelector('.learn-eyebrow').getBoundingClientRect();const title=document.getElementById('learn-title').getBoundingClientRect();const utility=document.querySelector('.blog-breadcrumbs').getBoundingClientRect();const lang=document.querySelector('.lang-toggle').getBoundingClientRect();const filter=document.querySelector('.learn-topic-filter').getBoundingClientRect();return {columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,filterRows:rows.size,contentGap:grid.getBoundingClientRect().top-filter.bottom,heroAxis:Math.abs((eyebrow.left+eyebrow.right-title.left-title.right)/2),langAxis:Math.abs((lang.top+lang.bottom-utility.top-utility.bottom)/2),overflow:document.documentElement.scrollWidth>innerWidth,ratio:preview.width/preview.height,center:Math.abs((preview.left+preview.right)/2-(card.left+card.right)/2),chip:{background:chip.backgroundColor,color:chip.color,size:chip.fontSize,weight:chip.fontWeight,height:chip.height}};})()`);
  assert.equal(geometry.columns,width===1440?4:width===768?2:1);
  assert.equal(geometry.overflow,false);assert.ok(Math.abs(geometry.ratio-9/16)<0.005);assert.ok(geometry.center<1);
  assert.ok(geometry.contentGap>=24);assert.ok(geometry.heroAxis<1);assert.ok(geometry.langAxis<1);
  if(width>=768)assert.ok(geometry.filterRows<=2);
  assert.equal(geometry.chip.background,'rgb(255, 0, 0)');assert.equal(geometry.chip.color,'rgb(255, 255, 255)');assert.equal(parseFloat(geometry.chip.size),14);assert.ok(Number(geometry.chip.weight)>=700);assert.ok(parseFloat(geometry.chip.height)<=38);
  if(language==='de'){
   await evaluate('window.scrollTo(0,0)');
   await delay(250);
   const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(folder,`hub-${theme}-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  if(language==='de' && width===360){
   await evaluate('document.getElementById("videoGrid").scrollIntoView()');
   const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(folder,`cards-${theme}-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  for(const query of ['PHISHING','passwort','mfa','qr','datenschutz','konto']){
   await search(query);
   const expected=videos.filter(v=>[v.title,v.description,...(v.tags||[])].join(' ').toLowerCase().includes(query.toLowerCase())).map(v=>v.id);
   assert.deepEqual(await evaluate(`${visible('.learn-video-card')}.map(c=>c.dataset.videoId)`),expected);
  }
  await search('zzzxnomatches');assert.equal(await evaluate('document.getElementById("noResultsText").textContent'),language==='de'?'Keine passenden Videos gefunden.':'No matching videos found.');
  await search('');
  assert.equal(await evaluate('!!document.querySelector(".learn-video-action,.learn-video-badge,.learn-video-body")'),false);
  const player=await evaluate(`(()=>{const f=document.querySelector('#videoGrid iframe');const r=f.getBoundingClientRect();return {src:f.src,ratio:r.width/r.height,right:r.right,policy:f.referrerPolicy,title:f.title,loading:f.loading,autoplay:new URL(f.src).searchParams.has('autoplay')};})()`);
  assert.equal(player.src,'https://www.youtube-nocookie.com/embed/'+videos[0].id);assert.ok(Math.abs(player.ratio-9/16)<0.01);assert.ok(player.right<=width);assert.ok(player.title);assert.equal(player.policy,'strict-origin-when-cross-origin');assert.equal(player.loading,'lazy');assert.equal(player.autoplay,false);
  await search('zzzxnomatches');assert.equal(await evaluate(`${visible('#videoGrid iframe')}.length`),0);
  await search('');await evaluate('document.querySelector("[data-learn-filter=all]").click()');
  assert.equal(await evaluate(`${visible('#blogGrid .blog-card')}.length`),articleCount);
  assert.equal(await evaluate(`${visible('.learn-video-card')}.length`),0);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
  results.push({language,theme,width,articleCount,filterCounts,articlesTop:top,...geometry});
 }
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await evaluate('document.querySelector("[data-learn-filter=video]").click()');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".learn-video-card")).animationName'),'none');
 assert.deepEqual(errors,[],'No JavaScript errors');
 await fs.writeFile(path.join(folder,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({folder,checks:results.length,errors,results},null,2));
} finally {socket?.close();child.kill();server.close();}
