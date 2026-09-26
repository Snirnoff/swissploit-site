import assert from 'node:assert/strict';
import test from 'node:test';
import {readShorts,validateShorts} from './youtube-shorts.mjs';
// Operator-approved initial catalogue. Update explicitly when publishing a new Short.
const expected=['ndOP_bDpEvQ','rTf4mqmvhUc','VpfXJv_NNdM','ObA4FgMQiFg','OF4IE6k3a_w','uOx2rhu9N9Q','56XCKFtkbdU','-D0nMsvA0S4','zHyRgGsss7s','D7kBvkCEgqU','81h7NNerkEA','yCcgwlQyvEM','Sg2nFP_aDu0','ajXgS-ZX_6A','wxXif0Y6HTI'];
test('Exactly the 15 approved Shorts, in supplied order',async()=>{
  const videos=await readShorts();
  assert.equal(videos.length,15,'Initial catalogue must contain exactly 15 videos');
  assert.deepEqual(videos.map(v=>v.id),expected,'Catalogue must match the approved IDs and order');
  assert.equal(new Set(videos.map(v=>v.url)).size,15);
});
test('Reject empty IDs, duplicates, external URLs and ID mismatches',async()=>{
  const videos=await readShorts();
  for(const broken of [[],[null],[{...videos[0],id:''}],[videos[0],videos[0]],[{...videos[0],url:'https://example.com/shorts/'+videos[0].id}],[{...videos[0],url:videos[1].url}],[{...videos[0],url:videos[0].url+'?extra=true'}]])assert.throws(()=>validateShorts(broken),/YouTube/);
});
test('Optional metadata may be omitted or empty',()=>{
  assert.doesNotThrow(()=>validateShorts([{id:expected[0],url:'https://www.youtube.com/shorts/'+expected[0]}]));
});
