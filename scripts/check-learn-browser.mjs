// Uses installed Chrome and the native Node WebSocket; no test dependency.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {previewServer} from './preview.mjs';
import {probeArticle} from './learn-browser-probe.mjs';
import {parseArticle,prepareArticle} from './learn-article.mjs';
const mode=process.argv[2] || 'after';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'swissploit-learn-'));
const server=previewServer();
const chrome=process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const child=spawn(chrome,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9337',`--user-data-dir=${path.join(folder,'profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket; let sequence=0; const pending=new Map();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function call(method,params={}) {const id=++sequence;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},15000);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
try {
 let tabs;
 for(let n=0;n<80;n++){try{tabs=await(await fetch('http://127.0.0.1:9337/json')).json();break;}catch{await delay(200);}}
 if(!tabs)throw Error('Chrome not available');
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);clearTimeout(p.timeout);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
 await call('Page.enable'); await call('Network.enable');
 await call('Network.setBlockedURLs',{urls:['*fonts.googleapis.com*','*fonts.gstatic.com*','*youtube.com*','*youtube-nocookie.com*']});
 const pilots=['phishing-mails-erkennen','gefaehrliche-links-erkennen','auf-phishing-geklickt'];
 const pages=mode==='extras'?[]:mode==='before'?['/blog/phishing-mails-erkennen/']:pilots.map(p=>'/blog/'+p+'/').concat(['/blog/phishing-erkennen/','/en/blog/onedrive-restore-deleted-files/']);
 const results=[];
 for(const url of pages) for(const theme of ['dark','light']) for(const width of mode==='before'?[360,1440]:[320,360,768,1440]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:'http://127.0.0.1:4173'+url});
  for(let n=0;n<60;n++){if(await evaluate('document.readyState === "complete"'))break;await delay(100);}
  await evaluate(`localStorage.setItem('swissploit-theme','${theme}');document.documentElement.dataset.theme='${theme}'`);
  await evaluate(`Promise.all([...document.images].map(i => { i.loading='eager'; return i.decode().catch(()=>{}); }))`);
  await delay(120);
  const check=await evaluate(`(() => {
   const content=document.querySelector('.post-content');
   const overflow=[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width && (r.right>innerWidth+1 || r.left < -1);}).map(e=>e.tagName+'.'+e.className).slice(0,12);
   const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
   return {h1:document.querySelectorAll('h1').length,overflow,duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),key:content.querySelectorAll('.article-callout--key').length,toc:document.querySelectorAll('.article-toc').length,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')),font:getComputedStyle(content.querySelector('p')).fontSize};
  })()`);
  const probe=await evaluate(`(${probeArticle.toString()})()`);
  results.push({url,theme,width,...check,...probe});
  if(pilots.some(p=>url.includes(p)) && [360,1440].includes(width)){
   const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});
   await fs.writeFile(path.join(folder,`${mode}-${url.split("/").filter(Boolean).at(-1)}-${theme}-${width}.png`),Buffer.from(screenshot.data,'base64'));
   await evaluate('document.querySelector(".post-content").scrollIntoView()');
   const bodyShot=await call('Page.captureScreenshot',{format:'png'});
   await fs.writeFile(path.join(folder,`${mode}-body-${url.split("/").filter(Boolean).at(-1)}-${theme}-${width}.png`),Buffer.from(bodyShot.data,'base64'));
  }
  if(mode!=='before' && width===320){
   await evaluate('document.documentElement.style.fontSize="200%"');
   const reflow=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,content:document.querySelector(".post-content").scrollWidth})');
   results.push({url,theme,text200:reflow,probe200:await evaluate(`(${probeArticle.toString()})()`)});
  }

  if(mode!=='before' && width===360) {
   await evaluate('document.documentElement.style.fontSize="";window.scrollTo(0,0)');
   for(const selector of ['.article-toc summary','.article-faq summary']) {
    if(!await evaluate('Boolean(document.querySelector('+JSON.stringify(selector)+'))'))continue;
    await evaluate('document.querySelector('+JSON.stringify(selector)+').focus()');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
    const state=await evaluate('({open:document.activeElement.parentElement.open,focus:getComputedStyle(document.activeElement).outlineStyle})');
    results.push({url,theme,keyboard:selector,...state});
   }
   if(await evaluate('Boolean(document.querySelector(".article-toc a"))')) {
    await evaluate('document.querySelector(".article-toc a").focus()');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await delay(350);
    const anchor=await evaluate('({top:document.getElementById(decodeURIComponent(location.hash.slice(1))).getBoundingClientRect().top,header:document.querySelector(".site-header").getBoundingClientRect().bottom})');
    results.push({url,theme,anchor});
   }
  }
 }

 if(mode!=='before') {
  await call('Page.navigate',{url:'http://127.0.0.1:4173/blog/phishing-mails-erkennen/'});
  await delay(400);
  const guide=await fs.readFile('docs/LEARN-AUTHORING.md','utf8');
  const snippets=[...guide.matchAll(/```html\r?\n([\s\S]*?)\r?\n```/g)].map(m=>m[1]).join('\n\n');
  const fixture=prepareArticle(parseArticle('<p>Komponentenpr?fung: ? &amp; ?</p>'+snippets+'<p><a href="https://example.com/">https://example.com/'+ 'long'.repeat(80)+'</a></p><pre><code>'+ 'code'.repeat(80)+'</code></pre>','browser-fixture').html).html;
  await evaluate('document.querySelector(".post-article").innerHTML='+JSON.stringify(fixture));
  await evaluate('Promise.all([...document.images].map(i=>{i.loading="eager";return i.decode().catch(()=>{});} ))');
  for(const theme of ['dark','light'])for(const width of [320,768,1440]) {
   await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
   await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme));
   await delay(250);
   results.push({fixture:true,theme,width,...await evaluate('('+probeArticle.toString()+')()')});
   if(width===320){
    await evaluate('document.documentElement.style.fontSize="200%"');
    results.push({fixture:true,theme,probe200:await evaluate('('+probeArticle.toString()+')()')});
    await evaluate('document.documentElement.style.fontSize=""');
   }
   if(width===768){
    await evaluate('document.querySelector(".article-callout--info").scrollIntoView()');
    const shot=await call('Page.captureScreenshot',{format:'png'});
    await fs.writeFile(path.join(folder,'components-'+theme+'.png'),Buffer.from(shot.data,'base64'));
   }
  }
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  results.push({reducedMotion:await evaluate('({animation:getComputedStyle(document.querySelector(".article-callout")).animationName,transition:getComputedStyle(document.querySelector(".post-content a")).transitionDuration})')});
  for(const url of ['/index.html','/index.html#services','/index.html#sicherheitslage','/leistungen/microsoft-365-security-care/','/learn/','/phishing-simulation/']) {
   await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
   await call('Page.navigate',{url:'http://127.0.0.1:4173'+url});
   await delay(400);
   results.push({unaffected:url,articleStyleLeak:await evaluate('Boolean(document.querySelector("link[href*=learn-article],.learn-article-page"))'),title:await evaluate('document.title')});
   const shot=await call('Page.captureScreenshot',{format:'png'});
   await fs.writeFile(path.join(folder,'unchanged-'+url.replace(/[^a-z0-9]/gi,'-')+'.png'),Buffer.from(shot.data,'base64'));
  }
 }
 await fs.writeFile(path.join(folder,'results.json'),JSON.stringify(results,null,2));
 const failures=results.filter(r=>r.articleStyleLeak||r.overflow?.length||r.duplicateIds?.length||r.brokenImages?.length||r.contrastFailures?.length||r.probe200?.overflow.length||r.probe200?.contrastFailures.length||(r.probe200&&parseFloat(r.probe200.typography.p)<34)||r.anchor?.top<r.anchor?.header||(r.keyboard&&(!r.open||r.focus==='none')));
 console.log(JSON.stringify({folder,checks:results.length,failures},null,2));
 if(mode!=='before'&&failures.length)process.exitCode=1;
} finally {socket?.close();child.kill();server.close();}
