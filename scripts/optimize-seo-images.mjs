// Encode existing artwork only; originals are retained. Chrome supplies its image encoder.
import fs from 'node:fs/promises';
import {openBrowser} from './seo-browser.mjs';
const browser=await openBrowser(4186,9346);
try{
 await browser.call('Page.navigate',{url:browser.origin+'/404.html'});
 const jobs=[
  ...['OutlookUml','onedrive-restore','h355-014'].map(name=>({src:`/assets/blog/${name}.png`,out:`assets/blog/${name}.webp`,type:'image/webp'})),
  ...[48,180].map(size=>({src:'/assets/Swissploit_S_blue2.png',out:`assets/swissploit-signet-${size}.png`,size,type:'image/png'}))
 ];
 for(const job of jobs){
  const result=await browser.evaluate(`(async()=>{const job=${JSON.stringify(job)};const img=new Image();img.src=job.src;await img.decode();const canvas=document.createElement('canvas');canvas.width=job.size||img.naturalWidth;canvas.height=job.size||img.naturalHeight;const ctx=canvas.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,canvas.width,canvas.height);return {data:canvas.toDataURL(job.type,.92).split(',')[1],width:canvas.width,height:canvas.height};})()`);
  const buffer=Buffer.from(result.data,'base64');const before=(await fs.stat(job.src.slice(1))).size;
  if(buffer.length>=before)throw Error('No byte saving: '+job.out);
  await fs.writeFile(job.out,buffer);
  console.log(JSON.stringify({file:job.out,before,after:buffer.length,width:result.width,height:result.height}));
 }
}finally{browser.close();}
