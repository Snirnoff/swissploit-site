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
 for(const width of [1920,1440,1024,768,375])for(const theme of ['dark','light']){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  for(const page of ['learn/','blog/passwoerter-passwortmanager/','']){
   await call('Page.navigate',{url:'http://127.0.0.1:4181/'+page});await delay(450);
   await evaluate('document.fonts.ready');
   await evaluate('document.documentElement.dataset.theme="'+theme+'"');await delay(350);
   const expected=['Services','Über Swissploit','Kontakt','Learn'];
   assert.deepEqual(await evaluate('[...document.querySelectorAll("#primaryNav a")].map(a=>a.textContent.trim())'),expected);
   assert.deepEqual(await evaluate('[...document.querySelectorAll(".foot-nav a")].map(a=>a.textContent.trim())'),expected);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
   if(page==='learn/'){
    const search=await evaluate('(()=>{const e=document.getElementById("blogSearch"),r=e.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,label:!!document.querySelector("label[for=blogSearch]"),active:document.querySelector("#primaryNav .nav-learn").getAttribute("aria-current")}})()');
    assert.ok(search.width>= (width>1000?650:width*.8),JSON.stringify(search));
    assert.ok(search.width<=850&&search.right<=width&&search.left>=0);assert.ok(search.height<=62);assert.ok(search.label);assert.equal(search.active,'page');
    await evaluate('document.getElementById("blogSearch").value="passwort";document.getElementById("blogSearch").dispatchEvent(new Event("input"))');await delay(200);
    assert.ok(await evaluate('[...document.querySelectorAll("#blogGrid .blog-card")].some(e=>e.getBoundingClientRect().height>0&&e.textContent.toLowerCase().includes("passwort"))'));
    await evaluate('document.getElementById("blogSearch").value="";document.getElementById("blogSearch").dispatchEvent(new Event("input"))');
    await screenshot('search-'+theme+'-'+width);results.push({theme,width,search});
   }else if(page){
    await evaluate('document.querySelector(".post-inline-short").scrollIntoView({behavior:"instant",block:"center"})');await delay(600);
    const video=await evaluate('(()=>{const v=document.querySelector(".post-inline-short iframe"),r=v.getBoundingClientRect();return {src:v.src,title:v.title,lazy:v.loading,width:r.width,height:r.height,left:r.left,right:r.right,count:document.querySelectorAll("iframe[src*=ndOP_bDpEvQ]").length}})()');
    assert.equal(video.count,1);assert.ok(video.src.endsWith('/embed/ndOP_bDpEvQ'));assert.equal(video.lazy,'lazy');assert.ok(video.title.includes('Passwortmanager'));
    assert.ok(Math.abs(video.width/video.height-9/16)<.01,JSON.stringify(video));assert.ok(video.width<=420&&video.right<=width&&video.left>=0);
    if(width>1000)assert.ok(video.width>=320);
    await screenshot('short-'+theme+'-'+width);
   }else{
    await evaluate('scrollTo({top:0,behavior:"instant"});document.getElementById("menuToggle").click()');await delay(650);
    assert.equal(await evaluate('document.getElementById("navigationDialog").matches(":modal")'),true);
    assert.equal(await evaluate('document.querySelector("#primaryNav a:last-child").classList.contains("nav-learn")'),true);
    await screenshot('overlay-'+theme+'-'+width);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(300);
    assert.equal(await evaluate('document.activeElement.id'),'menuToggle');
    await evaluate('document.getElementById("hero").scrollIntoView({behavior:"instant"})');await delay(950);
    const controls=await evaluate('(()=>{const links=[...document.querySelectorAll("#primaryNav a")],b=document.querySelector(".header-cta").getBoundingClientRect();return links.map(a=>{const r=a.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,ctaLeft:b.left}})})()');
    if(width>768)for(const link of controls){assert.ok(link.left>=0&&link.right<width&&link.right<=link.ctaLeft,JSON.stringify(controls));}
    await screenshot('header-'+theme+'-'+width);
   }
  }
 }
 assert.deepEqual(errors,[],'No browser exceptions');assert.deepEqual(badResponses,[],'No missing local assets');
 console.log(JSON.stringify({folder,cases:30,errors:errors.length,checks:'navigation order, modal focus/Escape, search width/function, responsive short, header geometry, themes'}));
}finally{socket?.close();browser.kill();server.close();}
