import  {
  assignments, modules, people, campaign, metrics, selectAssignments, statusLabels, teams, formats, rhythms, assignCampaign, simulateProgress, beginContent, finishContent, quizResult, addExampleContent, resetDemo
}
from './demo-data.js';
import { contentIcon } from './content-icons.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const moduleFor = row => modules.find(module => module.id === row.moduleId);
const date = value => value ? value.split('-').reverse().join('.') : 'Noch offen';
function node(tag, className, text)  {
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
}
function action(text,fn)  {
  const button=node('button','dash-action',text);
  button.type='button';
  button.addEventListener('click',fn);
  return button;
}
function badge(status)  {
  const el=node('span','training-status',statusLabels[status]);
  el.dataset.status=status;
  return el;
}
function progress(completed,total,label)  {
  const wrap=node('div','topic-row'),caption=node('div','progress-line'),bar=node('progress');
  caption.append(node('span','',label),node('span','',`${completed} / ${total}`));
  bar.max=total||1;
  bar.value=completed;
  bar.setAttribute('aria-label',label+': abgeschlossene Zuweisungen');
  wrap.append(caption,bar);
  return wrap;
}
function fields(items)  {
  const dl=node('dl','evidence-grid');
  for(const [label,value] of items) {
    const pair=node('div');
    pair.append(node('dt','',label),node('dd','',value));
    dl.append(pair);
  }
  return dl;
}
function kpis()  {
  const data=metrics(),wrap=node('div','dashboard-kpis');
  for(const [value,label] of [[data.people,'Mitarbeitende'],[data.completed,'Abgeschlossen'],[data.open,'Offene Lernpakete'],[data.rate+' %','Abschlussquote']]) {
    const card=node('div','dashboard-kpi');
    card.append(node('strong','',value),node('span','',label));
    wrap.append(card);
  }
  return wrap;
}
function teamProgress()  {
  const wrap=node('div');
  wrap.append(node('h3','dashboard-section-label','Lernstatus nach Teams'));
  for(const team of teams) {
    const rows=selectAssignments( {
      teamId:team.id
    });
    if(rows.length)wrap.append(progress(metrics(rows).completed,rows.length,team.name));
  }
  return wrap;
}
function renderOverview()  {
  const data=metrics(),summary=node('div','campaign-summary');
  summary.append(node('span','','AKTUELLE DEMOKAMPAGNE · '+date(campaign.start)+' – '+date(campaign.deadline)),node('h3','',campaign.title),progress(data.completed,data.people,'Lernpaket abgeschlossen'));
  const recent=node('div');
  recent.append(node('h3','dashboard-section-label','Abschlüsse dieser Kampagne'));
  assignments.filter(row=>row.status==='done').slice(0,3).forEach(row=> {
    const item=node('div','recent-row');item.append(node('strong','',row.name+' · '+moduleFor(row).title),node('span','',date(row.completedAt)+(row.questions?` · Quiz ${row.correct}/${row.questions}`:' · Ohne Quiz')));recent.append(item);
  });
  if(!data.completed)recent.append(node('p','','Noch keine Abschlüsse. Im Bereich Kampagnen lässt sich ein späterer Lernstand simulieren.'));
  const columns=node('div','dashboard-columns');
  columns.append(teamProgress(),recent);
  const states=node('div','workflow-status');
  for(const [label,count] of [['Zugewiesen',assignments.length],['Offen',assignments.filter(row=>row.status==='open').length],['In Bearbeitung',assignments.filter(row=>row.status==='progress').length],['Quiz bestanden',assignments.filter(row=>quizResult(row)==='Bestanden').length],['Nicht bestanden',assignments.filter(row=>quizResult(row)==='Nicht bestanden').length]])states.append(node('span','',`${label}: ${count}`));
  $('#overview-content').replaceChildren(kpis(),summary,states,columns,action('Inhalte auswählen',()=>selectTab('content',true)));
}
const tabs=$$('[data-tab]');
export function selectTab(name,focus=false) {
  selectRole('manager');
  tabs.forEach(tab=> {
    const selected=tab.dataset.tab===name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;if(selected&&focus)tab.focus( {
      preventScroll:true
    });
  });
  $('.dashboard-workspace').scrollTop=0;
}
tabs.forEach((tab,index)=> {
  tab.addEventListener('click',()=>selectTab(tab.dataset.tab));tab.addEventListener('keydown',event=> {
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;selectTab(tabs[next].dataset.tab,true);
  });
});
function selectRole(role) {
  $$('[data-role]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.role===role)));
  $('#manager-preview').hidden=role!=='manager';
  $('#employee-preview').hidden=role!=='employee';
}
$$('[data-role]').forEach(button=>button.addEventListener('click',()=>selectRole(button.dataset.role)));
const dialog=$('#module-dialog');
let returnFocus;
dialog.querySelector('button').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>returnFocus?.isConnected&&returnFocus.focus( {
  preventScroll:true
}));
function moduleDetails(module,opener) {
  returnFocus=opener;
  $('#module-dialog-title').textContent=module.title;
  $('#module-detail').replaceChildren(node('p','',module.description),formatList(module.contents),fields([['Lernzeit (Demo)',`ca. ${module.minutes} Minuten`],['Schwierigkeit',module.level],['Inhaltsversion',module.version],['Quiz-Bestehensregel',module.contents.includes('quiz')?'4 von 5 richtig (80 %)':'Kein Wissenstest']]),action('Lernpaket zusammenstellen',()=> {
    dialog.close();returnFocus=null;$('#package-module').value=module.id;renderBuilderFormats();updateBuilder();selectTab('campaigns',true);
  }));
  dialog.showModal();
}
let librarySource='swissploit';
function formatList(contents) {
  const list=node('div','content-formats');
  for(const format of contents) { const item=node('span');item.append(contentIcon(format),node('span','',formats[format]));list.append(item); }
  return list;
}
export function selectLibrarySource(source) {
  librarySource=source;
  $$('[data-library-source]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.librarySource===source)));
  $('#library-own').hidden=source!=='own';renderModules();
}
$$('[data-library-source]').forEach(button=>button.addEventListener('click',()=>selectLibrarySource(button.dataset.librarySource)));
function renderModules() {
  $('#module-list').replaceChildren();
  for(const module of modules.filter(item=>item.source===librarySource)) {
    const button=node('button','module-card');
    button.type='button';
    button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-controls','module-dialog');
    button.append(node('strong','',module.title),formatList(module.contents),node('small','',`${module.level} · ca. ${module.minutes} Min.`),node('em','','Lernziel & Inhalte →'));
    button.addEventListener('click',()=>moduleDetails(module,button));
    $('#module-list').append(button);
  }
}
function renderPeople() {
  const rows=selectAssignments( {
    status:$('#status-filter').value,moduleId:$('#module-filter').value
  }),stats=metrics(rows);
  $('#filter-summary').textContent=`${stats.people} Personen · ${stats.completed} abgeschlossen · ${stats.open} offen · ${stats.rate} % Abschlussquote`;
  const fragment=document.createDocumentFragment();
  for(const row of rows) {
    const tr=node('tr'),person=node('td'),status=node('td');
    const button=action(row.name,()=> {
      $('#evidence-person').value=row.id;renderEvidence();selectTab('evidence',true);
    });
    button.setAttribute('aria-label',row.name+': Zuweisung und Nachweis ansehen');
    person.append(button,node('small','person-team',teams.find(team=>team.id===row.teamId).name));
    status.append(badge(row.status),node('span','quiz-result',quizResult(row)));
    tr.append(person,node('td','',moduleFor(row).title),status);
    fragment.append(tr);
  }
  if(!rows.length) {
    const tr=node('tr'),cell=node('td','','Keine Zuweisung für diese Filter.');
    cell.colSpan=3;
    tr.append(cell);
    fragment.append(tr);
  }
  $('#people-rows').replaceChildren(fragment);
}
function renderEvidence() {
  const row=assignments.find(item=>item.id===$('#evidence-person').value);
  if(!row)return;
  const module=moduleFor(row),paper=node('article','evidence-paper');
  paper.append(node('span','','SWISSPLOIT / MUSTER · '+row.id),node('h3','',row.status==='done'?'Teilnahme- und Abschlussbestätigung':'Lernzuweisung · Abschluss ausstehend'),node('p','',campaign.title),fields([['Mitarbeitende (fiktiv)',row.name],['Lerninhalt / Version',module.title+' / '+module.version],['Lernpaket',campaign.formats.map(format=>formats[format]).join(' + ')],['Zugewiesen durch',campaign.assignedBy],['Zuweisungsdatum',date(row.assignedAt)],['Abschlussdatum',date(row.completedAt)],['Testversion',row.questions?module.testVersion:'Kein Quiz im Lernpaket'],['Quizresultat',row.correct===null?'Kein Ergebnis':`${row.correct} / ${row.questions} richtig (${row.correct/row.questions*100} %)`],['Testergebnis',quizResult(row)],['Bestehensregel',row.questions?`Mindestens ${campaign.passPercent} %`:'Kein Wissenstest'],['Status',statusLabels[row.status]]]),node('p','evidence-note','Muster mit fiktiven Daten. Kein realer Schulungsnachweis und keine Zertifizierung. Das Quizresultat beschreibt nur diesen Wissenstest.'));
  $('#evidence-preview').replaceChildren(paper,node('p','evidence-history','Beispielhistorie: '+row.history.join(' · ')));
}
function learningPath(row) {
  const list=node('ol','employee-path');
  campaign.formats.forEach(format=> {
    const item=node('li'),done=row.completedFormats.includes(format),active=row.activeFormat===format;
    item.dataset.format=format;
    item.append(contentIcon(format),node('strong','',formats[format]));
    if(done)item.append(badge('done'));
    else if(format==='quiz' && active) {
      item.append(node('p','','Beispielergebnis für den Wissenstest wählen:'),action('Bestanden · 4/5 simulieren',()=>finish(format,4)),action('Nicht bestanden · 3/5 simulieren',()=>finish(format,3)));
    } else if(active) {
      item.append(node('p','','Vorschau: '+moduleFor(row).description),action('Lernschritt abschliessen (Demo)',()=>finish(format)));
    } else {
      const labels={video:'Video starten',article:'Artikel lesen',quiz:row.correct===null?'Quiz absolvieren':'Quiz wiederholen',scenario:'Szenario öffnen',game:'Game ansehen'};
      item.append(action(labels[format],()=>{beginContent(row.id,format);refreshEmployeeAction(format);}));
    }
    function finish(format,correct) {finishContent(row.id,format,correct);refreshEmployeeAction(format);$('#employee-feedback').textContent=format==='quiz'?`Quiz: ${quizResult(row)} · ${row.correct}/${row.questions}.`:'Lernschritt abgeschlossen (Demo).';}
    list.append(item);
  });
  return list;
}
function refreshEmployeeAction(format) {
  refresh();
  const next=$(`#employee-content [data-format="${format}"] .dash-action`)||$('#employee-content .dash-action');next?.focus({preventScroll:true});
}
function renderEmployee() {
  const row=assignments.find(item=>item.id===$('#employee-person').value);
  if(!row)return;
  const stats=metrics([row]),card=node('article','employee-learning');
  card.append(node('p','',row.name+' · Beispielperson'),node('h3','','Meine Lernaufgaben'),node('p','',`${stats.open} offene Aufgabe · ${stats.completed} abgeschlossen`),progress(row.completedFormats.length,campaign.formats.length,'Lernschritte'),node('h3','',moduleFor(row).title),badge(row.status),learningPath(row),node('p','','Abschlussfrist: '+date(campaign.deadline)),node('p','quiz-result',quizResult(row)+(row.correct!==null?` · ${row.correct}/${row.questions}`:'')));
  if(row.status==='done')card.append(action('Meinen Musternachweis ansehen',()=> {
    $('#evidence-person').value=row.id;renderEvidence();selectTab('evidence',true);
  }));
  $('#employee-content').replaceChildren(card);
}
function report() {
  const stats=metrics(),paper=node('article','evidence-paper');
  paper.append(node('span','','DEMO / SCHULUNGSBERICHT'),node('h3','',campaign.title),node('p','','Nachvollziehbare Schulungsdokumentation für interne Kontrollen und Auditvorbereitung.'),fields([['Berichtszeitraum',date(campaign.start)+' – '+date(campaign.deadline)],['Zuweisungen',String(stats.people)],['Abschlüsse',String(stats.completed)],['Offene Aufgaben',String(stats.open)],['Abschlussquote',stats.rate+' %'],['Thema / Inhaltsversion',moduleFor(assignments[0]).topic+' / '+campaign.version],['Lernformate',campaign.formats.map(format=>formats[format]).join(' + ')],['Rhythmus',rhythms[campaign.rhythm]+(campaign.rhythm==='custom'?' · alle '+campaign.interval+' Monate':'')]]),node('p','evidence-note','Fiktive Beispieldaten dieser Demo. Quizresultate sind kein allgemeiner Sicherheitsnachweis; die Dokumentation garantiert kein Audit-Ergebnis.'));
  return paper;
}
function renderReports() {
  $('#report-content').replaceChildren(report(),teamProgress(),action('Musterbericht herunterladen',exportReport));
  $('#report-showcase').replaceChildren(report());
}
function exportReport() {
  const data= {
    notice:'DEMO – fiktive Daten, kein realer Schulungsnachweis',campaign: {
      ...campaign
    },metrics:metrics(),assignments:assignments.map(row=>( {
      ...row
    }))
  };
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)], {
    type:'application/json'
  })),a=node('a');
  a.href=url;
  a.download='swissploit-demo-schulungsbericht.json';
  a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function populatePeople(selector) {
  const select=$(selector),current=select.value;
  select.replaceChildren();
  for(const row of assignments) {
    const option=node('option','',row.name+' · '+statusLabels[row.status]);
    option.value=row.id;
    select.append(option);
  }
  if(assignments.some(row=>row.id===current))select.value=current;
}
function refresh() {
  populatePeople('#evidence-person');
  populatePeople('#employee-person');
  renderOverview();
  renderPeople();
  renderEvidence();
  renderEmployee();
  renderReports();
}
function builderConfig() {
  return  {
    moduleId:$('#package-module').value,formats:$$('#assignment-form [name="format"]:checked').map(input=>input.value),teamId:$('#package-team').value,rhythm:$('#package-rhythm').value,interval:Number($('#package-interval').value),start:$('#package-start').value,deadline:$('#package-deadline').value,reminders:$('#package-reminders').checked
  };
}
function renderBuilderFormats() {
  const module=modules.find(item=>item.id===$('#package-module').value);
  $('#package-formats').replaceChildren(...module.contents.map(format=>{
    const label=node('label'),input=node('input');input.type='checkbox';input.name='format';input.value=format;input.checked=true;
    label.append(input,contentIcon(format),node('span','',formats[format]));return label;
  }));
}
function updateBuilder() {
  const config=builderConfig(),module=modules.find(item=>item.id===config.moduleId),team=teams.find(item=>item.id===config.teamId);
  $('#interval-field').hidden=config.rhythm!=='custom';
  $('#package-interval').disabled=config.rhythm!=='custom';
  $('#package-deadline').min=config.start;
  $('#package-summary').textContent=`${module.title} · ${config.formats.map(format=>formats[format]).join(' + ')||'Bitte Inhalte auswählen'} · ${team?people.filter(person=>person.teamId===team.id).length:people.length} Mitarbeitende · ${rhythms[config.rhythm]}${config.rhythm==='custom'?' / alle '+config.interval+' Monate':''} · ${config.reminders?'Erinnerungen vorgesehen':'Keine Erinnerungen'} (Demo)`;
}
function populateModules() {
 for(const selector of ['#module-filter','#package-module']) {
  const current=$(selector).value;
  $(selector).replaceChildren();
  if(selector==='#module-filter') {const all=node('option','','Alle Lernpakete');all.value='all';$(selector).append(all);}
  for(const module of modules) {
    const option=node('option','',module.title);
    option.value=module.id;
    $(selector).append(option);
  }
  if([...$(selector).options].some(option=>option.value===current))$(selector).value=current;
 }
}
populateModules();
for(const team of [{id:'all',name:'Alle Mitarbeitenden'},...teams]) {
  const count=team.id==='all'?people.length:people.filter(person=>person.teamId===team.id).length;
  const option=node('option','',team.name+' · '+count);option.value=team.id;$('#package-team').append(option);
}
$('#package-module').addEventListener('change',()=>{renderBuilderFormats();updateBuilder();});
$('#simulate-upload').addEventListener('click',()=>{
  returnFocus=$('#simulate-upload');$('#module-dialog-title').textContent='Beispielinhalt hinzufügen';
  $('#module-detail').replaceChildren(node('p','','So könnte ein eigenes PDF mit Wissenstest in der Bibliothek erscheinen. Diese Simulation verwendet eine feste Beispieldatei und liest keine Dateien von deinem Gerät.'),fields([['Beispieldatei','homeoffice-richtlinie.pdf'],['Format','PDF + Quiz'],['Quelle','Eigene Unternehmensinhalte']]),action('Beispiel zur Bibliothek hinzufügen',()=>{
    const added=addExampleContent();populateModules();renderModules();dialog.close();$('#upload-status').textContent=added?'Beispielinhalt hinzugefügt. Du kannst ihn jetzt einem Lernpaket zuweisen.':'Der Beispielinhalt ist bereits in der Bibliothek.';
  }));dialog.showModal();
});
$('#view-assignments').addEventListener('click',()=>selectTab('people',true));
$('#assignment-form').addEventListener('input',updateBuilder);
$('#assignment-form').addEventListener('submit',event=> {
  event.preventDefault();try {
    const count=assignCampaign(builderConfig());$('#status-filter').value='all';$('#module-filter').value='all';$('#employee-feedback').textContent='';refresh();$('#assignment-feedback').textContent=`Lernpaket wurde in der Demo ${count} Mitarbeitenden zugewiesen. Alle Aufgaben sind zunächst offen. Du kannst jetzt einen späteren Lernstand simulieren.`;
  }
  catch(error) {
    $('#assignment-feedback').textContent=error.message;
  }
});
$('#simulate-progress').addEventListener('click',()=> {
  simulateProgress();refresh();$('#assignment-feedback').textContent=`Späterer Lernstand simuliert: ${metrics().completed} von ${metrics().people} Lernpaketen abgeschlossen. Alle Ansichten und Nachweise sind aktualisiert.`;
});
$('#reset-demo').addEventListener('click',()=> {
  resetDemo();populateModules();$('#assignment-form').reset();$('#package-module').value='phishing';$('#status-filter').value='all';$('#module-filter').value='all';renderBuilderFormats();updateBuilder();renderModules();refresh();$('#upload-status').textContent='';$('#employee-feedback').textContent='';$('#assignment-feedback').textContent=`Demo auf die Beispielkampagne mit ${people.length} Mitarbeitenden zurückgesetzt.`;
});
$('#employee-person').addEventListener('change',()=>{$('#employee-feedback').textContent='';renderEmployee();});
$('#evidence-person').addEventListener('change',renderEvidence);
['#status-filter','#module-filter'].forEach(selector=>$(selector).addEventListener('change',renderPeople));
renderBuilderFormats();updateBuilder();
renderModules();
refresh();
$('#dashboard-app').hidden=false;
document.body.dataset.dashboardReady='true';
