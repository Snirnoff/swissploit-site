import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { openBrowser, delay } from './seo-browser.mjs';
const browser=await openBrowser(4198,9358),{call,evaluate,origin}=browser;
const folder='.visual-check/premium-v5.1/review';
await fs.mkdir(folder,{recursive:true});
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(80);}throw Error('Timed out: '+expression);};
const visit=async route=>{await call('Page.navigate',{url:origin+route});await waitFor('document.readyState === "complete"');await delay(100);};
const size=(width,height)=>call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
const set=(selector,value)=>evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
async function shot(name,target){if(target)await evaluate(`document.querySelector(${JSON.stringify(target)}).scrollIntoView({block:'start',behavior:'instant'})`);await delay(150);const r=await call('Page.captureScreenshot',{format:'png'});await fs.writeFile(folder+'/'+name+'.png',Buffer.from(r.data,'base64'));}
const press=async key=>{const code={Escape:27,Enter:13,ArrowDown:40,Tab:9}[key];await call('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,...(key==='Enter'?{text:'\r'}:{})});await call('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code});};
async function assertNoOverflow(label) {
  const width=await evaluate('({scroll:document.documentElement.scrollWidth,viewport:innerWidth})');
  assert.ok(width.scroll<=width.viewport,label+' '+JSON.stringify(width));
}
try {
  const routes=['/','/unternehmen/','/quiz-games/','/ueber-swissploit/','/leistungen/security-check/','/leistungen/datenschutz-care/','/leistungen/incident-readiness/','/phishing-simulation/','/phishing-quiz/'];
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,900],[390,844],[320,740]]) {
    await size(width,height);
    for(const route of routes) {
      await visit(route);
      if(route==='/unternehmen/')await waitFor('document.body.dataset.dashboardReady === "true"');
      if(route==='/')await waitFor('document.body.dataset.contentReady === "true"');
      for(const theme of ['dark','light']) {
        await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme));
        await assertNoOverflow(route+' '+width+' '+theme);
        assert.equal(await evaluate('document.querySelectorAll("h1").length'),1,route);
        assert.equal(await evaluate('document.querySelectorAll(".site-footer").length'),1,route);
        assert.deepEqual(await evaluate('[...document.querySelectorAll("[id]")].map(el=>el.id).filter((id,i,ids)=>ids.indexOf(id)!==i)'),[],route);
        if(width>1100)assert.ok(await evaluate('Math.abs(document.querySelector("#primaryNav").getBoundingClientRect().x+document.querySelector("#primaryNav").getBoundingClientRect().width/2-innerWidth/2)<1'),route+' centered nav');
        if(route==='/'&&width>=1366)assert.ok(await evaluate('document.documentElement.scrollHeight<=innerHeight+2'),'homepage fits '+width);
      }
    }
    console.log('Routes, both themes, header and overflow: '+width);
  }
  await size(1440,900);await visit('/unternehmen/');await waitFor('document.body.dataset.dashboardReady === "true"');
  assert.equal(await evaluate('document.querySelector(".comparison-section").compareDocumentPosition(document.querySelector("#dashboard")) & Node.DOCUMENT_POSITION_FOLLOWING'),4);
  assert.equal(await evaluate('document.querySelectorAll(".portfolio-links,#awareness-rhythm,.passport-section,#exklusive-quiz-games").length'),0);
  await click('[data-tab="content"]');assert.equal(await evaluate('document.querySelectorAll(".module-card").length'),7);
  assert.equal(await evaluate('document.querySelector(".module-card .content-formats").textContent'),'VideoArtikelQuiz');
  await click('.module-card');assert.equal(await evaluate('document.querySelector("#module-dialog").open'),true);
  await press('Escape');await waitFor('document.querySelector("#module-dialog").open===false');assert.equal(await evaluate('document.activeElement.className'),'module-card');
  await click('.module-card');await click('#module-detail .dash-action');await delay(30);
  assert.equal(await evaluate('document.activeElement.id'),'tab-campaigns');
  await set('#package-module','ai');assert.deepEqual(await evaluate('[...document.querySelectorAll("[name=format]")].map(e=>e.value)'),['video','scenario','quiz']);
  await set('#package-team','hr');await set('#package-rhythm','custom');await set('#package-interval','2');await set('#package-start','2026-11-01');await set('#package-deadline','2026-11-20');
  await click('#assignment-form [type="submit"]');assert.match(await evaluate('document.querySelector("#assignment-feedback").textContent'),/5 Mitarbeitenden/);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#overview-content .dashboard-kpi strong")].map(el=>el.textContent)'),['5','0','5','0 %']);
  await click('#simulate-progress');assert.deepEqual(await evaluate('[...document.querySelectorAll("#overview-content .dashboard-kpi strong")].map(el=>el.textContent)'),['5','4','1','80 %']);
  await click('#view-assignments');assert.equal(await evaluate('document.querySelectorAll("#people-rows tr").length'),5);
  await set('#status-filter','done');assert.equal(await evaluate('document.querySelectorAll("#people-rows tr").length'),4);
  await click('[data-role="employee"]');await set('#employee-person','DEMO-15');
  assert.match(await evaluate('document.querySelector("#employee-content").textContent'),/Nicht bestanden/);
  await click('#employee-content .dash-action');await click('#employee-content .dash-action'); // Remaining scenario.
  await click('#employee-content .dash-action'); // Open quiz.
  await click('#employee-content .dash-action:nth-of-type(2)'); // Failed result.
  assert.match(await evaluate('document.querySelector("#employee-feedback").textContent'),/Nicht bestanden/);
  assert.equal(await evaluate('document.querySelectorAll("#employee-content .training-status[data-status=done]").length'),2);
  await click('#employee-content .dash-action');await click('#employee-content .dash-action'); // Retry, pass.
  assert.match(await evaluate('document.querySelector("#employee-content").textContent'),/0 offene Aufgabe/);
  await click('#employee-content .dash-action');assert.match(await evaluate('document.querySelector("#evidence-preview").textContent'),/20.11.2026/);
  assert.match(await evaluate('document.querySelector("#evidence-preview").textContent'),/Bestanden/);
  await click('[data-tab="reports"]');assert.match(await evaluate('document.querySelector("#report-content").textContent'),/100 %/);
  await click('[data-tab="content"]');await click('[data-library-source="own"]');await click('#simulate-upload');
  assert.equal(await evaluate('document.querySelectorAll("input[type=file]").length'),0);
  await click('#module-detail .dash-action');assert.equal(await evaluate('document.querySelectorAll(".module-card").length'),2);
  await click('.module-card:last-child');await click('#module-detail .dash-action');
  assert.equal(await evaluate('document.querySelector("#package-module").value'),'own-policy');
  await click('#assignment-form [type=submit]');assert.match(await evaluate('document.querySelector("#assignment-feedback").textContent'),/5 Mitarbeitenden/);
  await click('#reset-demo');assert.equal(await evaluate('document.querySelectorAll("#package-module option[value=own-policy]").length'),0);
  assert.equal(await evaluate('document.querySelector("#overview-content .dashboard-kpi strong").textContent'),'25');
  await click('[data-signal="domain"]');assert.match(await evaluate('document.querySelector(".mail-feedback").textContent'),/Absenderdomain/);
  await click('[data-reaction="verify"]');assert.match(await evaluate('document.querySelectorAll(".mail-feedback")[1].textContent'),/Gute Entscheidung/);
  assert.equal(await evaluate('document.querySelectorAll(".learning-mail a[href]").length'),0);
  console.log('Full library → assignment → learner → failed/pass → evidence journey and own content passed.');
  for(const [width,height] of [[1440,900],[390,844],[320,740]]) {
    await size(width,height);
    for(const tab of ['overview','content','campaigns','people','reports','evidence']) {
      await click('[data-tab="'+tab+'"]');await assertNoOverflow('dashboard '+tab+' '+width);
      assert.ok(await evaluate('document.querySelector("#panel-'+tab+'").scrollWidth<=document.querySelector("#panel-'+tab+'").clientWidth+1'),'panel overflow '+tab+' '+width);
    }
    await click('[data-role="employee"]');await set('#employee-person','DEMO-20');await assertNoOverflow('employee '+width);
    await shot('employee-'+width,'#dashboard');await shot('employee-tasks-'+width,'.employee-phone');
    await click('[data-role="manager"]');await click('[data-tab="content"]');await click('[data-library-source="swissploit"]');
    for(const theme of ['dark','light']) {
      await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme));
      if(width===320)continue;
      for(const [name,target] of [['library','#dashboard'],['comparison','.comparison-section'],['problem','.problem-section'],['workflow','section[aria-labelledby="steps-title"]'],['content','#lerninhalte'],['mail','.threat-section'],['mail-actions','.mail-decisions'],['custom','.custom-content'],['report','#nachweise'],['services','#services'],['cta','#kontakt']]) await shot(name+'-'+width+'-'+theme,target);
    }
  }
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".flow-particles")).animationName'),'none');
  await call('Emulation.setEmulatedMedia',{features:[]});
  await visit('/quiz-games/');await size(390,844);
  await evaluate('document.querySelector(".is-business summary").focus()');await press('Enter');
  assert.equal(await evaluate('document.querySelector(".is-business").open'),true);
  assert.equal(await evaluate('location.pathname'),'/quiz-games/');
  await shot('lock-mobile','.is-business');
  await click('.is-business summary');await click('.is-business summary');assert.equal(await evaluate('document.querySelector(".is-business").open'),true);
  assert.equal(await evaluate('document.querySelector(".locked-detail a").getAttribute("href")'),'/unternehmen/#dashboard');
  await click('a[href="/phishing-simulation/?play=1"]');await waitFor('document.querySelector(".phish-game")?.open===true');
  assert.match(await evaluate('document.querySelector(".phish-exit").textContent'),/Beenden/);
  await click('.phish-exit');await waitFor('location.pathname==="/quiz-games/"');
  assert.equal(await evaluate('document.querySelector(".phish-game")'),null);
  await visit('/ueber-swissploit/?anliegen=Learn%20for%20Business#kontakt');assert.equal(await evaluate('document.querySelector("#cf-topic").value'),'Learn for Business');
  assert.equal(await evaluate('document.querySelector("#contactForm").checkValidity()'),false);
  await set('#cf-message','Wir möchten Security Awareness in unserem Team organisieren.');assert.equal(await evaluate('document.querySelector("#contactForm").checkValidity()'),true);
  await evaluate('document.querySelector("#cf-topic").focus()');await press('Enter');await press('ArrowDown');await press('Enter');
  assert.equal(await evaluate('document.querySelector("#cf-topic").value'),'Security Check');
  await click('#menuToggle');assert.equal(await evaluate('document.querySelector("#navigationDialog").open'),true);await press('Escape');
  await waitFor('document.querySelector("#navigationDialog").open===false');
  await shot('contact-mobile','#kontakt');
  await size(1440,900);await shot('contact-desktop','#kontakt');
  await call('Runtime.evaluate',{expression:'document.querySelector("#cf-topic").showPicker()',userGesture:true});await shot('select-desktop');await press('Escape');
  assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.badResponses,[]);
  console.log('Keyboard, responsive panels, locks, game exit, contact validation, reduced motion and console passed.');
  console.log('Screenshots: '+folder);
} finally {browser.close();}
