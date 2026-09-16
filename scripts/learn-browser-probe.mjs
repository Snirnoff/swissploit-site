// Runs in Chrome via CDP; computed colors include actual tinted surfaces.
export function probeArticle() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  function rgba(value){ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v);}
  function over(fg,bg){return fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));}
  function background(e){const layers=[];for(let p=e;p;p=p.parentElement)layers.unshift(rgba(getComputedStyle(p).backgroundColor));return layers.reduce((base,layer)=>over(layer,base),[255,255,255]);}
  function luminance(rgb){const c=rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
  const contrast=[];
  for(const e of document.querySelectorAll('.post-content *, .post-kicker, .post-title, .post-meta *, .post-subline')){
    if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||e.closest('[aria-hidden="true"]')||!e.getClientRects().length||!e.checkVisibility())continue;
    const style=getComputedStyle(e);if(style.visibility==='hidden'||Number(style.opacity)===0)continue;
    const bg=background(e),fg=over(rgba(style.color),bg),a=luminance(fg),b=luminance(bg);
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && Number(style.fontWeight)>=700);
    contrast.push({selector:e.tagName+'.'+e.className,text:e.textContent.trim().slice(0,45),ratio:Math.round(ratio*100)/100,required:large?3:4.5});
  }
  const p=document.querySelector('.post-article > p');
  return {contrastMin:Math.min(...contrast.map(c=>c.ratio)),contrastFailures:contrast.filter(c=>c.ratio<c.required),typography:{root:getComputedStyle(document.documentElement).fontSize,content:getComputedStyle(document.querySelector('.post-content')).fontSize,parent:getComputedStyle(p.parentElement).fontSize,p:getComputedStyle(p).fontSize,lineHeight:getComputedStyle(p).lineHeight},overflow:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>innerWidth+1||r.left < -1);}).map(e=>e.tagName+'.'+e.className).slice(0,10)};
}
