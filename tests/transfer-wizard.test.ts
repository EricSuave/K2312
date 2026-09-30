import test from 'node:test';
import assert from 'node:assert/strict';
import {applicationDetailsSchema,transferApplicationSchema,imageType} from '../lib/transfer-application';
const details={intake_month:'2026-10',troop_tier:'T10',truegold_level:'TG3',truegold_available:200,mystic_trial_stages:40,transfer_passes_owned:2,transfer_passes_required:null,active_events:'Yes',save_for_kvk:'Yes',battle_participation:'Sometimes',spending:'Prefer not to say'};
test('transfer progression rejects later content and removed fields',()=>{
 assert.equal(applicationDetailsSchema.safeParse(details).success,true);
 for(const patch of [{troop_tier:'T11'},{truegold_level:'TG4'},{tg_dust:10},{total_power:100},{troop_count:100},{truegold_available:-1},{intake_month:'2026-13'}])
 assert.equal(applicationDetailsSchema.safeParse({...details,...patch}).success,false);
});
test('all six destination alliances and no preference are valid',()=>{
 const base={player_name:'Example',player_id:'12345678',contact:'Discord example',consent:true,request_id:'e1e7a4f7-d86e-4ea0-a46c-9a392a726891',current_kingdom:123,preferred_times:'12:00 UTC',kvk_participation:'Prep and castle',languages:'English',details};
 for(const preferred_alliance of ['404','401','FXF','BLO','OMG','GLX','No preference'])assert.equal(transferApplicationSchema.safeParse({...base,preferred_alliance}).success,true);
 assert.equal(transferApplicationSchema.safeParse({...base,preferred_alliance:'710'}).success,false);
 assert.equal(transferApplicationSchema.safeParse({...base,details:undefined}).success,false);
});
test('image checks reject HTML and accept supported signatures',()=>{
 assert.equal(imageType(new TextEncoder().encode('<script>alert(1)</script>')),null);
 assert.equal(imageType(new Uint8Array([255,216,255,0])),'jpeg');
 assert.equal(imageType(new Uint8Array([137,80,78,71,13,10,26,10])),'png');
 assert.equal(imageType(new TextEncoder().encode('RIFF0000WEBP')),'webp');
});
