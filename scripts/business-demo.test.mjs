import test from 'node:test';
import assert from 'node:assert/strict';
import { assignments, modules, metrics, selectAssignments, campaign, assignCampaign, simulateProgress, completeAssignment, resetDemo, schedulePreview, beginContent, finishContent, quizResult, addExampleContent } from '../assets/business/demo-data.js';
import { loadLearnArticles } from '../assets/homepage/content.js';

test('demo assignments, outcomes and evidence remain internally consistent', () => {
  assert.deepEqual(metrics(), { people: 25, completed: 19, open: 6, rate: 76 });
  assert.equal(new Set(assignments.map(row => row.id)).size, 25);
  for (const row of assignments) {
    assert.ok(modules.some(module => module.id === row.moduleId));
    if (row.status === 'done') {
      assert.ok(row.completedAt >= row.assignedAt);
      assert.ok(row.correct / row.questions * 100 >= campaign.passPercent);
    } else { assert.equal(row.completedAt, null); if(row.correct!==null)assert.equal(quizResult(row),'Nicht bestanden'); }
  }
  for (const module of modules) {
    const rows = selectAssignments({ moduleId: module.id });
    assert.equal(metrics(rows).people, module.id === campaign.moduleId ? 25 : 0);
    assert.equal(metrics(rows).open + metrics(rows).completed, rows.length);
  }
  assert.deepEqual(metrics(selectAssignments({ moduleId: 'unknown' })), { people: 0, completed: 0, open: 0, rate: 0 });
  assert.equal(selectAssignments({ status: 'open' }).length + selectAssignments({ status: 'progress' }).length, 6);
});

test('article ordering uses publication date and optional valid featured slug', async t => {
  const makePost = (slug,date,updated) => ({ slug,date,updated,thumb:'assets/example.webp',i18n:{de:{title:slug}},urls:{de:'https://swissploit.ch/blog/'+slug+'/'} });
  t.mock.method(globalThis,'fetch',async () => ({ ok:true,text:async () => 'window.SWISSPLOIT_BLOG_POSTS = '+JSON.stringify([
    makePost('older','2026-01-01','2026-10-01'), makePost('newer','2026-02-01','2026-02-01')
  ])+';' }));
  assert.deepEqual((await loadLearnArticles('')).map(p=>p.slug),['newer','older']);
  assert.deepEqual((await loadLearnArticles('older')).map(p=>p.slug),['older','newer']);
  assert.deepEqual((await loadLearnArticles('missing')).map(p=>p.slug),['newer','older']);
});

test('campaign assignment, team selection, simulated progress and individual evidence share one state',()=>{
  resetDemo();
  const config={...campaign,formats:['video','scenario','quiz'],teamId:'hr',moduleId:'ai',start:'2026-11-01',deadline:'2026-11-20'};
  assert.equal(assignCampaign(config),5);
  assert.deepEqual(metrics(),{people:5,completed:0,open:5,rate:0});
  assert.ok(assignments.every(row=>row.teamId==='hr'&&row.moduleId==='ai'&&row.correct===null));
  simulateProgress();assert.equal(metrics().completed,4);
  const open=assignments.find(row=>row.status!=='done');completeAssignment(open.id);
  assert.equal(metrics().rate,100);assert.equal(open.completedAt,'2026-11-20');
  assert.equal(open.questions,5);assert.ok(open.correct>=4);
  assert.throws(()=>assignCampaign({...config,deadline:'2026-10-01'}));
  assert.throws(()=>assignCampaign({...config,formats:[]}));
  assert.throws(()=>assignCampaign({...config,start:'2026-02-31'}));
  assert.throws(()=>assignCampaign({...config,rhythm:'custom',interval:0}));
  assert.equal(metrics().people,5,'Invalid assignment cannot replace the existing campaign');
  assignCampaign({...config,teamId:'it',formats:['video']});simulateProgress();
  assert.equal(metrics().people,7);assert.ok(assignments.every(row=>row.questions===0&&row.correct===null));
  resetDemo();assert.equal(metrics().people,25);
});

test('learner progress, failed quiz and retry update the same assignment without a premature certificate',()=>{
  resetDemo();assignCampaign({...campaign,formats:['video','quiz'],moduleId:'mfa',teamId:'hr'});
  const row=assignments[0];
  beginContent(row.id,'video');assert.equal(row.status,'progress');
  finishContent(row.id,'video');assert.deepEqual(row.completedFormats,['video']);
  finishContent(row.id,'quiz',3);assert.equal(quizResult(row),'Nicht bestanden');
  assert.equal(row.completedAt,null);assert.equal(metrics().completed,0);
  finishContent(row.id,'quiz',4);assert.equal(quizResult(row),'Bestanden');
  assert.equal(row.status,'done');assert.equal(row.completedAt,campaign.deadline);assert.equal(metrics().completed,1);
  finishContent(row.id,'quiz',4);assert.equal(row.completedFormats.length,2);
  const before=structuredClone(assignments);
  assert.throws(()=>assignCampaign({...campaign,formats:['article']}),/verfügbaren Inhalt/);
  assert.deepEqual(assignments,before);
  resetDemo();
});

test('own example content joins the existing assignment flow and reset removes only the simulated addition',()=>{
  resetDemo();assert.equal(addExampleContent(),true);assert.equal(addExampleContent(),false);
  assignCampaign({...campaign,moduleId:'own-policy',formats:['article','quiz'],teamId:'it'});
  assert.equal(metrics().people,7);assert.ok(assignments.every(row=>row.moduleId==='own-policy'));
  resetDemo();assert.ok(!modules.some(module=>module.id==='own-policy'));assert.ok(modules.some(module=>module.id==='internal'));
});
test('calendar handles month ends, quarters and once without scheduling real work',()=>{
  assert.deepEqual(schedulePreview({start:'2027-01-31',rhythm:'monthly'}).slice(0,3).map(item=>item.date),['2027-01-31','2027-02-28','2027-03-31']);
  assert.equal(schedulePreview({start:'2027-01-15',rhythm:'quarterly'})[1].date,'2027-04-15');
  assert.equal(schedulePreview({start:'2027-01-15',rhythm:'once'}).length,1);
});
