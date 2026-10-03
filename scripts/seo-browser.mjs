// Small CDP harness for additional SEO checks and offline asset preparation.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {previewServer} from './preview.mjs';
export const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export async function openBrowser(port=4185,debugPort=9345){
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'swissploit-seo-'));
 const server=previewServer(process.cwd(),port);
 const browser=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${path.join(folder,'profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let socket,seq=0;const pending=new Map(),errors=[],badResponses=[];
 const close=()=>{socket?.close();browser.kill();server.close();for(const p of pending.values())clearTimeout(p.timer);};
 try{
  let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break;}catch{await delay(200);}}
  if(!tabs)throw Error('Chrome unavailable');
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true});});
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&m.params.response.url.startsWith(`http://127.0.0.1:${port}`))badResponses.push(m.params.response.url);});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
  return {call,evaluate,close,folder,errors,badResponses,origin:`http://127.0.0.1:${port}`};
 }catch(e){close();throw e;}
}
