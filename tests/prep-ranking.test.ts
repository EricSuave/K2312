import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepEstimate} from '../lib/prep-ranking';
test('construction/research use days and overflow is an alternative',()=>{
 const p={truegold:100,construction_speedup_days:2,research_speedup_days:0.5};
 assert.equal(prepEstimate(p,1),286400);assert.equal(prepEstimate(p,2),21600);assert.equal(prepEstimate(p,5),308000);assert.equal(prepEstimate(p,3),null);
});
test('training needs a batch and promotions only earn the tier difference',()=>{
 assert.equal(prepEstimate({training_speedup_days:10},4),null);
 assert.equal(prepEstimate({training_speedup_days:0},4),0);
 const p={training_speedup_days:2,training_batch:{tier:10,from_tier:0,quantity:1000,duration_days:0.5}};
 assert.equal(prepEstimate(p,4),240000);
 assert.equal(prepEstimate({...p,training_batch:{...p.training_batch,from_tier:9}},4),60000);
 assert.equal(prepEstimate({...p,training_batch:{...p.training_batch,duration_days:0}},4),null);
 assert.equal(prepEstimate({...p,training_batch:{...p.training_batch,tier:11}},4),null);
});
