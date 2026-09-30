// Community scoring references, reviewed 2026-09-30. Confirm against the live event.
// https://www.kingshotguide.org/guide/kingshot-kvk-event
export const troopPrepPoints=[0,3,4,5,8,12,18,25,35,45,60] as const;
export type PrepRankingInput={truegold?:number;construction_speedup_days?:number;research_speedup_days?:number;training_speedup_days?:number;training_batch?:{tier:number;from_tier:number;quantity:number;duration_days:number}};
export function prepEstimate(p:PrepRankingInput,day:number):number|null {
  const valid=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  if(day===1)return valid(p.truegold)&&valid(p.construction_speedup_days)?Math.round(p.truegold*2000+p.construction_speedup_days*43200):null;
  if(day===2)return valid(p.research_speedup_days)?Math.round(p.research_speedup_days*43200):null;
  if(day===5){const a=prepEstimate(p,1),b=prepEstimate(p,2);return a===null||b===null?null:a+b;}
  if(day===4){
    if(p.training_speedup_days===0)return 0;
    const b=p.training_batch;
    if(!valid(p.training_speedup_days)||!b||!Number.isInteger(b.tier)||b.tier<1||b.tier>10||!Number.isInteger(b.from_tier)||b.from_tier<0||b.from_tier>=b.tier||!valid(b.quantity)||!Number.isInteger(b.quantity)||b.quantity===0||!valid(b.duration_days)||b.duration_days===0)return null;
    return Math.floor(p.training_speedup_days/b.duration_days*b.quantity)*(troopPrepPoints[b.tier]-troopPrepPoints[b.from_tier]);
  }
  return null;
}
