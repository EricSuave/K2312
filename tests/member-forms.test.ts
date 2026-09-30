import test from 'node:test';
import assert from 'node:assert/strict';
import {memberProfileSchema,prepFormSchema,signUpSchema} from '../lib/member-validation';
import {gearSlots,gearOptions,charmOptions} from '../data/equipment';

const profile={player_name:'Member',alliance:'404',troops:{Infantry:{tier:'T10',tg:'TG3'},Cavalry:{tier:'T10',tg:'TG3'},Archer:{tier:'T10',tg:'TG3'}},heroes:['Zoe'],gear:Object.fromEntries(gearSlots.map(slot=>[slot.id,gearOptions.at(-1)!.value])),charms:Object.fromEntries(gearSlots.map(slot=>[slot.id,Array(3).fill(charmOptions.at(-1)!.value)])),hero_power:0,pet_power:0,mystic_trial_score:0};
test('profile accepts full equipment maximums and rejects removed fields or unavailable progression',()=>{
  assert.equal(memberProfileSchema.safeParse(profile).success,true);
  for(const extra of [{power:1},{troop_count:1},{is_transfer:true}])assert.equal(memberProfileSchema.safeParse({...profile,...extra}).success,false);
  assert.equal(memberProfileSchema.safeParse({...profile,troops:{...profile.troops,Infantry:{tier:'T11',tg:'TG4'}}}).success,false);
  assert.equal(memberProfileSchema.safeParse({...profile,heroes:['Zoe','Zoe']}).success,false);
  assert.equal(memberProfileSchema.safeParse({...profile,gear:{...profile.gear,extra:'unknown'}}).success,false);
});
const prep={battle_date:'2026-10-03',construction_targets:['TG3'],truegold:100,construction_speedup_days:12.5,research_speedup_days:5,training_speedup_days:7.25,day_1_minister:'yes',day_2_minister:'no',day_4_minister:'no',day_1_times:['12:15'],day_2_times:[],day_4_times:[],day_5_times:[]};
test('prep preserves decimal days and validates appointment preferences',()=>{
  assert.equal(prepFormSchema.parse(prep).construction_speedup_days,12.5);
  for(const change of [{day_1_times:[]},{day_1_times:['12:15','12:15']},{day_5_times:['25:15']},{construction_speedup_days:-1},{is_transfer:false},{upgrade_materials:100}])assert.equal(prepFormSchema.safeParse({...prep,...change}).success,false);
});
test('open registration still requires a numeric member ID, private website password, and consent',()=>{
  const signup={player_id:'59360043',player_name:'Example',password:'a-separate-website-password',consent:true};
  assert.equal(signUpSchema.safeParse(signup).success,true);
  for(const change of [{player_id:'not-an-id'},{password:'short'},{consent:false},{role:'admin'}])assert.equal(signUpSchema.safeParse({...signup,...change}).success,false);
});
