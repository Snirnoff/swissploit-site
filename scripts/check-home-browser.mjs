// Homepage layout and navigation QA with installed Chrome; no dependencies.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {previewServer} from './preview.mjs';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'swissploit-home-'));
const server=previewServer(process.cwd(),4181);
const browser=spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-port=9341',`--user-data-dir=${path.join(folder,'profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let socket,seq=0;const pending=new Map(),errors=[],badResponses=[];
async function call(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function screenshot(name){const shot=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(path.join(folder,name+'.png'),Buffer.from(shot.data,'base64'));}
try{
 let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch('http://127.0.0.1:9341/json')).json();break;}catch{await delay(200);}}
 assert.ok(tabs,'Chrome starts');
 socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
 socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&m.params.response.url.startsWith('http://127.0.0.1'))badResponses.push(m.params.response);});
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 const results=[];
 for(const theme of ['dark','light'])for(const width of [1920,1440,768,430,375,320]){
  const height=width<500?844:width===1920?1080:900;
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:'http://127.0.0.1:4181/'});await delay(350);
  await evaluate(`document.documentElement.dataset.theme='${theme}';localStorage.setItem('swissploit-theme','${theme}')`);
  await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2000))])');
  const semantics=await evaluate(`(()=>{const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);return {h1:document.querySelectorAll('h1').length,products:document.querySelectorAll('.product-card').length,duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash),badMail:[...document.querySelectorAll('a[href^="mailto:"]')].filter(a=>!new URL(a.href).searchParams.get('subject')||!a.href.startsWith('mailto:hello@swissploit.ch?')).map(a=>a.href),schema:JSON.parse(document.querySelector('[type="application/ld+json"]').textContent).serviceType};})()`);
  assert.equal(semantics.h1,1);assert.equal(semantics.products,3);assert.deepEqual(semantics.duplicateIds,[]);assert.deepEqual(semantics.brokenAnchors,[]);assert.deepEqual(semantics.badMail,[]);assert.deepEqual(semantics.schema,['Security Check','Datenschutz Care','Incident Readiness']);
  // Three separate moments: fullscreen brand, original letter explosion, product hero.
  const signatureState=()=>evaluate(`(()=>{
    const intro=document.getElementById('intro'),stage=intro.querySelector('.intro-stage');
    const letters=[...intro.querySelectorAll('.intro-letter')];
    return {scroll:scrollY,overflow:document.documentElement.scrollWidth>innerWidth,
      introHeight:intro.offsetHeight,stageHeight:stage.offsetHeight,stageTop:stage.getBoundingClientRect().top,
      heroTop:document.getElementById('hero').getBoundingClientRect().top+scrollY,
      productTop:document.getElementById('services').getBoundingClientRect().top+scrollY,
      wordOpacity:Number(getComputedStyle(intro.querySelector('.intro-wordmark')).opacity),
      letterCase:getComputedStyle(intro.querySelector('.intro-wordmark')).textTransform,
      claimOpacity:Number(getComputedStyle(intro.querySelector('.intro-subtitle')).opacity),
      wordTop:intro.querySelector('.intro-wordmark').getBoundingClientRect().top,
      claimTop:intro.querySelector('.intro-subtitle').getBoundingClientRect().top,
      burgerVisibility:getComputedStyle(document.getElementById('menuToggle')).visibility,
      arrowVisibility:getComputedStyle(intro.querySelector('.intro-arrow')).visibility,
      headerVisibility:getComputedStyle(document.querySelector('.site-header')).visibility,
      letters:letters.map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {opacity:Number(s.opacity),transform:s.transform,left:r.left,right:r.right,top:r.top,bottom:r.bottom};})};
  })()`);
  await evaluate('scrollTo({top:0,behavior:"instant"})');await delay(400);
  const initial=await signatureState();
  assert.equal(initial.letters.length,10);assert.equal(initial.overflow,false);
  assert.equal(initial.letterCase,'none');assert.ok(initial.heroTop>=height,'No product copy in first viewport');
  assert.equal(initial.stageHeight,height);assert.equal(initial.headerVisibility,'hidden');assert.equal(initial.arrowVisibility,'visible');
  for(const letter of initial.letters){assert.equal(letter.opacity,1);assert.ok(letter.left>=0&&letter.right<=width,'Whole word visible');}
  await screenshot(`signature-start-${theme}-${width}`);
  assert.equal(initial.burgerVisibility,'visible');
  await evaluate('document.getElementById("menuToggle").click()');await delay(650);
  assert.equal(await evaluate('document.getElementById("navigationDialog").matches(":modal")'),true);
  assert.equal(await evaluate('document.body.classList.contains("navigation-open")'),true);
  assert.equal(await evaluate('document.activeElement.classList.contains("menu-close")'),true);
  const menuGeometry=await evaluate('(()=>{const nav=document.getElementById("primaryNav"),r=nav.getBoundingClientRect();return {height:r.height,position:getComputedStyle(nav).position,background:getComputedStyle(nav).backgroundColor,inside:[...nav.children].every(a=>{const b=a.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom+1&&b.left>=0&&b.right<=innerWidth})};})()');
  assert.equal(menuGeometry.position,'static','No inherited fixed mobile panel');
  assert.equal(menuGeometry.background,'rgba(0, 0, 0, 0)','Dark overlay without old link-panel backgrounds');
  assert.ok(menuGeometry.height>200&&menuGeometry.inside,'All menu links fit their container');
  await screenshot(`intro-menu-${theme}-${width}`);
  await evaluate('document.querySelector("#primaryNav a:last-child").focus()');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  assert.equal(await evaluate('document.activeElement.classList.contains("menu-close")'),true,'Focus wraps inside overlay');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
  assert.equal(await evaluate('document.activeElement.textContent'),'Learn','Reverse tab wraps');
  await evaluate('document.querySelector(".intro-arrow").focus()');
  assert.equal(await evaluate('document.getElementById("navigationDialog").contains(document.activeElement)'),true,'Background is inert');
  await call('Input.dispatchMouseEvent',{type:'mouseWheel',x:width/2,y:height/2,deltaX:0,deltaY:400});await delay(80);
  assert.equal(await evaluate('scrollY'),0,'No background scroll');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(300);
  assert.equal(await evaluate('document.getElementById("navigationDialog").open'),false);
  assert.equal(await evaluate('document.activeElement.id'),'menuToggle','Escape returns focus');
  const pinDistance=initial.introHeight-initial.stageHeight;
  const middleY=Math.round(pinDistance*.85);
  await evaluate(`scrollTo({top:${middleY},behavior:'instant'})`);await delay(450);
  const middle=await signatureState();
  assert.equal(middle.scroll,middleY,'Natural browser scroll');assert.equal(middle.stageTop,0,'Stage stays pinned');
  assert.notEqual(middle.letters[0].transform,initial.letters[0].transform);
  assert.equal(middle.headerVisibility,'hidden');assert.equal(middle.burgerVisibility,'visible');
  assert.ok(middle.wordTop<initial.wordTop-height*.08,'Whole word moves up while stage is pinned');
  assert.ok(middle.claimTop<initial.claimTop-height*.06,'Claim moves up too');assert.equal(middle.arrowVisibility,'hidden');
  assert.equal(middle.claimOpacity,1,'Claim remains readable during explosion');
  assert.ok(middle.heroTop-middle.scroll>=height,'No product text among letters');
  assert.ok(Math.abs(middle.heroTop-initial.heroTop)<1,'No hero layout shift');
  assert.ok(Math.abs(middle.productTop-initial.productTop)<1,'No product layout shift');
  assert.equal(middle.overflow,false);
  if(width<500)for(const letter of middle.letters)assert.ok(letter.left>=0&&letter.right<=width,'Mobile explosion stays within viewport');
  await screenshot(`signature-middle-${theme}-${width}`);
  await evaluate('document.getElementById("hero").scrollIntoView({behavior:"instant"})');await delay(1000);
  const after=await signatureState();assert.equal(after.wordOpacity,0);assert.equal(after.headerVisibility,'visible');
  assert.equal(after.burgerVisibility,width<=768?'visible':'hidden','Desktop handoff / mobile burger');
  await screenshot(`signature-after-${theme}-${width}`);
  await evaluate('scrollTo({top:0,behavior:"instant"})');await delay(100);
  const restored=await signatureState();assert.deepEqual(restored.letters,initial.letters,'Exact reverse on upward scroll');
  await evaluate('document.querySelector(".intro-arrow").click()');await delay(500);
  assert.equal(await evaluate('location.hash'),'#hero','Intro arrow leads to product hero');
  // Reveal hysteresis and fast jumps in both directions, including tall cards.
  await evaluate('document.getElementById("security-check").scrollIntoView({behavior:"instant",block:"center"})');await delay(1000);
  assert.equal(await evaluate('document.getElementById("security-check").classList.contains("is-revealed")'),true);
  const cardY=await evaluate('document.getElementById("security-check").getBoundingClientRect().top+scrollY');
  await evaluate('scrollTo({top:0,behavior:"instant"})');await delay(800);
  assert.equal(await evaluate('document.getElementById("security-check").classList.contains("is-revealed")'),false,'Offscreen card resets');
  await evaluate(`scrollTo({top:${cardY},behavior:"instant"})`);await delay(1000);
  assert.equal(await evaluate('document.getElementById("security-check").classList.contains("is-revealed")'),true,'Card re-enters');
  const cardHeight=await evaluate('document.getElementById("security-check").offsetHeight');
  for(const offset of [cardHeight*.8,cardHeight*.85,cardHeight*.8,cardHeight*.85]){
    await evaluate(`scrollTo({top:${cardY+offset},behavior:"instant"})`);await delay(70);
    assert.equal(await evaluate('document.getElementById("security-check").classList.contains("is-revealed")'),true,'Visible card never flickers near upper edge');
  }
  // Sample actual gradual scrolling in both directions; assert visible cards stay present.
  if(theme==='dark' && [1440,375,430].includes(width)) {
    for(const direction of [1,-1]) {
      for(let step=0;step<=16;step++) {
        const fraction=direction===1?step/16:1-step/16;
        const top=cardY-height*.8+fraction*(cardHeight+height*.5);
        await evaluate(`scrollTo({top:${top},behavior:'instant'})`);await delay(65);
        const state=await evaluate('(()=>{const e=document.getElementById("security-check"),r=e.getBoundingClientRect();return {visible:Math.min(r.bottom,innerHeight)-Math.max(r.top,0),revealed:e.classList.contains("is-revealed")};})()');
        if(state.visible>height*.25) assert.equal(state.revealed,true,'Gradual scroll keeps readable card revealed');
      }
    }
  }
  const geometry=[];
  for(const selector of ['#security-check','#datenschutz-care','#incident-readiness','#ueber','#learn','#kontakt']){
   await evaluate(`document.querySelector('${selector}').scrollIntoView({behavior:'instant',block:'start'})`);await delay(1000);
   const g=await evaluate(`(()=>{const el=document.querySelector('${selector}'),r=el.getBoundingClientRect();return {selector:'${selector}',width:r.width,height:r.height,overflow:document.documentElement.scrollWidth>innerWidth,oversized:[...el.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left< -1).map(e=>e.className),opacity:getComputedStyle(el).opacity,ctaHeight:el.querySelector('.btn')?.getBoundingClientRect().height};})()`);
   assert.equal(g.overflow,false,JSON.stringify(g));assert.deepEqual(g.oversized,[],JSON.stringify(g));assert.ok(Number(g.opacity)>.9);if(g.ctaHeight)assert.ok(g.ctaHeight>=44);geometry.push(g);
   await screenshot(`${selector.slice(1)}-${theme}-${width}`);
  }
  if(width<=768){
   await evaluate('document.getElementById("hero").scrollIntoView({behavior:"instant"});document.getElementById("menuToggle").click()');await delay(220);
   assert.equal(await evaluate('document.getElementById("menuToggle").getAttribute("aria-expanded")'),'true');
   await screenshot(`menu-${theme}-${width}`);
   await evaluate("document.querySelector('#primaryNav a').click()");await delay(500);
   assert.equal(await evaluate('document.getElementById("menuToggle").getAttribute("aria-expanded")'),'false');
  }
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
  await evaluate('document.querySelector(".product-card .btn").focus()');
  assert.notEqual(await evaluate('getComputedStyle(document.activeElement).outlineStyle'),'none');
  results.push({theme,width,geometry});
 }
 // Resizing with an open modal preserves the page and returns focus to visible navigation.
 await call('Emulation.setDeviceMetricsOverride',{width:375,height:844,deviceScaleFactor:1,mobile:false});
 await call('Page.navigate',{url:'http://127.0.0.1:4181/'});await delay(500);
 await evaluate('document.getElementById("hero").scrollIntoView({behavior:"instant"})');await delay(500);
 const savedMenuY=await evaluate('scrollY');
 await evaluate('document.getElementById("menuToggle").click()');await delay(300);
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await delay(200);
 await evaluate('document.querySelector(".menu-close").click()');await delay(500);
 assert.equal(await evaluate('scrollY'),savedMenuY,'Resize keeps scroll restoration');
 assert.equal(await evaluate('document.activeElement.closest("nav")?.id'),'primaryNav','Focus returns to visible desktop navigation');
 await evaluate('scrollTo({top:0,behavior:"instant"})');await delay(500);
 assert.equal(await evaluate('document.querySelector(".intro-wordmark").style.translate'),'0px','Intro measurements remain correct after modal resize');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".site-header")).visibility'),'hidden');
 await call('Emulation.setDeviceMetricsOverride',{width:375,height:844,deviceScaleFactor:1,mobile:false});await delay(300);
 await evaluate('document.getElementById("menuToggle").click()');await delay(300);
 assert.equal(await evaluate('document.getElementById("navigationDialog").matches(":modal")'),true,'Menu opens again after resize');
 await evaluate('document.querySelector(".menu-close").click()');await delay(300);
 const links=await evaluate('[...new Set([...document.querySelectorAll("a[href]")].map(a=>a.href).filter(u=>u.startsWith(location.origin)&&!u.includes("#")))]');
 for(const link of links)assert.equal((await fetch(link)).status,200,link);
 await call('Page.reload');await delay(350);assert.equal(await evaluate('document.documentElement.dataset.theme'),'light','Saved theme persists');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".product-card")).transitionDuration'),'0s');
 await evaluate('scrollTo({top:document.querySelector(".intro-stage").offsetHeight*.3,behavior:"instant"})');await delay(100);
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".intro-letter")).opacity'),'1');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".intro-letter")).transform'),'none');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".intro-wordmark")).opacity'),'1');
 await screenshot('signature-reduced-motion');
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await delay(100);
 assert.ok(Number(await evaluate('getComputedStyle(document.querySelector(".intro-letter")).opacity'))<1,'Live preference change');
 await call('Emulation.setScriptExecutionDisabled',{value:true});await call('Page.reload');await delay(350);
 await screenshot('no-js-mobile');
 await call('Emulation.setScriptExecutionDisabled',{value:false});
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".product-card")).opacity'),'1','Content without JS');
 assert.equal(await evaluate('[...document.querySelectorAll("#primaryNav a")].every(a=>{const r=a.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0})'),true,'No-JS navigation stays inside viewport');
 assert.equal(await evaluate('getComputedStyle(document.querySelector(".intro-letter")).opacity'),'1','Wordmark without JS');
 assert.deepEqual(errors,[],'No browser exceptions');assert.deepEqual(badResponses,[],'No missing local assets');
 await fs.writeFile(path.join(folder,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({folder,viewports:results.length,errors:errors.length,checks:'upward intro motion, explosion, reverse, burger handoff, modal inertness/scroll lock/Tab/Escape, reversible reveal/hysteresis/fast scroll, no layout shift/overflow, links, saved themes, reduced motion, no JS, local requests'}));
}finally{socket?.close();browser.kill();server.close();}


