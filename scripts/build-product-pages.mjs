import { aboutContent, contactUrl, servicePreview } from './product-sections.mjs';
import { campaignPanel, aiExample, customSection } from './business-sections.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { interactiveModules } from '../data/interactive-modules.mjs';
import { productPage, moduleCard, escape, icon } from './site-page.mjs';
import { services } from '../data/service-pages.mjs';
const root = fileURLToPath(new URL('../',import.meta.url));
async function write(route,html) { const directory = path.join(root,route); await fs.mkdir(directory,{recursive:true}); await fs.writeFile(path.join(directory,'index.html'),html); }

const quizzes = interactiveModules.filter(item=>item.kind==='quiz');
const games = interactiveModules.filter(item=>item.kind==='game');
await write('quiz-games',productPage({title:'Cybersecurity-Wissen testen – Quiz & Games',description:'Teste dein Wissen mit dem kostenlosen Phishing-Quiz und Phish Escape. Entdecke zusätzlich geplante Quiz- und Game-Konzepte für Unternehmen.',route:'/quiz-games/'},`
<section class="product-hero"><p class="hub-eyebrow">Quiz &amp; Games</p><h1>Cybersecurity-Wissen testen.</h1><p>Erkennst du Phishing, gefälschte Nachrichten und digitale Betrugsversuche? Teste dein Wissen in interaktiven Quiz und Games.</p><p class="service-scope">Kostenlose Angebote sind direkt spielbar. Die Business-Module zeigen vorläufige Konzepte und sind noch nicht verfügbar.</p></section>
<section class="business-section" aria-labelledby="quiz-title"><div class="section-intro"><p class="hub-eyebrow">Prüfen. Entscheiden. Verstehen.</p><h2 id="quiz-title">Phishing-Quiz</h2></div><div class="interactive-grid">${quizzes.map(item=>moduleCard(item)).join('')}</div></section>
<section class="business-section" aria-labelledby="games-title"><div class="section-intro"><p class="hub-eyebrow">Lernen durch Ausprobieren</p><h2 id="games-title">Phishing-Games</h2></div><div class="interactive-grid">${games.map(item=>moduleCard(item)).join('')}</div></section>
<section class="business-contact"><p class="hub-eyebrow">Lernen im Unternehmen</p><h2>Aus Wissen wird ein gemeinsamer Lernprozess.</h2><p>Die geplante Business-Plattform verbindet kurze Inhalte, interaktive Szenarien und nachvollziehbare Abschlüsse.</p><a class="core-test-primary" href="/unternehmen/#dashboard">Learn for Business entdecken</a></section>`));

// Replace only the generated module cards; the Business presentation stays authored HTML.
const businessFile = path.join(root,'unternehmen/index.html');
try {
  let html = await fs.readFile(businessFile,'utf8');
  for (const [name, content] of Object.entries({ CAMPAIGNS:campaignPanel, THREAT:aiExample, CUSTOM:customSection })) {
    html = html.replace(new RegExp(`<!-- BUSINESS-${name}:START -->[\\s\\S]*?<!-- BUSINESS-${name}:END -->`), `<!-- BUSINESS-${name}:START -->${content}<!-- BUSINESS-${name}:END -->`);
  }
  await fs.writeFile(businessFile, html);
} catch(error) { if(error.code!=='ENOENT')throw error; }
console.log('Static product pages generated.');

for (const service of services) {
  const route='/leistungen/'+service.slug+'/';
  const cta=`<a class="core-test-primary" href="${contactUrl(service.name)}">${escape(service.name)} anfragen</a>`;
  const html=productPage({title:service.name+' für Schweizer Unternehmen',description:service.description,route,scripts:['/assets/security-core/security-core.js']},`
  <div class="service-${service.slug}"><section class="product-hero service-hero"><div><p class="hub-eyebrow">${service.name}</p><h1>${service.title}</h1><p class="business-lead">${service.description}</p><div class="business-actions">${cta}<a class="core-test-secondary" href="/unternehmen/#services">Alle Angebote für Unternehmen</a></div></div><div class="service-symbol"><swissploit-security-core shape="${service.slug}"></swissploit-security-core><span class="service-visual-label">${service.name} / Swissploit</span></div></section>
  <section class="business-section service-split"><div class="section-intro"><p class="hub-eyebrow">Die Ausgangslage</p><h2>Die richtigen Fragen zuerst.</h2><p>${service.problem}</p></div><ul class="service-questions">${service.questions.map(q=>'<li>'+escape(q)+'</li>').join('')}</ul></section>
  <section class="business-section"><div class="section-intro"><p class="hub-eyebrow">Wobei Swissploit unterstützt</p><h2>${service.name==='Security Check'?'Eine klare Einschätzung. Konkrete nächste Schritte.':service.name==='Datenschutz Care'?'Datenschutz im Unternehmen organisieren.':'Rollen klären. Abläufe vorbereiten.'}</h2><p>${service.support}</p></div><ul class="service-topics">${service.topics.map(topic=>'<li>'+escape(topic)+'</li>').join('')}</ul><p class="service-scope">${service.scope}</p></section>
  ${servicePreview(service.slug)}
  <section class="business-section"><div class="section-intro"><p class="hub-eyebrow">Typischer Ablauf</p><h2>Gemeinsam vom Überblick zur Umsetzung.</h2></div><ol class="learning-steps service-steps">${service.steps.map(([title,text],i)=>`<li><span class="step-icon">0${i+1}</span><h3>${title}</h3><p>${text}</p></li>`).join('')}</ol></section>
  <section class="business-section"><div class="section-intro"><p class="hub-eyebrow">Der Nutzen für dein Unternehmen</p><h2>Eine fundierte Grundlage zum Handeln.</h2><p>Swissploit ergänzt interne IT-Verantwortliche und bestehende IT-Partner mit zusätzlicher Security-Kompetenz.</p></div><ul class="service-outcomes">${service.outcomes.map(item=>'<li>'+item+'</li>').join('')}</ul></section>
  <section id="kontakt" class="business-contact"><p class="hub-eyebrow">Unverbindlich besprechen</p><h2>Was braucht dein Unternehmen?</h2><p>Wir klären gemeinsam die Ausgangslage, das Ziel und einen passenden Umfang.</p>${cta}<p class="contact-note"><a href="/unternehmen/">Zur Unternehmensübersicht</a></p></section></div>`,
  '<script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':'Service',name:service.name,url:'https://swissploit.ch'+route,description:service.description,provider:{'@type':'Organization',name:'Swissploit',url:'https://swissploit.ch/'},areaServed:{'@type':'Country',name:'Switzerland'}})+'</script>');
  await write(route.slice(1),html);
}

await write('ueber-swissploit', productPage({title:'Cybersecurity verständlich machen.',description:'Swissploit hilft Menschen und Unternehmen, digitale Gefahren zu verstehen und sicherer zu handeln. Lerne uns kennen und nimm Kontakt auf.',route:'/ueber-swissploit/'}, aboutContent()));
