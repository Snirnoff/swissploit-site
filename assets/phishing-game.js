import { Ocean } from './phishing-art.js';

const LEVELS = [
  { name: 'DOMAIN REEF', question: 'Welchem Link würdest du vertrauen?', hint: 'Schwimm zu einem Link. Oder wähle ihn direkt aus.', options: ['microsoft-login-security.example.com', 'login.microsoftonline.com', 'login.microsoftonline.security-check.example.com'], correct: 1 },
  { name: 'CONTEXT CURRENT', question: 'Zeitdruck. Oder kurz nachdenken?', hint: 'Welchem Impuls folgst du?', options: ['DRINGEND: Dein Passwort läuft gleich ab.', 'Habe ich diese Aktion überhaupt erwartet?'], correct: 1 },
  { name: 'REPORT NET', question: 'Verdächtige Nachricht entdeckt. Was jetzt?', hint: 'Finde den Weg durch das Netz.', options: ['IGNORIEREN', 'WEITERLEITEN', 'MELDEN'], correct: 2 }
];
const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
let activeGame = null;
let stylesheet;
function loadStyles() {
  if (!stylesheet) stylesheet = new Promise((resolve,reject) => {
    const link = document.createElement('link');
    link.rel='stylesheet';link.href='/assets/phishing-game.css';
    link.onload=resolve;link.onerror=()=>{link.remove();stylesheet=null;reject(new Error('Game stylesheet unavailable'));};
    document.head.append(link);
  });
  return stylesheet;
}
export async function startGame(trigger) {
  if (activeGame) return;
  if (!HTMLDialogElement.prototype.showModal) throw new Error('Dialog unavailable');
  await loadStyles();
  if (activeGame) return;
  const game=new PhishEscape(trigger);
  activeGame=game;
  try {game.start();} catch(error) {game.close(false,true);throw error;}
}

