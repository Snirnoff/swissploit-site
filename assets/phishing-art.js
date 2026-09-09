/* Original Swissploit pixel art. No external assets or renderer dependencies. */
const FISH = [
  '............aaaa.........',
  '..........aabbbba........',
  '........aabcccccbba......',
  '......aabcccccccccbba....',
  '.....abccccccccccccbba...',
  '....abccccccccccccccba...',
  '....abccceccccccffcccbba.',
  '...abccceeecccccfgcccbba.',
  '....abcccecccccccccccba.',
  '....abccccccddddddddba..',
  '.....abccddddddddddba...',
  '......abddddddddddba....',
  '.......aabbddddbbaa.....',
  '..........aabbaaa.......'
];
const PALETTE = { a: '#153c49', b: '#298492', c: '#66c7cf', d: '#dcd8ae', e: '#eaf7e6', f: '#102e3b', g: '#fbf7da' };
function random(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function polygon(c, points, fill) {
  c.fillStyle = fill; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(Math.round(x), Math.round(y)) : c.moveTo(Math.round(x), Math.round(y)));
  c.closePath(); c.fill();
}
function coral(c, x, y, height, color, seed) {
  const rand = random(seed);
  c.fillStyle = color;
  // Stepped, branching fingers instead of smooth vector strokes.
  for (let arm = 0; arm < 6; arm++) {
    let px = x, py = y;
    const direction = (arm - 2.5) * .6;
    const length = height * (.55 + rand() * .45);
    for (let j = 0; j < length; j += 3) {
      px += direction + Math.sin(j * .14 + arm) * .5; py -= 3;
      c.fillRect(Math.round(px), Math.round(py), j < length * .3 ? 4 : 3, 4);
      if (j > length * .5 && j % 9 === 0) c.fillRect(Math.round(px + direction * 3), Math.round(py - 2), 3, 4);
    }
    c.fillStyle = color; c.fillRect(Math.round(px - 1), Math.round(py - 2), 4, 2);
  }
}
function rock(c, x, y, w, h, rand, near) {
  const top = .2 + rand()*.16, shoulder = .7 + rand()*.12;
  // Irregular shelves and rounded, stepped boulders, lit from the upper left.
  polygon(c, [[x,y],[x,y-h*.26],[x+w*.06,y-h*.26],[x+w*.06,y-h*.62],
    [x+w*.17,y-h*.62],[x+w*.17,y-h*.87],[x+w*top,y-h*.87],[x+w*top,y-h],
    [x+w*.62,y-h],[x+w*.62,y-h*.92],[x+w*shoulder,y-h*.92],
    [x+w*shoulder,y-h*.7],[x+w*.91,y-h*.7],[x+w*.91,y-h*.36],[x+w,y-h*.36],[x+w,y]], near?'#173b42':'#154551');
  polygon(c, [[x+w*.06,y-h*.62],[x+w*.17,y-h*.87],[x+w*top,y-h],
    [x+w*.62,y-h],[x+w*.62,y-h*.92],[x+w*shoulder,y-h*.92],
    [x+w*.59,y-h*.72],[x+w*.28,y-h*.69]], near?'#3b6261':'#2a6470');
  polygon(c, [[x+w*.65,y-h*.8],[x+w*shoulder,y-h*.7],[x+w*.91,y-h*.7],
    [x+w*.91,y-h*.36],[x+w,y-h*.36],[x+w,y],[x+w*.7,y],[x+w*.57,y-h*.42]], near?'#0d2d36':'#163d4b');
  c.fillStyle=near?'#61877b':'#4b8085';
  for(let i=0;i<38;i++){
    c.globalAlpha=.15+rand()*.35;
    const px=x+w*(.18+rand()*.54),py=y-h*(.12+rand()*.67);
    c.fillRect(Math.round(px),Math.round(py),2+Math.floor(rand()*7),1);
  }
  // Horizontal seams keep the rock texture pixel-sized and understated.
  c.globalAlpha=.3;c.fillStyle='#082e3d';
  c.fillRect(Math.round(x+w*.21),Math.round(y-h*.57),Math.round(w*.4),2);
  c.fillRect(Math.round(x+w*.16),Math.round(y-h*.29),Math.round(w*.32),1);
  c.globalAlpha=1;
}
function terrain(w, h, layer) {
  const canvas = document.createElement('canvas');
  canvas.width = w + 180; canvas.height = h;
  const c = canvas.getContext('2d'), rand = random(2026 + layer * 41);
  const near = layer === 2;
  const baseline = h * (layer === 0 ? .88 : .97);
  const step = near ? 48 : 62;
  for (let x = 0; x < canvas.width + 50; x += step) {
    const high = (Math.sin(x*.009+layer) * .5 + .5) * h * .12;
    const edge = x < 90 || x > w + 45;
    const height = (18 + rand()*34 + high) * (edge ? 1.35 : .55);
    rock(c,x,baseline+18,step+25+rand()*35,height,rand,near);
  }
  c.fillStyle = near ? '#082831' : '#144450';
  for (let x=0;x<canvas.width;x+=4) {
    const y = baseline + Math.sin(x*.015)*7 + rand()*4;
    c.fillRect(x,Math.round(y),4,h);
    c.fillStyle = near ? '#31564f' : '#245965';
    c.fillRect(x,Math.round(y),4,2);
    c.fillStyle = near ? '#082831' : '#144450';
  }
  const colors = near ? ['#b78378','#8397ad','#679d91','#bfad83'] : ['#2b6870','#34777a','#446f7b'];
  for (let i=0;i<(near?19:25);i++) {
    const x=rand()*canvas.width;
    const y=baseline + Math.sin(x*.015)*6;
    const height=12+rand()*35;
    if(i%4===0){
      // Low table coral and sponge shelves provide a second silhouette.
      for(let shelf=0;shelf<3;shelf++){
        const cy=y-shelf*6;
        c.fillStyle=colors[i%colors.length];c.fillRect(Math.round(x-10+shelf*2),Math.round(cy-2),19-shelf*3,3);
        c.fillStyle=near?'#d7c6ab':'#487a80';c.fillRect(Math.round(x-9+shelf*2),Math.round(cy-3),16-shelf*3,1);
        c.fillStyle=colors[i%colors.length];c.fillRect(Math.round(x),Math.round(cy),3,7);
      }
    }else coral(c,x,y,height,colors[i%colors.length],i*31+layer);
  }
  c.fillStyle=near?'#769087':'#37626b';
  for(let i=0;i<200;i++) c.fillRect(Math.floor(rand()*canvas.width),Math.floor(baseline+rand()*25),rand()>.8?3:1,1);
  return canvas;
}
export function drawFish(c, x, y, scale = 1, angle = 0, time = 0, facing = 1) {
  c.save(); c.translate(Math.round(x),Math.round(y)); c.rotate(angle); c.scale(scale*facing,scale); c.translate(-13,-7);
  const tail = Math.sin(time*10)*1.5;
  polygon(c, [[5,6],[0,3+tail],[-2,3+tail],[-2,11-tail],[0,11-tail],[5,8]], '#318c99');
  c.fillStyle='#82c9c6';c.fillRect(-2,4+Math.round(tail),2,5-Math.round(tail));
  FISH.forEach((row,py)=>[...row].forEach((pixel,px)=>{if(PALETTE[pixel]){c.fillStyle=PALETTE[pixel];c.fillRect(px,py,1,1);}}));
  c.fillStyle='#3aa5b0';c.fillRect(12,10+Math.round(Math.sin(time*9)),4,2);
  c.restore();
}
export class Ocean {
  constructor(canvas) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    if(!this.ctx) throw new Error('Canvas unavailable');
    this.width=0;this.height=0;this.camera=0;
    this.resize();
  }
  resize() {
    const r=this.canvas.getBoundingClientRect();
    if(!r.width || !r.height) return;
    this.width=Math.min(800,Math.max(280,Math.round(r.width/2.4)));
    this.height=Math.round(this.width*r.height/r.width);
    this.canvas.width=this.width;this.canvas.height=this.height;
    this.ctx.imageSmoothingEnabled=false;
    this.layers=[terrain(this.width,this.height,0),terrain(this.width,this.height,1),terrain(this.width,this.height,2)];
    const rand=random(74);
    this.bubbles=Array.from({length:32},()=>({x:rand(),y:rand(),size:rand()>.75?2:1,speed:5+rand()*13}));
    this.plants=Array.from({length:22},(_,i)=>({x:rand()*(this.width+100)-50,h:16+rand()*45,phase:i*.8}));
  }
  draw(time, delta, state) {
    const c=this.ctx,w=this.width,h=this.height, motion=state.reduced?0:time;
    this.camera += (state.camera-this.camera)*(state.reduced?1:Math.min(1,delta*1.3));
    const ascent=state.ascent||0;
    const bg=c.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,ascent>.5?'#498b91':'#174e60');
    bg.addColorStop(.45,ascent>.5?'#1f6574':'#0c3448');
    bg.addColorStop(1,'#071e30');
    c.fillStyle=bg;c.fillRect(0,0,w,h);
    // Long diffuse shafts and pixel caustics give the scene depth without full-resolution effects.
    for(let i=0;i<7;i++){
      const x=w*(i*.22-.2)+Math.sin(motion*.13+i)*8;
      c.globalAlpha=.035+ascent*.04;
      polygon(c,[[x,0],[x+10+i*3,0],[x+w*.26,h*.95],[x+w*.02,h*.95]],'#b5e0d2');
    }
    c.globalAlpha=1;
    for(let i=0;i<25;i++){
      c.fillStyle=i%2?'#75afb022':'#b3d6c326';
      const x=((i*79+motion*3)% (w+80))-40;
      c.fillRect(Math.round(x),Math.round(4+Math.sin(i*2+motion*.2)*3+ascent*24),13+(i%4)*9,1);
    }
    c.globalAlpha=.52*(1-ascent*.8);
    c.drawImage(this.layers[0],-30-this.camera*.13,Math.round(ascent*h*.4));
    c.globalAlpha=1;
    // Small, calm shoals in the middle distance.
    for(let school=0;school<3;school++) for(let i=0;i<7;i++){
      const x=((w*.25+school*w*.3+i*9+motion*(school===1?-2:3)+w*4)%(w+60))-30-this.camera*.08;
      const y=h*(.26+school*.18)+Math.sin(i*2.4+motion*.6)*4;
      c.fillStyle=school===1?'#77a8ac48':'#7ca3b032';
      c.fillRect(Math.round(x),Math.round(y),4,2);c.fillRect(Math.round(x-2),Math.round(y-1),2,4);
    }
    c.globalAlpha=.85*(1-ascent*.75);
    c.drawImage(this.layers[1],-35-this.camera*.25,Math.round(ascent*h*.55));
    c.globalAlpha=1;
    this.bubbles.forEach((b,i)=>{
      const x=(b.x*w+Math.sin(motion*.35+i)*4-this.camera*.04+w)%w;
      const y=((b.y*h-motion*b.speed*(1+ascent*3))%h+h)%h;
      c.strokeStyle=i%3?'#7dbcc53b':'#bde3de66';c.lineWidth=1;
      c.strokeRect(Math.round(x),Math.round(y),b.size,b.size+1);
      if(b.size===2){c.fillStyle='#e0eee744';c.fillRect(Math.round(x),Math.round(y),1,1);}
    });
    if(state.net>0) this.drawNet(c,w,h,state.net,state.netOpen);
    if(state.targets?.length) {
      for(const target of state.targets){
        const x=target.x*w,y=target.y*h;
        c.globalAlpha=.65;
        c.strokeStyle='#a8c8bb';c.lineWidth=1;c.beginPath();c.moveTo(Math.round(x+3),Math.round(y-38));
        c.lineTo(Math.round(x),Math.round(y-10));c.stroke();
        c.strokeStyle=target.active?'#f2dfb5':'#a8c8bb';c.beginPath();
        c.moveTo(Math.round(x),Math.round(y-9));c.lineTo(Math.round(x),Math.round(y+3));
        c.lineTo(Math.round(x-3),Math.round(y+6));c.lineTo(Math.round(x-6),Math.round(y+3));
        c.lineTo(Math.round(x-6),Math.round(y));c.stroke();
        c.globalAlpha=1;
        c.fillStyle=target.active?'#edd9ab':'#4ab3c3';c.fillRect(Math.round(x-3),Math.round(y-2),4,4);
      }
    }
    const f=state.fish;
    if(f) {
      // A soft halo separates the mascot from the deep water.
      const glow=c.createRadialGradient(f.x*w,f.y*h,1,f.x*w,f.y*h,30);
      glow.addColorStop(0,'#4ab3c321');glow.addColorStop(1,'#4ab3c300');c.fillStyle=glow;c.fillRect(f.x*w-30,f.y*h-30,60,60);
      drawFish(c,f.x*w,f.y*h+(state.reduced?0:Math.sin(time*2.5)*1),f.scale || (w<400?1.35:1.7),f.angle,motion,f.facing);
      if(!state.reduced && Math.abs(f.vx)>.025) {
        c.fillStyle='#b9e9e366';
        for(let i=0;i<3;i++)c.fillRect(Math.round(f.x*w-f.facing*(24+i*7)),Math.round(f.y*h+Math.sin(time*5+i)*2),1,1);
      }
    }
    c.globalAlpha=1-ascent*.9;
    c.drawImage(this.layers[2],-40-this.camera*.42,Math.round(ascent*h*.8));
    this.plants.forEach((plant,i)=>{
      const x=plant.x-this.camera*.35,y=h+ascent*h*.6;
      for(let strand=0;strand<3;strand++){
        c.fillStyle=['#285953','#397c6b','#4f9180'][strand];
        for(let j=0;j<plant.h;j+=3){
          const sway=Math.sin(motion*.7+plant.phase+j*.05)*(j/plant.h)*4;
          c.fillRect(Math.round(x+strand*4+sway+Math.sin(j*.07+strand)*3),Math.round(y-j),2,4);
        }
      }
    });
    c.globalAlpha=1;
    const shade=c.createLinearGradient(0,0,0,h);
    shade.addColorStop(0,'#03152255');shade.addColorStop(.32,'#03152200');shade.addColorStop(.78,'#03152200');shade.addColorStop(1,'#03152277');
    c.fillStyle=shade;c.fillRect(0,0,w,h);
    if(ascent>.65) {c.fillStyle='#b6ddd0';c.globalAlpha=(ascent-.65)*1.9;c.fillRect(0,0,w,h);c.globalAlpha=1;}
  }
  drawNet(c,w,h,alpha,opening=0) {
    c.save();
    const center=w*.54,gap=opening*w*.48;
    c.beginPath();c.rect(0,0,Math.max(0,center-gap),h);c.rect(Math.min(w,center+gap),0,w,h);c.clip();
    c.globalAlpha=alpha*.28;c.strokeStyle='#b9c7b0';c.lineWidth=1;
    for(let x=-h;x<w+h;x+=18){
      c.beginPath();c.moveTo(x,0);c.lineTo(x-h*.6,h);c.stroke();
      c.beginPath();c.moveTo(x,0);c.lineTo(x+h*.6,h);c.stroke();
    }
    c.restore();
  }
  destroy(){ this.layers=[];this.bubbles=[];this.plants=[];this.canvas.width=1;this.canvas.height=1; }
}
