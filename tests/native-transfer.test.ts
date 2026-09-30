import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transferSchema} from '../lib/validation';
import {signUpSchema} from '../lib/member-validation';
import {getExternalTransferUrl} from '../data/transfers';
test('transfer application works without an alliance choice',()=>{
 const input={player_id:'12345678',player_name:'Example',current_kingdom:999,preferred_times:'12:00–18:00 UTC',kvk_participation:'Prep and battle',languages:'English',contact:'In-game ID 12345678',consent:true,request_id:'e1e7a4f7-d86e-4ea0-a46c-9a392a726891'};
 assert.equal(transferSchema.parse(input).preferred_alliance,'No preference');
 assert.equal(transferSchema.safeParse({...input,contact:''}).success,false);
 assert.equal(transferSchema.safeParse({...input,website:'spam'}).success,false);
 assert.equal(getExternalTransferUrl(),null);
});
test('registration no longer requires or accepts an alliance selection',()=>{
 const input={player_id:'12345678',player_name:'Example',password:'a-long-test-password',consent:true};
 assert.equal(signUpSchema.safeParse(input).success,true);
 assert.equal(signUpSchema.safeParse({...input,alliance:'404'}).success,false);
});
