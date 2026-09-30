import assert from 'node:assert/strict';
import test from 'node:test';
import {battleFormSchema as availabilitySchema} from '../lib/member-validation';

const player={event_date:'2026-10-03'};
const available={...player,attendance:'available',starts_at:'2026-10-03T10:00:00Z',ends_at:'2026-10-03T22:00:00Z',role:'Rally joiner'};

test('accepts the full battle boundaries and the castle window',()=>{
  assert.equal(availabilitySchema.safeParse(available).success,true);
  assert.equal(availabilitySchema.safeParse({...available,attendance:'tentative',starts_at:'2026-10-03T12:00:00Z',ends_at:'2026-10-03T17:00:00Z',role:'Garrison / reinforcement'}).success,true);
});

test('rejects windows outside battle hours or on another date',()=>{
  for(const change of [
    {starts_at:'2026-10-03T09:30:00Z'},
    {ends_at:'2026-10-03T22:30:00Z'},
    {starts_at:'2026-10-04T10:00:00Z',ends_at:'2026-10-04T12:00:00Z'},
    {ends_at:'2026-10-04T00:30:00Z'},
  ])assert.equal(availabilitySchema.safeParse({...available,...change}).success,false);
});

test('requires a complete, increasing window for available or tentative members',()=>{
  for(const change of [
    {ends_at:'2026-10-03T10:00:00Z'},
    {starts_at:'2026-10-03T18:00:00Z',ends_at:'2026-10-03T17:00:00Z'},
    {starts_at:undefined},
    {ends_at:undefined,attendance:'tentative'},
    {role:undefined},
  ])assert.equal(availabilitySchema.safeParse({...available,...change}).success,false);
});

test('unavailable members do not need a time or role, and stale windows are rejected',()=>{
  assert.equal(availabilitySchema.safeParse({...player,attendance:'unavailable'}).success,true);
  assert.equal(availabilitySchema.safeParse({...available,attendance:'unavailable'}).success,false);
});
