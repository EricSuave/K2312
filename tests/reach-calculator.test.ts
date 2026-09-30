import test from 'node:test';
import assert from 'node:assert/strict';
import {planReach,constructionSteps} from '../lib/reach-calculator';
import {gearSteps,charmSteps,buildingData} from '../data/upgrade-data';
import {gearOptions,charmOptions} from '../data/equipment';

test('profile maximums match the full cost ladders',()=>{
 assert.equal(gearOptions.at(-1)?.value,'red-t6-3');assert.equal(charmOptions.at(-1)?.value,'22');
 assert.equal(gearSteps.length,59);assert.equal(charmSteps.length,23);
});
test('exact budget crosses two charm upgrades without charging the owned level',()=>{
 const plan=planReach(charmSteps,0,2,[45,20]);assert.equal(plan.reached,2);assert.deepEqual(plan.spent,[45,20]);assert.deepEqual(plan.remaining,[0,0]);assert.deepEqual(plan.nextShortfall,[60,40]);
 const alreadyOwned=planReach(charmSteps,1,2,[40,15]);assert.equal(alreadyOwned.reached,2);assert.deepEqual(alreadyOwned.targetCost,[40,15]);
});
test('all resources constrain reach and target deficits use the original budget',()=>{
 const plan=planReach(charmSteps,0,3,[1000,4]);assert.equal(plan.reached,0);assert.deepEqual(plan.nextShortfall,[0,1]);assert.deepEqual(plan.targetShortfall,[0,56]);
});
test('identical gear pieces consume a shared inventory',()=>{
 const plan=planReach(gearSteps,0,2,[31800,330,0],6);assert.equal(plan.reached,2);assert.deepEqual(plan.remaining,[0,0,0]);assert.deepEqual(plan.targetCost,[31800,330,0]);
});
test('TG1 includes five substeps; time budget stays in days',()=>{
 const town=buildingData.find(b=>b.id==='town-center')!.steps;
 const plan=planReach(town,29,34,[660,335e6,335e6,65e6,16.5e6,35]);assert.equal(plan.reached,34);assert.equal(town[plan.reached].label,'TG1');assert.deepEqual(plan.targetCost,[660,335e6,335e6,65e6,16.5e6,35]);
 const partial=planReach(town,29,34,[660,335e6,335e6,65e6,16.5e6,7]);assert.equal(partial.reached,30);assert.equal(town[30].label,'TG1 · step 1/5');
 const noTimeLimit=planReach(town,29,34,[660,335e6,335e6,65e6,16.5e6,0],1,[true,true,true,true,true,false]);assert.equal(noTimeLimit.reached,34);assert.equal(noTimeLimit.spent[5],35);
});
test('construction modifiers exclude Truegold and divide time by speed factor',()=>{
 const town=constructionSteps(buildingData[0].steps,100,10);assert.equal(town[30].cost[0],132);assert.equal(town[30].cost[1],60300000);assert.equal(town[30].cost[5],3.5);
});
test('maximum reached, bad inputs, and budget monotonicity',()=>{
 const max=planReach(gearSteps,58,58,[0,0,0]);assert.equal(max.reached,58);assert.equal(max.nextShortfall,null);
 assert.throws(()=>planReach(charmSteps,0,2,[-1,1]));assert.throws(()=>planReach(charmSteps,0,2,[Infinity,1]));assert.throws(()=>planReach(charmSteps,0,2,[1,1],1.5));assert.throws(()=>planReach(charmSteps,23,23,[1,1]));
 let last=0;for(let budget=0;budget<=10000;budget+=100){const next=planReach(charmSteps,0,22,[budget,budget]);assert.ok(next.reached>=last);assert.ok(next.spent.every(v=>v<=budget));last=next.reached;}
 assert.ok(buildingData.every(b=>b.steps.at(-1)?.label==='TG3'));
});
