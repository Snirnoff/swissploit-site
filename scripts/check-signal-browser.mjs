// Regression checks for the single hero: real canvas output, input, reversal and idle cost.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {openBrowser, delay} from './seo-browser.mjs';

export async function checkSignal(browser, width, theme = 'dark', height = width < 500 ? 844 : 900) {
  const {call,evaluate,origin,folder} = browser;
  // Pixel comparisons must use the same raster backend before/after readback.
  const injection = await call('Page.addScriptToEvaluateOnNewDocument',{source: `const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,options){return getContext.call(this,type,type==='2d'?{...options,willReadFrequently:true}:options);};`});
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:origin+'/'}); await delay(350);
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
  await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme));
  await evaluate('Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,1500))])');
  await delay(120);
  const state = () => evaluate(`(() => {
    const c=document.querySelector('.intro-particles'),ctx=c.getContext('2d'),data=ctx.getImageData(0,0,c.width,c.height).data;
    window.heroPixels ||= data;
    let painted=0,hash=0,difference=0,total=0,logoTop=c.height,logoBottom=0; for(let i=3;i<data.length;i+=4){if(data[i]){painted++;const row=Math.floor(i/4/c.width);logoTop=Math.min(logoTop,row);logoBottom=Math.max(logoBottom,row);}hash=(Math.imul(hash,31)+data[i])|0;difference+=Math.abs(data[i]-heroPixels[i]);total+=heroPixels[i];}
    return {painted,hash,logoTop,logoBottom,wordTop:document.querySelector('.intro-wordmark').getBoundingClientRect().top,
      arrowBottom:document.querySelector('.intro-arrow').getBoundingClientRect().bottom,
      order:[...document.querySelector('main').children].slice(0,3).map(e=>e.id),
      difference:difference/total,letters:[...document.querySelectorAll('.intro-letter')].map(e=>({transform:e.style.transform,opacity:e.style.opacity})),
      overflow:document.documentElement.scrollWidth>innerWidth,first:document.getElementById('intro').nextElementSibling.id,
      introHeight:document.getElementById('intro').offsetHeight,position:getComputedStyle(document.querySelector('.intro-stage')).position,
      servicesTop:document.getElementById('services').offsetTop,canvasWidth:c.width,
      old:!!document.querySelector('.signal-transition,.signet-transition,.signet-flight')};
  })()`);
  const shot = async suffix => {
    const result=await call('Page.captureScreenshot',{format:'png'});
    await fs.writeFile(path.join(folder,'hero-'+theme+'-'+width+'-'+suffix+'.png'),Buffer.from(result.data,'base64'));
  };
  const seek = async (fraction,wait=450) => {await evaluate('scrollTo({top:'+height*fraction+',behavior:"instant"})');await delay(wait);};
  const initial = await state();
  assert.ok(initial.painted>150,'Original signet is painted');
  assert.equal(initial.first,'hero'); assert.equal(initial.old,false);
  assert.deepEqual(initial.order,['intro','hero','services']);
  assert.ok(initial.logoTop>=16 && initial.arrowBottom<=height-12,'Whole composition fits');
  assert.ok(initial.wordTop-initial.logoBottom>=20 && initial.wordTop-initial.logoBottom<=50,'Logo sits 20-50px above wordmark');
  assert.equal(initial.position,'relative'); assert.ok(initial.introHeight<=height+1,'One viewport, no spacer');
  assert.equal(initial.overflow,false); await shot('rest');
  const points = {x:width/2,y:(initial.logoTop+initial.logoBottom)/2};
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...points}); await delay(350);
  assert.ok((await state()).difference>.03,'Mouse repels painted particles');
  for(const offset of [-60,60,-40,40,0]) {await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:points.x+offset,y:points.y});await delay(20);}
  await evaluate("document.querySelector('.intro-stage').dispatchEvent(new PointerEvent('pointerleave'))");
  for(let attempt=0;attempt<30;attempt++){await delay(100);if((await state()).difference<.02)break;}
  assert.ok((await state()).difference<.02,'Spring returns to original silhouette (allow raster rounding)');

  // Observe draw work without adding production telemetry.
  await evaluate(`window.heroDraws=0; window.heroDots=0;
    const proto=CanvasRenderingContext2D.prototype;
    const clear=proto.clearRect,arc=proto.arc,fill=proto.fillRect;
    proto.clearRect=function(...a){if(this.canvas.classList.contains('intro-particles')){window.heroDraws++;window.heroDots=0;}return clear.apply(this,a)};
    proto.arc=function(...a){if(this.canvas.classList.contains('intro-particles'))window.heroDots++;return arc.apply(this,a)};
    proto.fillRect=function(...a){if(this.canvas.classList.contains('intro-particles'))window.heroDots++;return fill.apply(this,a)};
    dispatchEvent(new Event('pageshow'));`);
  await delay(100);
  assert.equal(await evaluate('heroDots'),width<=760 || height<=560 ? 250 : 660);
  const idle=await evaluate('heroDraws');await delay(250);assert.equal(await evaluate('heroDraws'),idle,'No idle canvas loop');
  for(let i=1;i<=16;i++){
    await seek(i/20,35);
    const s=await state();assert.equal(s.overflow,false);assert.equal(s.servicesTop,initial.servicesTop,'No layout shift');
  }
  await seek(.35); const middle=await state();
  assert.notDeepEqual(middle.letters,initial.letters);
  assert.equal(new Set(middle.letters.map(l=>l.transform)).size,10,'Individual trajectories');
  await shot('flight');
  await seek(.7); await shot('handoff');
  await seek(.35); assert.deepEqual((await state()).letters,middle.letters,'Stable reverse after momentum settles');
  await seek(0);assert.ok((await state()).difference<.02);
  await evaluate('document.getElementById("kontakt").scrollIntoView({behavior:"instant"})');await delay(200);
  const outside=await evaluate('heroDraws');await delay(300);assert.equal(await evaluate('heroDraws'),outside,'Offscreen canvas paused');
  await seek(0);
  assert.ok((await state()).difference<.02,'Fast reverse restores shape');
  await evaluate('document.getElementById("security-check").scrollIntoView({block:"center",behavior:"instant"})');await delay(800);
  const risk=await evaluate(`({count:document.querySelectorAll('#security-check li').length,links:document.querySelectorAll('#security-check li a').length,
    moving:[...document.querySelectorAll('#security-check svg,#security-check svg *')].some(e=>getComputedStyle(e).animationName!=='none'),
    reveal:document.getElementById('security-check').classList.contains('is-revealed')})`);
  assert.equal(risk.count,8);assert.equal(risk.links,0);assert.equal(risk.moving,true);assert.equal(risk.reveal,true);
  await evaluate('document.querySelector(".motif-scanner").scrollIntoView({block:"center",behavior:"instant"})');await delay(200);
  const scan=()=>evaluate('getComputedStyle(document.querySelector(".scan-beam")).transform');
  const scanStart=await scan();await delay(400);assert.notEqual(await scan(),scanStart,'Only the scanner component moves');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".motif-scanner")).transform'),'none');
  await seek(0,800);assert.equal(await evaluate('document.getElementById("security-check").classList.contains("is-revealed")'),false);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(120);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".scan-beam")).animationName'),'none');
  const still=await state();
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:points.x+20,y:points.y});await delay(200);
  assert.equal((await state()).hash,still.hash,'Reduced motion disables repulsion');
  await seek(.3);assert.ok((await state()).letters.every(l=>l.transform==='none'));
  await shot('reduced');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await seek(0);await evaluate("document.querySelector('.intro-stage').dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:innerWidth/2,clientY:400}))");
  await delay(150);assert.ok((await state()).difference<.02,'Touch does not repel');
  console.log('Hero '+width+'px '+theme+': input, spring, slow/fast/reverse, idle/offscreen, reduced, touch, layout and checklist OK');
}

