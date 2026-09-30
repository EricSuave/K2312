import {gearSteps,charmSteps} from './upgrade-data';
// Community data reviewed 2026-09-30 (not official developer documentation).
// https://kingshot.net/database/governor-gear
// https://ks-toolkit.com/data/gear/governor-gear/
// https://kingshot.net/database/governor-charm
// Full published game range, explicitly requested. Kingdom unlocks may lag.
export const equipmentReview = { checkedOn: "2026-09-30", charmMaximum:22, gearMaximum:"Red T6 · 3 stars" } as const;
export const gearSlots = [
  {id:'coat',label:'Coat',troop:'Infantry'},
  {id:'pants',label:'Pants',troop:'Infantry'},
  {id:'cap',label:'Cap',troop:'Cavalry'},
  {id:'watch',label:'Watch',troop:'Cavalry'},
  {id:'belt',label:'Belt',troop:'Archer'},
  {id:'weapon',label:'Weapon',troop:'Archer'},
] as const;
export const gearOptions=gearSteps.map(s=>({value:s.id,label:s.label}));
export const charmOptions=charmSteps.map(s=>({value:s.id,label:s.id==='0'?'Not unlocked / not equipped':s.label}));
