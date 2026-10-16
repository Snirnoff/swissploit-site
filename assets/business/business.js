import { selectTab, selectLibrarySource } from './dashboard.js';
import { loadLearnArticles } from '../homepage/content.js';
document.querySelector('[data-open-evidence]').addEventListener('click',()=>selectTab('evidence',true));
document.querySelector('[data-open-own]').addEventListener('click',()=>{selectTab('content',true);selectLibrarySource('own');});
// Preserve bookmarks to the retired standalone marketing block.
if(location.hash==='#exklusive-quiz-games') {
  history.replaceState(null,'',location.pathname+location.search+'#dashboard');
  selectTab('content');document.querySelector('#dashboard').scrollIntoView({behavior:'instant'});
}
const feedback={
  domain:'Die Absenderdomain passt nicht zum behaupteten Anbieter. Prüfe die vollständige Adresse über eine bekannte Quelle.',
  urgency:'Die knappe Frist soll eine unüberlegte Reaktion auslösen. Unterbrich den Ablauf und prüfe die Anfrage unabhängig.',
  link:'Simuliertes Linkziel: https://konto-pruefung.example. Die Zieladresse gehört nicht zum behaupteten Dienst. Keine Daten eingeben.',
  verify:'Gute Entscheidung: Nutze die bereits bekannte Telefonnummer oder den internen Kontakt. Lass die Änderung und den Freigabeprozess unabhängig bestätigen.',
  report:'Gute Entscheidung: Melde die Nachricht über den vorgesehenen internen Meldeweg. Vermeide weitere Interaktionen mit dem Absender.',
  reply:'Eine Antwort landet möglicherweise direkt beim Angreifer. Prüfe die Anfrage über einen bereits bekannten, unabhängigen Kanal.',
  forward:'Leite verdächtige Nachrichten nur gemäss eurem internen Meldeprozess weiter. Ungezieltes Weiterleiten kann andere gefährden.'
};
document.querySelectorAll('[data-signal],[data-reaction]').forEach(button=>button.addEventListener('click',()=>{
  const mail=button.closest('.learning-mail'),key=button.dataset.signal||button.dataset.reaction;
  const result=mail.querySelector('.mail-feedback');
  result.textContent=feedback[key];result.dataset.kind=['verify','report'].includes(key)?'safe':'notice';
  mail.querySelectorAll('[data-signal],[data-reaction]').forEach(control=>control.classList.toggle('is-selected',control===button));
}));
// The existing square sculpture renderer is retained for logos and service shapes.
// A connecting path needs only two SVG strokes, with no extra animation clock.
const flow=document.querySelector('.workflow');
let flowVisible=false;
const syncFlow=()=>flow.classList.toggle('is-flowing',flowVisible&&!document.hidden);
new IntersectionObserver(([entry])=>{flowVisible=entry.isIntersecting;syncFlow();}).observe(flow);
document.addEventListener('visibilitychange',syncFlow);

// Animate visible sections on entry without hiding content or keyboard targets.
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;
  if(!motion.matches)entry.target.animate([{opacity:.65,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:500,easing:'ease-out'});
  reveals.unobserve(entry.target);
}),{threshold:.08});
document.querySelectorAll('.business-section > .section-intro').forEach(section=>reveals.observe(section));

function contentCard({ href, image, title, label }) {
  const link = document.createElement('a'); link.className = 'content-card'; link.href = href;
  const img = document.createElement('img'); img.src = image; img.alt = ''; img.width = 640; img.height = 360; img.loading = 'lazy'; img.decoding = 'async';
  img.addEventListener('error', () => { img.style.visibility = 'hidden'; }, { once: true });
  const copy = document.createElement('div'), tag = document.createElement('span'), heading = document.createElement('h3');
  tag.textContent = label; heading.textContent = title; copy.append(tag, heading); link.append(img, copy); return link;
}
async function realContent() {
  const articles = await loadLearnArticles('');
  const cards = articles.slice(0, 2).map(article => contentCard({ ...article, label: 'Öffentlicher Learn-Artikel' }));
  try {
    const response = await fetch('/data/youtube-shorts.json');
    if (!response.ok) throw Error('Videos unavailable');
    const videos = await response.json();
    const video = videos.filter(item => /^[A-Za-z0-9_-]{11}$/.test(item.id) && item.url === 'https://www.youtube.com/shorts/' + item.id && item.title)
      .sort((a,b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))[0];
    if (video) cards.push(contentCard({ href: video.url, image: 'https://i.ytimg.com/vi/' + video.id + '/hqdefault.jpg', title: video.title, label: 'Swissploit Video · Auf YouTube ansehen' }));
  } catch { /* Article links and static format links remain available. */ }
  if (cards.length) document.querySelector('#live-content').replaceChildren(...cards);
}
realContent().catch(() => { /* Keep the useful static Learn/Videos links. */ });