export async function checkLearn(browser) {
  const {call,evaluate,origin}=browser;
  for(const route of ['/learn/','/en/learn/']){
    await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    await call('Page.navigate',{url:origin+route});await delay(200);
    assert.equal(await evaluate('document.querySelectorAll("#videoGrid iframe,#videoGrid img[src]").length'),0,'Hidden grid loads no media');
    await evaluate('document.querySelector("[data-learn-filter=video]").click();document.getElementById("videoGrid").scrollIntoView({behavior:"instant"})');await delay(250);
    const count=await evaluate('document.querySelectorAll("#videoGrid img[src]").length');
    assert.ok(count>0 && count<15,'Only nearby thumbnails load');
    assert.ok(await evaluate('document.querySelectorAll("#videoGrid img[fetchpriority=high]").length<=6'));
    assert.equal(await evaluate('document.querySelectorAll("#videoGrid iframe").length'),0);
    const before=await evaluate('document.querySelector(".learn-short-preview").offsetHeight');
    await evaluate('document.querySelector(".learn-video-play").focus()');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await delay(100);
    assert.equal(await evaluate('document.querySelectorAll("#videoGrid iframe").length'),1,'Keyboard click creates one player');
    assert.equal(await evaluate('document.querySelector(".learn-short-preview").offsetHeight'),before,'Player causes no layout shift');
    await evaluate('document.querySelector("#videoGrid article:last-child").scrollIntoView({behavior:"instant"})');await delay(200);
    assert.equal(await evaluate('document.querySelector("#videoGrid article:last-child img").hasAttribute("src")'),true);
    await evaluate('document.querySelector("[data-learn-filter=all]").click()');
    assert.equal(await evaluate('document.querySelectorAll("#videoGrid iframe").length'),0,'Hidden players are stopped');
    console.log('Learn '+route+': progressive thumbnails, interaction-only player, keyboard and stable layout OK');
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const browser=await openBrowser(4187,9347);
  try{
    await browser.call('Network.setBlockedURLs',{urls:['*fonts.googleapis.com*','*fonts.gstatic.com*','*youtube.com*','*youtube-nocookie.com*','*i.ytimg.com*']});
    for(const width of [320,375,768,1440])for(const theme of ['dark','light'])await checkSignal(browser,width,theme);
    for(const [width,height] of [[1366,768],[2560,1440],[844,390]])await checkSignal(browser,width,'dark',height);
    await checkLearn(browser);
    assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.badResponses,[]);
    console.log(JSON.stringify({folder:browser.folder,errors:0}));
  }finally{browser.close();}
}

