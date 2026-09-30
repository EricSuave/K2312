import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signUpSchema,signInSchema,adminResetSchema} from '../lib/member-validation';

const signup={player_id:'59360043',player_name:'Example',password:'test-only-long-password',consent:true};
test('registration accepts member ID and password without an email',()=>{
  assert.equal(signUpSchema.parse(signup).player_id,'59360043');
  assert.equal(signUpSchema.safeParse({...signup,email:'someone@example.com'}).success,false);
});
test('registration rejects missing consent, malformed IDs, and short passwords',()=>{
  for(const changes of [{consent:false},{player_id:'abc'},{password:'short'}])
    assert.equal(signUpSchema.safeParse({...signup,...changes}).success,false);
});
test('existing member ID and password sign-in remains accepted',()=>{
  assert.equal(signInSchema.safeParse({player_id:'59360043',password:'existing-password'}).success,true);
});
test('admin reset requires explicit in-game verification and a valid password',()=>{
  const reset={player_id:'59360043',password:'test-only-long-password',verified:true};
  assert.equal(adminResetSchema.safeParse(reset).success,true);
  assert.equal(adminResetSchema.safeParse({...reset,verified:false}).success,false);
  assert.equal(adminResetSchema.safeParse({...reset,password:'short'}).success,false);
});
