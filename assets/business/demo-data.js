// Entirely fictitious, deterministic fixtures. No storage, accounts or API calls.
export const modules = [
  { id: 'phishing', title: 'Phishing Basics', topic: 'Phishing erkennen', format: 'Video + Quiz', minutes: 5, level: 'Grundlagen', version: '1.2', testVersion: 'PH-1.1', description: 'Absender, Links und Zeitdruck prüfen. An einem Beispiel entscheiden, wie eine verdächtige Nachricht gemeldet wird.' },
  { id: 'mfa', title: 'MFA & Passwörter', topic: 'Sichere Passwörter und MFA', format: 'Video + Quiz', minutes: 6, level: 'Grundlagen', version: '1.0', testVersion: 'MFA-1.0', description: 'Einzigartige Passwörter und zusätzliche Anmeldefaktoren kennenlernen. Unerwartete MFA-Anfragen richtig einordnen.' },
  { id: 'ai', title: 'KI und Social Engineering', topic: 'KI-gestützte Betrugsversuche', format: 'Kurzvideo + Wissenstest', minutes: 7, level: 'Grundlagen', version: '1.0', testVersion: 'KI-1.0', description: 'Eine manipulierte Stimme oder Nachricht erkennen: Identität über einen unabhängigen Kontaktweg überprüfen.' },
  { id: 'm365', title: 'Microsoft 365 sicher nutzen', topic: 'Microsoft 365 im Arbeitsalltag', format: 'Artikel + Quiz', minutes: 8, level: 'Fortgeschritten', version: '1.1', testVersion: 'M365-1.0', description: 'Anmeldeseiten prüfen, Freigaben bewusst setzen und verdächtige Aufforderungen intern melden.' },
  { id: 'privacy', title: 'Datenschutz im Arbeitsalltag', topic: 'Personendaten bewusst behandeln', format: 'Artikel + Quiz', minutes: 6, level: 'Grundlagen', version: '1.0', testVersion: 'DS-1.0', description: 'Personendaten gezielt teilen, Zuständigkeiten kennen und Löschanfragen intern weiterleiten.' },
  { id: 'ceo', title: 'CEO Fraud erkennen', topic: 'Social Engineering', format: 'Video + Szenario', minutes: 5, level: 'Grundlagen', version: '1.0', testVersion: 'CEO-1.0', description: 'Eine dringende Zahlungsanweisung hinterfragen und den vorgesehenen Freigabeprozess einhalten.' }
];
export const teams = [ { id:'verwaltung', name:'Verwaltung', count:10 }, { id:'hr', name:'HR', count:5 }, { id:'leitung', name:'Geschäftsleitung', count:3 }, { id:'it', name:'IT-Team', count:7 } ];
const names = ['Anna M.', 'Marco S.', 'Lea B.', 'Daniel R.', 'Noah K.', 'Mia T.', 'Luca F.', 'Emma W.', 'Nina Z.', 'Jan H.', 'Sara L.', 'Tim D.', 'Lina P.', 'Leon A.', 'Eva C.', 'Jonas V.', 'Laura G.', 'Nico E.', 'Elena J.', 'David U.', 'Alina N.', 'Simon O.', 'Julia I.', 'Lars Q.', 'Sofia Y.'];
export const people = names.map((name,i)=>({id:'DEMO-'+String(i+1).padStart(2,'0'),name,teamId:i<10?'verwaltung':i<15?'hr':i<18?'leitung':'it'}));
export const formats = { video:'Video', article:'Artikel', scenario:'Praxis-Szenario', game:'Game', quiz:'Quiz' };
const moduleContents = { phishing:['video','article','quiz'], mfa:['video','quiz'], ai:['video','scenario','quiz'], m365:['article','video','quiz'], privacy:['article','quiz'], ceo:['video','scenario','quiz'] };
for (const module of modules) {
  module.contents = moduleContents[module.id];
  module.source = 'swissploit';
}
modules[0].title = 'Phishing erkennen';
modules[2].title = 'KI-Betrug verstehen';
modules.push({ id:'escape', title:'Phish Escape', topic:'Phishing-Entscheidungen üben', contents:['game','quiz'], source:'swissploit', minutes:8, level:'Grundlagen', version:'1.0', testVersion:'PE-1.0', description:'Links und Kontext prüfen und verdächtige Nachrichten melden.' });
modules.push({ id:'internal', title:'Unser interner Meldeweg', topic:'Interne Sicherheitsprozesse', contents:['video','article','quiz'], source:'own', minutes:6, level:'Grundlagen', version:'1.0', testVersion:'INT-1.0', description:'Beispielrichtlinie: Zuständige Kontaktstelle finden und einen Verdacht intern melden.' });
export function addExampleContent() {
  if (modules.some(module=>module.id==='own-policy')) return false;
  modules.push({ id:'own-policy', title:'Sicher arbeiten im Homeoffice', topic:'Interne Verhaltensregeln', contents:['article','quiz'], source:'own', minutes:5, level:'Grundlagen', version:'1.0', testVersion:'OWN-1.0', description:'Fiktives PDF und Wissenstest zu Geräten, vertraulichen Dokumenten und Meldewegen.' });
  return true;
}
export const rhythms = { once:'Einmalig', monthly:'Monatlich', quarterly:'Quartalsweise', custom:'Individuell' };
export const statusLabels = { done:'Abgeschlossen', progress:'In Bearbeitung', open:'Offen' };
export const campaign = { company:'Beispielunternehmen', assignedBy:'Demo-Verantwortliche', passPercent:80 };
export const assignments = [];
const initial = { moduleId:'phishing', formats:['video','article','quiz'], teamId:'all', rhythm:'monthly', interval:2, start:'2026-10-01', deadline:'2026-10-28', reminders:true };
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value; }
export function assignCampaign(config) {
  if (!modules.some(module=>module.id===config.moduleId)) throw Error('Bitte einen Lerninhalt auswählen.');
  const selectedModule = modules.find(module=>module.id===config.moduleId);
  if (!config.formats?.length || config.formats.some(format=>!selectedModule.contents.includes(format))) throw Error('Bitte mindestens einen verfügbaren Inhalt auswählen.');
  if (config.teamId!=='all' && !teams.some(team=>team.id===config.teamId)) throw Error('Bitte eine Beispielgruppe auswählen.');
  if (!Object.hasOwn(rhythms,config.rhythm) || (config.rhythm==='custom' && (!Number.isInteger(config.interval)||config.interval<1||config.interval>12))) throw Error('Bitte einen gültigen Rhythmus auswählen (1–12 Monate).');
  if (!validDate(config.start)||!validDate(config.deadline)||config.deadline<config.start) throw Error('Die Abschlussfrist muss am oder nach dem Startdatum liegen.');
  const module = modules.find(item=>item.id===config.moduleId);
  Object.assign(campaign, config, { formats:[...new Set(config.formats)], title:(config.rhythm==='monthly'?'Monatliche Schulung · ':'Lernpaket · ')+module.topic, period:config.start+' – '+config.deadline, id:'DEMO-CAMPAIGN', version:module.version });
  assignments.splice(0,assignments.length,...people.filter(person=>config.teamId==='all'||person.teamId===config.teamId).map(person=>({ ...person, moduleId:module.id, assignedAt:config.start, completedAt:null, status:'open', correct:null, questions:config.formats.includes('quiz')?5:0, completedFormats:[], activeFormat:null, history:['Zuweisung simuliert'] })));
  return assignments.length;
}
export function completeAssignment(id) {
  const row=assignments.find(row=>row.id===id);
  if (!row || row.status==='done') return;
  Object.assign(row,{status:'done',completedAt:campaign.deadline,correct:row.questions ? 4+Number(id.slice(-2))%2 : null,completedFormats:[...campaign.formats],activeFormat:null});
  row.history.push(...(row.questions?['Wissenstest simuliert']:[]),'Abschluss simuliert');
}
export function simulateProgress() {
  const completed = Math.round(assignments.length*.76);
  assignments.forEach((row,index)=>{
    if (index<completed) completeAssignment(row.id);
    else if (row.status==='open' && (index%2 || index===completed)) {
      row.status='progress';row.history.push('Lernpaket begonnen (Demo)');
      row.completedFormats=campaign.formats.filter(format=>format!=='quiz').slice(0,1);
      if(index===completed && row.questions) { row.correct=3;row.history.push('Quiz nicht bestanden (Demo)'); }
    }
  });
}
export function resetDemo() { const added=modules.findIndex(module=>module.id==='own-policy');if(added>=0)modules.splice(added,1);assignCampaign(initial);simulateProgress(); }
export function beginContent(id,format) {
  const row=assignments.find(item=>item.id===id);
  if(!row || !campaign.formats.includes(format) || row.completedFormats.includes(format))return;
  row.status='progress';row.activeFormat=format;
}
export function finishContent(id,format,correct=4) {
  const row=assignments.find(item=>item.id===id);
  if(!row || !campaign.formats.includes(format) || row.status==='done' || row.completedFormats.includes(format))return;
  if(format==='quiz' && (!Number.isInteger(correct)||correct<0||correct>row.questions))throw Error('Ungültiges Testresultat.');
  row.status='progress';row.activeFormat=null;
  if(format==='quiz') {
    row.correct=correct;
    row.history.push('Quiz '+(correct/row.questions*100>=campaign.passPercent?'bestanden':'nicht bestanden')+' (Demo)');
    if(correct/row.questions*100<campaign.passPercent)return;
  }
  if(!row.completedFormats.includes(format))row.completedFormats.push(format);
  if(campaign.formats.every(item=>row.completedFormats.includes(item))) {
    row.status='done';row.completedAt=campaign.deadline;row.history.push('Abschluss simuliert');
  }
}
export function quizResult(row) { return !row.questions?'Ohne Wissenstest':row.correct===null?'Noch nicht geprüft':row.correct/row.questions*100>=campaign.passPercent?'Bestanden':'Nicht bestanden'; }
export function selectAssignments({status='all',moduleId='all',teamId='all'}={}) { return assignments.filter(row=>(status==='all'||row.status===status)&&(moduleId==='all'||row.moduleId===moduleId)&&(teamId==='all'||row.teamId===teamId)); }
export function metrics(rows=assignments) { const completed=rows.filter(row=>row.status==='done').length;return {people:new Set(rows.map(row=>row.id)).size,completed,open:rows.length-completed,rate:rows.length?Math.round(completed/rows.length*100):0}; }
export function schedulePreview({start=campaign.start,rhythm=campaign.rhythm,interval=campaign.interval}={}) {
  const topics=['Phishing erkennen','Passwörter und MFA','KI-Betrug verstehen','CEO Fraud','Microsoft 365'];
  const step=rhythm==='once'?0:rhythm==='quarterly'?3:rhythm==='custom'?interval:1;
  return topics.slice(0,step?5:1).map((topic,i)=>{ const d=new Date(start+'T12:00:00Z');const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+i*step);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return {date:d.toISOString().slice(0,10),topic}; });
}
resetDemo();
