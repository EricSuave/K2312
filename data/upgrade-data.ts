import gear from './gear-costs.json';
import charms from './charm-costs.json';
import buildings from './building-costs.json';
export type UpgradeStep={id:string;label:string;cost:number[];requirement?:string};
export const checkedOn='2026-09-30';
export const gearSteps:UpgradeStep[]=[{id:'none',label:'Not equipped',cost:[0,0,0]},...gear];
export const charmSteps:UpgradeStep[]=[{id:'0',label:'Not equipped',cost:[0,0]},...charms];
export const buildingData=buildings;
export const gearResources=['Satin','Gilded Threads',"Artisan’s Vision"];
export const charmResources=['Charm Guides','Charm Designs'];
export const buildingResources=['Truegold','Wood','Bread','Stone','Iron','Speedup days'];
// Kingshot Data differs from the matching Kingshot.net / Kingshot Tips table here.
// Estimates use the matching pair, expose these flags and permit in-game overrides.
export const disputedGearSteps=['gold-t2-0','red-t2-3','red-t4-0','red-t5-0','red-t5-2','red-t5-3','red-t6-0'];
export const equipmentSources=[
 {label:'Kingshot.net · Governor Gear',url:'https://kingshot.net/database/governor-gear'},
 {label:'Kingshot Tips · Gear ladder',url:'https://kingshottips.com/gear/governor-gear'},
 {label:'Kingshot.net · Governor Charms',url:'https://kingshot.net/database/governor-charm'},
];
