import test from 'node:test';
import assert from 'node:assert/strict';
import { AlternatingRotation } from '../assets/homepage/rotation.js';
function harness(lengths=[10,10]) {
  let now=0,id=0; const pending=new Map(),events=[],positions=[0,0];
  const clock={now:()=>now,set:(fn,ms)=>{pending.set(++id,{fn,at:now+ms});return id},clear:id=>pending.delete(id)};
  const rotation=new AlternatingRotation({clock,change:list=>{positions[list.id]=(positions[list.id]+1)%list.length;events.push([now,list.id,positions[list.id]])}});
  rotation.configure(lengths.map((length,id)=>({id,length})));
  function advance(ms){const end=now+ms;while(true){const next=[...pending].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;now=next[1].at;pending.delete(next[0]);next[1].fn()}now=end}
  return {rotation,events,positions,pending,advance};
}
test('one scheduler uses nine-second slots and wraps',()=>{
  const h=harness([2,3]); h.advance(36000);
  assert.deepEqual(h.events,[[9000,0,1],[18000,1,1],[27000,0,0],[36000,1,2]]);
  h.advance(18000);assert.deepEqual(h.positions,[1,0]);assert.equal(h.pending.size,1);
});
test('interaction waits at least 20 seconds; active hover/focus and hidden pages do not catch up',()=>{
  const h=harness();h.advance(7500);h.rotation.interact();h.advance(19999);assert.equal(h.events.length,0);h.advance(1);assert.equal(h.events.length,1);
  h.rotation.pause('hover',true);h.rotation.pause('focus',true);h.advance(100000);h.rotation.pause('hover',false);assert.equal(h.pending.size,0);
  h.rotation.pause('focus',false);h.advance(8999);assert.equal(h.events.length,1);h.advance(1);assert.equal(h.events.length,2);
  h.rotation.pause('hidden',true);h.advance(100000);h.rotation.pause('hidden',false);assert.equal(h.events.length,2);h.advance(9000);assert.equal(h.events.length,3);
});
test('user/reduced-motion pauses, empty/single lists and cleanup are safe',()=>{
  const h=harness([1,0]);assert.equal(h.pending.size,0);h.rotation.configure([{id:0,length:1},{id:1,length:2}]);h.advance(9000);assert.equal(h.events[0][1],1);
  h.rotation.pause('reduced',true);h.rotation.pause('user',true);h.rotation.pause('reduced',false);h.advance(90000);assert.equal(h.events.length,1);
  h.rotation.pause('user',false);assert.equal(h.pending.size,1);h.rotation.destroy();assert.equal(h.pending.size,0);h.rotation.schedule();assert.equal(h.pending.size,0);
});
