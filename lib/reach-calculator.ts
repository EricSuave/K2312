import type {UpgradeStep} from '@/data/upgrade-data';
export type ReachPlan={reached:number;spent:number[];remaining:number[];nextShortfall:number[]|null;targetCost:number[];targetShortfall:number[]};
export function planReach(steps:UpgradeStep[],current:number,target:number,owned:number[],quantity=1,limits:boolean[]=owned.map(()=>true)):ReachPlan{
 const cols=owned.length;
 if(!steps.length||!Number.isInteger(current)||current<0||current>=steps.length||!Number.isInteger(target)||target<current||target>=steps.length)throw new Error('Choose valid current and target levels.');
 if(!Number.isInteger(quantity)||quantity<1||quantity>18)throw new Error('Choose 1–18 identical items.');
 if(!cols||limits.length!==cols||owned.some(v=>!Number.isFinite(v)||v<0||v>1e12))throw new Error('Enter a valid non-negative inventory for every resource.');
 if(steps.some(s=>s.cost.length!==cols||s.cost.some(v=>!Number.isFinite(v)||v<0||v>1e12)))throw new Error('Every upgrade needs valid costs for all resources.');
 const spent=owned.map(()=>0);let reached=current;
 for(let level=current+1;level<steps.length;level++){
  const next=steps[level].cost.map(v=>v*quantity);
  if(next.some((v,j)=>limits[j]&&spent[j]+v>owned[j]+1e-8))break;
  next.forEach((v,j)=>spent[j]+=v);reached=level;
 }
 const remaining=owned.map((v,j)=>limits[j]?Math.max(0,v-spent[j]):v);
 const targetCost=owned.map((_,j)=>steps.slice(current+1,target+1).reduce((sum,s)=>sum+s.cost[j]*quantity,0));
 return {reached,spent,remaining,nextShortfall:reached===steps.length-1?null:steps[reached+1].cost.map((v,j)=>limits[j]?Math.max(0,v*quantity-remaining[j]):0),targetCost,targetShortfall:targetCost.map((v,j)=>limits[j]?Math.max(0,v-owned[j]):0)};
}
export function constructionSteps(steps:UpgradeStep[],speedBonus:number,resourceDiscount:number):UpgradeStep[]{
 if(!Number.isFinite(speedBonus)||speedBonus<0||speedBonus>2000||!Number.isFinite(resourceDiscount)||resourceDiscount<0||resourceDiscount>99)throw new Error('Use a speed bonus of 0–2,000% and a resource reduction of 0–99%.');
 return steps.map(s=>({...s,cost:s.cost.map((v,i)=>i===0?v:i===5?v/(1+speedBonus/100):Math.ceil(v*(1-resourceDiscount/100)))}));
}