class PhishEscape {
  constructor(trigger) {
    this.trigger=trigger;this.events=new AbortController();this.reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced=this.reducedQuery.matches;this.phase='intro';this.level=0;this.elapsed=0;this.time=0;
    this.fish={x:.18,y:.57,vx:0,vy:0,angle:0,facing:1};this.target={x:.18,y:.57};
    this.keys=new Set();this.targets=[];this.selected=null;this.pendingChoice=null;this.hover=-1;this.dwell=0;
    this.camera=0;this.ascent=0;this.netOpen=0;this.netGoal=0;this.paused=false;this.frame=0;this.lastTime=0;
    this.dialog=document.createElement('dialog');
    this.dialog.className='phish-game';this.dialog.setAttribute('aria-label','PHISH ESCAPE – interaktive Phishing-Challenge');
    this.dialog.innerHTML=`
      <canvas class="phish-canvas" aria-hidden="true"></canvas>
      <div class="phish-surface" aria-hidden="true"></div>
      <header class="phish-bar">
        <span class="phish-wordmark">PHISH <b>ESCAPE.</b><span>BY SWISSPLOIT</span></span>
        <div class="phish-bar-actions"><button type="button" class="phish-pause" aria-label="Animation pausieren" aria-pressed="false">Pause</button><button type="button" class="phish-exit">Überspringen <span aria-hidden="true">↗</span></button></div>
      </header>
      <ol class="phish-progress" aria-label="Die drei Checks"><li aria-current="step"><span>01</span> DOMAIN</li><li><span>02</span> KONTEXT</li><li><span>03</span> MELDEN</li></ol>
      <div class="phish-content"></div>
      <footer class="phish-controls"><span class="phish-control-hint">Maus bewegen · Pfeiltasten / WASD · oder direkt auswählen</span><span>KEIN ZEITDRUCK.</span></footer>
      <p class="phish-sr" role="status" aria-live="polite" aria-atomic="true"></p>
      <div class="phish-paused" hidden><p>Eine kleine Atempause.</p><button type="button" class="phish-next">Weiterschwimmen →</button></div>`;
    this.canvas=this.dialog.querySelector('canvas');this.content=this.dialog.querySelector('.phish-content');
    this.live=this.dialog.querySelector('[role="status"]');
  }
  on(target,name,handler,options={}) {target.addEventListener(name,handler,{...options,signal:this.events.signal});}
  start() {
    document.body.append(this.dialog);
    this.scrollY=window.scrollY;
    // Fixed body also prevents rubber-band page scrolling on iOS; restored on every exit.
    this.oldBodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width,overflow:document.body.style.overflow};
    Object.assign(document.body.style,{position:'fixed',top:`-${this.scrollY}px`,width:'100%',overflow:'hidden'});
    document.documentElement.classList.add('phish-playing');
    this.dialog.showModal();
    this.ocean=new Ocean(this.canvas);
    this.content.innerHTML='<div class="phish-intro"><p class="phish-eyebrow">EIN KLEINER PERSPEKTIVENWECHSEL</p><h1 tabindex="-1">PHISHED.</h1><p>Du hast angebissen.</p><span>Finde den sicheren Weg zurück.</span></div>';
    this.content.querySelector('h1').focus();
    if(matchMedia('(pointer: coarse)').matches) this.dialog.querySelector('.phish-control-hint').textContent='Finger bewegen · oder einen Weg antippen';
    this.on(this.dialog.querySelector('.phish-exit'),'click',()=>this.close(false));
    this.on(this.dialog,'cancel',event=>{event.preventDefault();this.close(false,true);});
    this.on(this.dialog.querySelector('.phish-pause'),'click',()=>this.togglePause());
    this.on(this.dialog.querySelector('.phish-paused button'),'click',()=>this.togglePause());
    this.on(this.dialog,'pointermove',event=>this.pointer(event));
    this.on(this.dialog,'pointerdown',event=>{
      if(event.target.closest('button')) return;
      this.pointer(event);
      if(event.pointerType==='touch') this.canvas.setPointerCapture(event.pointerId);
    });
    this.on(this.dialog,'pointerup',()=>{this.pointerActive=false;});
    this.on(this.dialog,'pointercancel',()=>{this.pointerActive=false;this.hover=-1;this.dwell=0;});
    this.on(this.dialog,'pointerleave',()=>{this.pointerActive=false;this.hover=-1;this.dwell=0;});
    this.on(this.dialog,'keydown',event=>this.keydown(event));
    this.on(this.dialog,'keyup',event=>this.keys.delete(event.key.toLowerCase()));
    this.on(window,'blur',()=>{this.keys.clear();this.pointerActive=false;});
    this.on(document,'visibilitychange',()=>{this.keys.clear();this.lastTime=0;this.schedule();});
    this.on(window,'pagehide',()=>this.close(false,true,true));
    this.on(this.reducedQuery,'change',()=>{
      this.reduced=this.reducedQuery.matches;this.keys.clear();this.lastTime=0;
      this.dialog.classList.toggle('phish-reduced',this.reduced);this.schedule();
    });
    this.resizeObserver=new ResizeObserver(()=>{
      this.ocean.resize();this.measureTargets();this.draw(0);this.schedule();
    });
    this.resizeObserver.observe(this.canvas);
    this.dialog.classList.toggle('phish-reduced',this.reduced);
    this.schedule();
  }
  setPhase(phase) {
    this.phase=phase;this.elapsed=0;this.dialog.dataset.phase=phase;
    this.pointerActive=false;this.keys.clear();this.hover=-1;this.dwell=0;this.pendingChoice=null;
  }
  showLevel(index) {
    this.level=index;this.setPhase('choice');this.camera=index*90;this.selected=null;
    const level=LEVELS[index];
    this.content.innerHTML=`<div class="phish-question"><p class="phish-eyebrow">${level.name}</p><h2 tabindex="-1">${level.question}</h2><p>${level.hint}</p></div><div class="phish-choices" role="group" aria-label="${level.question}"></div>`;
    const choices=this.content.querySelector('.phish-choices');
    level.options.forEach((label,i)=>{
      const button=document.createElement('button');
      button.type='button';button.className='phish-choice';button.dataset.choice=i;
      const number=document.createElement('span');number.className='phish-choice-number';number.textContent=String(i+1).padStart(2,'0');number.setAttribute('aria-hidden','true');
      const text=document.createElement(index===0?'code':'span');text.className='phish-choice-text';
      // Equal treatment of every URL; no segmentation or solution hint before the decision.
      text.textContent=label;
      const arrow=document.createElement('span');arrow.className='phish-choice-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');
      button.append(number,text,arrow);choices.append(button);
      this.on(button,'click',()=>this.swimTo(i));
    });
    this.content.querySelector('h2').focus({preventScroll:true});
    this.target={x:.18,y:matchMedia('(max-width: 600px)').matches ? .37 : .56};
    this.on(choices,'animationend',()=>this.measureTargets());
    this.measureTargets();this.updateProgress();this.schedule();
  }
  measureTargets() {
    if(this.phase!=='choice') {this.targets=[];return;}
    const bounds=this.canvas.getBoundingClientRect();
    this.targets=[...this.content.querySelectorAll('.phish-choice')].map(button=>{
      const r=button.getBoundingClientRect();
      return {button,x:(r.left-bounds.left+8)/bounds.width,y:(r.top-bounds.top+r.height/2)/bounds.height,left:(r.left-bounds.left)/bounds.width,right:(r.right-bounds.left)/bounds.width,top:(r.top-bounds.top)/bounds.height,bottom:(r.bottom-bounds.top)/bounds.height};
    });
  }
  updateProgress() {
    this.dialog.querySelectorAll('.phish-progress li').forEach((li,i)=>{
      const done=i<this.level || ['escape','surface'].includes(this.phase) || (i===this.level&&this.phase==='feedback'&&(this.level!==2||this.selected===LEVELS[2].correct));
      li.classList.toggle('is-done',done);
      if(i===this.level)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
      li.querySelector('span').textContent=done?'✓':String(i+1).padStart(2,'0');
    });
  }
  pointer(event) {
    if(this.phase!=='choice'||this.pendingChoice!==null||this.paused) return;
    if(event.pointerType==='touch'&&event.type==='pointermove'&&event.buttons===0) return;
    const bounds=this.canvas.getBoundingClientRect();
    this.target={x:clamp((event.clientX-bounds.left)/bounds.width,.04,.96),y:clamp((event.clientY-bounds.top)/bounds.height,.16,.9)};
    this.pointerActive=true;this.schedule();
  }
  keydown(event) {
    if(event.ctrlKey||event.metaKey||event.altKey||this.phase!=='choice'||this.paused) return;
    const key=event.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){
      event.preventDefault();this.keys.add(key);this.pointerActive=false;this.schedule();
    }
  }
  swimTo(index) {
    if(this.phase!=='choice'||this.pendingChoice!==null||this.paused) return;
    this.pendingChoice=index;this.elapsed=0;this.keys.clear();this.pointerActive=false;
    this.target={x:this.targets[index].x,y:this.targets[index].y};
    this.targets.forEach((target,i)=>{target.button.setAttribute('aria-disabled','true');target.button.classList.toggle('is-target',i===index);});
    this.live.textContent='Dein Fisch schwimmt zum gewählten Weg.';
    this.schedule();
  }
  choose(index) {
    const correct=index===LEVELS[this.level].correct;
    this.selected=index;this.setPhase('feedback');
    this.target={x:correct ? .32 : .17,y:.72};this.targets=[];
    if(!correct&&!this.reduced) {this.fish.vx=-.28;this.fish.angle=-.12;}
    if(this.level===0) this.domainReveal(index,correct);
    else if(this.level===1) this.feedback('CHECK 2 ✓',correct?'Kontext prüfen.':'Kurz innehalten.',correct?'Unerwartete Nachrichten verdienen einen zweiten Blick.':'Zeitdruck soll dich zum schnellen Handeln bewegen. Habe ich diese Aktion überhaupt erwartet?','Unerwartete Nachrichten verdienen einen zweiten Blick.','Weiter zum Netz →',()=>this.showLevel(2));
    else if(correct) {
      this.netGoal=1;
      this.feedback('CHECK 3 ✓','Im Zweifel melden.','Melde die Nachricht über den vorgesehenen Meldeweg oder direkt deiner IT.','So kann deine IT prüfen und andere warnen.','Zur Oberfläche →',()=>this.escape());
    } else {
      this.feedback('EIN SICHERER AUSWEG','Mach deine IT aufmerksam.',index===0?'Ignorieren schützt andere noch nicht. Deine Meldung hilft, die Nachricht zu prüfen.':'Leite die Nachricht nicht ungezielt an andere weiter. Nutze den vorgesehenen Meldeweg zu deiner IT.','Im Zweifel melden.','Melden & freischwimmen →',()=>{this.netGoal=1;this.escape();});
    }
    this.updateProgress();this.content.querySelector('h2').focus({preventScroll:true});this.schedule();
  }
  domainReveal(index,correct) {
    const hostname=correct?LEVELS[0].options[2]:LEVELS[0].options[index];
    const parts=hostname.split('.');
    const domain=parts.splice(-2).join('.');
    this.content.innerHTML=`<div class="phish-feedback phish-xray">
      <p class="phish-eyebrow">DOMAIN X-RAY · CHECK 1 ✓</p>
      <h2 tabindex="-1">${correct?'Gut hingeschaut.':'Fast angebissen.'}</h2>
      <p class="phish-xray-intro">${correct?'login.microsoftonline.com ist hier die Microsoft-Anmeldeadresse. Und so erkennst du den Köder:':'Schauen wir unter die Oberfläche dieses Links.'}</p>
      <div class="phish-url" aria-label="${hostname}. Die entscheidende Domain ist ${domain}."><div class="phish-url-parts" aria-hidden="true"></div><span class="phish-domain-focus" aria-hidden="true">${domain}</span><span class="phish-scan" aria-hidden="true"></span></div>
      <p class="phish-xray-label">DIE TATSÄCHLICHE DOMAIN</p>
      <p>Der Name „Microsoft“ irgendwo in einem Link macht ihn nicht vertrauenswürdig. <strong>Entscheidend ist die tatsächliche Domain.</strong></p>
      <p class="phish-domain-tip">Tipp: Lies Domains von rechts nach links.<br><span>Alles davor kann als Subdomain frei gewählt werden – vom Betreiber dieser Domain.</span></p>
      <button type="button" class="phish-next">Weiter durch das Riff <span aria-hidden="true">→</span></button>
    </div>`;
    const container=this.content.querySelector('.phish-url-parts');
    parts.forEach((part,i)=>{
      const span=document.createElement('span');span.className='phish-subdomain';span.textContent=part+'.';span.style.setProperty('--part',i);container.append(span);
    });
    const actual=document.createElement('strong');actual.textContent=domain;container.append(actual);
    this.on(this.content.querySelector('button'),'click',()=>this.showLevel(1));
  }
  feedback(eyebrow,title,description,note,next,action) {
    this.content.innerHTML=`<div class="phish-feedback"><span class="phish-check-seal" aria-hidden="true">✓</span><p class="phish-eyebrow">${eyebrow}</p><h2 tabindex="-1">${title}</h2><p>${description}</p>${description===note?'':`<p class="phish-feedback-note">${note}</p>`}<button type="button" class="phish-next">${next}</button></div>`;
    this.on(this.content.querySelector('button'),'click',action);
  }
  escape() {
    this.setPhase('escape');this.netGoal=1;this.updateProgress();
    this.content.innerHTML='<div class="phish-intro phish-escape"><p class="phish-eyebrow">STOP · CHECK · REPORT</p><h2 tabindex="-1">Der Weg ist frei.</h2><p>Ein paar Sekunden machen den Unterschied.</p></div>';
    this.content.querySelector('h2').focus({preventScroll:true});
    this.target={x:.5,y:.08};this.schedule();
  }
  surface() {
    this.setPhase('surface');
    document.getElementById('simulation-result-title').textContent='Wieder frei.';
    Object.assign(document.body.style,this.oldBodyStyle);
    document.documentElement.classList.remove('phish-playing');
    document.getElementById('simulation-takeaways').scrollIntoView({behavior:'instant',block:'start'});
    this.dialog.classList.add('is-surfacing');
  }
  togglePause() {
    this.paused=!this.paused;
    this.dialog.querySelector('.phish-paused').hidden=!this.paused;
    this.content.inert=this.paused;
    const button=this.dialog.querySelector('.phish-pause');
    button.textContent=this.paused?'Weiter':'Pause';button.setAttribute('aria-pressed',String(this.paused));button.setAttribute('aria-label',this.paused?'Animation fortsetzen':'Animation pausieren');
    if(this.paused){this.pauseFocus=document.activeElement;this.dialog.querySelector('.phish-paused button').focus();}
    else this.pauseFocus?.focus({preventScroll:true});
    this.lastTime=0;this.keys.clear();this.schedule();
  }
  update(dt) {
    this.time+=dt;this.elapsed+=dt;
    if(this.phase==='surface'&&this.elapsed>(this.reduced ? .1 : .8)){this.close(true);return;}
    if(this.phase==='intro'&&this.elapsed>(this.reduced ? .25 : 3.2)) this.showLevel(0);
    if(this.phase==='escape'){
      this.ascent=clamp(this.elapsed/(this.reduced ? .4 : 3),0,1);
      if(this.ascent>=1){this.surface();return;}
    }
    this.netOpen+=(this.netGoal-this.netOpen)*(this.reduced ? 1 : Math.min(1,dt*2.8));
    const f=this.fish;
    if(this.keys.size&&this.phase==='choice'){
      let dx=(this.keys.has('d')||this.keys.has('arrowright')?1:0)-(this.keys.has('a')||this.keys.has('arrowleft')?1:0);
      let dy=(this.keys.has('s')||this.keys.has('arrowdown')?1:0)-(this.keys.has('w')||this.keys.has('arrowup')?1:0);
      const length=Math.hypot(dx,dy)||1;
      this.target={x:clamp(this.target.x+dx/length*dt*.42,.04,.96),y:clamp(this.target.y+dy/length*dt*.42,.16,.9)};
    }
    if(this.reduced){
      f.x=this.target.x;f.y=this.target.y;f.angle=0;f.vx=0;f.vy=0;
    }else{
      const ax=(this.target.x-f.x)*24-f.vx*9,ay=(this.target.y-f.y)*24-f.vy*9;
      f.vx+=ax*dt;f.vy+=ay*dt;f.x=clamp(f.x+f.vx*dt,.035,.965);f.y=clamp(f.y+f.vy*dt,.04,.94);
      if(Math.abs(f.vx)>.01)f.facing=f.vx>0?1:-1;
      const angle=clamp(f.vy*2*f.facing,-.3,.3);f.angle+=(angle-f.angle)*Math.min(1,dt*6);
      if(Math.abs(f.vx)<.006 && this.phase==='choice')f.facing=1;
    }
    if(this.phase==='choice'){
      if(this.pendingChoice!==null){
        const distance=Math.hypot(this.target.x-f.x,this.target.y-f.y);
        if((distance<.045&&this.elapsed>.35)||this.elapsed>(this.reduced ? .12 : 1.35)) this.choose(this.pendingChoice);
      }else if(this.pointerActive||this.keys.size){
        const index=this.targets.findIndex(target=>f.x>=target.left-.04&&f.x<=target.right&&f.y>=target.top&&f.y<=target.bottom);
        if(index!==this.hover){this.hover=index;this.dwell=0;}
        if(index>=0) {
          this.dwell+=dt;
          if(this.dwell>.48) {this.swimTo(index);return;}
        }
        this.targets.forEach((target,i)=>target.button.classList.toggle('is-target',i===index));
      }
    }
  }
  draw(dt) {
    if(!this.ocean) return;
    this.ocean.draw(this.time,dt,{fish:this.fish,reduced:this.reduced,camera:this.camera,ascent:this.ascent,net:this.level===2?1:0,netOpen:this.netOpen,targets:this.level===0&&this.phase==='choice'?this.targets.map((t,i)=>({...t,active:i===this.hover||i===this.pendingChoice})):[]});
  }
  schedule() {
    if(this.closed) return;
    if(document.hidden||this.paused){cancelAnimationFrame(this.frame);this.frame=0;return;}
    if(!this.frame) this.frame=requestAnimationFrame(time=>this.tick(time));
  }
  tick(now) {
    this.frame=0;
    if(this.closed||document.hidden||this.paused) return;
    const dt=this.lastTime?Math.min((now-this.lastTime)/1000,.05):.016;this.lastTime=now;
    this.update(dt);
    if(this.closed) return;
    this.draw(dt);
    // Reduced-motion feedback is fully still, with no background animation loop.
    if(!this.reduced || ['intro','escape','surface'].includes(this.phase) || this.pendingChoice!==null || this.keys.size || this.hover>=0) this.schedule();
  }
  close(completed,restoreTrigger=false,unloading=false) {
    if(this.closed)return;
    this.closed=true;cancelAnimationFrame(this.frame);this.events.abort();this.resizeObserver?.disconnect();this.ocean?.destroy();
    this.dialog.close();this.dialog.remove();
    if(this.oldBodyStyle)Object.assign(document.body.style,this.oldBodyStyle);
    document.documentElement.classList.remove('phish-playing');
    window.scrollTo({top:this.scrollY||0,behavior:'instant'});activeGame=null;
    if(unloading)return;
    const heading=document.getElementById('simulation-result-title');
    if(completed)heading.textContent='Wieder frei.';
    if(restoreTrigger)this.trigger.focus({preventScroll:true});
    else {
      document.getElementById('simulation-takeaways').scrollIntoView({behavior:'instant',block:'start'});
      heading.focus({preventScroll:true});
    }
  }
}
