'use client';
import {useState,type FormEvent} from 'react';
import {allowedHeroNames} from '@/data/heroes';
import {gearSlots,gearOptions,charmOptions} from '@/data/equipment';
import {truegoldLevels,troopTiers} from '@/data/progression';
import {alliances} from '@/data/kingdom';
import {memberProfileSchema,type MemberProfile as ProfileValues} from '@/lib/member-validation';
import {FormBack,FormLoadState} from './member-form-fields';
import {useMember,MemberSaveNotice} from './member-session';
import {useMemberForm} from './use-member-form';
import {SearchSelect} from './search-select';
const types=['Infantry','Cavalry','Archer'] as const;

export function MemberProfile(){
  const saved=useMemberForm<ProfileValues>('profile');
  if(saved.loading||saved.loadFailed)return <FormLoadState loading={saved.loading} message={saved.status} retry={saved.retry}/>;
  return <ProfileEditor key={saved.revision} saved={saved}/>;
}
function ProfileEditor({saved}:{saved:ReturnType<typeof useMemberForm<ProfileValues>>}){
  const{member}=useMember();const initial=saved.initial;
  const[selected,setSelected]=useState<string[]>(initial?.heroes??[]);const[search,setSearch]=useState('');
  const heroes=[...allowedHeroNames].sort().filter(name=>name.toLowerCase().includes(search.trim().toLowerCase()));
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const values=new FormData(event.currentTarget);
    const result=memberProfileSchema.safeParse({
      player_name:values.get('player_name'),alliance:values.get('alliance'),heroes:selected,
      troops:Object.fromEntries(types.map(type=>[type,{tier:values.get(`${type}_tier`),tg:values.get(`${type}_tg`)}])),
      gear:Object.fromEntries(gearSlots.map(slot=>[slot.id,values.get(`gear_${slot.id}`)])),
      charms:Object.fromEntries(gearSlots.map(slot=>[slot.id,[1,2,3].map(number=>values.get(`charm_${slot.id}_${number}`))])),
      hero_power:Number(values.get('hero_power')),pet_power:Number(values.get('pet_power')),mystic_trial_score:Number(values.get('mystic_trial_score')),
    });
    if(!result.success){saved.setError(true);saved.setStatus(result.error.issues[0].message);return;}
    await saved.save(result.data);
  }
  return <form className="profile-form" onSubmit={submit}>
    <FormBack/><MemberSaveNotice/>
    <section><div className="eyebrow">01 / ACCOUNT DETAILS</div><h2>Your player profile</h2><div className="form-grid">
      <label>Player name<input name="player_name" required defaultValue={initial?.player_name??member?.player_name??''} maxLength={80}/></label>
      <label>Member ID<input name="player_id" required inputMode="numeric" pattern="[0-9]{3,20}" maxLength={20} defaultValue={member?.player_id??''} readOnly={!!member}/></label>
      <label>Alliance<select name="alliance" required defaultValue={initial?.alliance??member?.alliance??''}><option value="" disabled>Select your alliance</option>{alliances.map(alliance=><option key={alliance.tag}>{alliance.tag}</option>)}</select></label>
    </div></section>
    <section><div className="eyebrow">02 / ARMY STRENGTH</div><h2>Troop levels</h2><p>Kingdom 2312 supports troops through T10 and Truegold levels through TG3.</p><div className="three-grid">{types.map(type=><fieldset key={type}><legend>{type}</legend>
      <label>Highest troop tier<select name={`${type}_tier`} defaultValue={initial?.troops[type]?.tier??''}><option value="">Not specified</option>{troopTiers.map(tier=><option key={tier}>{tier}</option>)}</select></label>
      <label>Truegold level<select name={`${type}_tg`} defaultValue={initial?.troops[type]?.tg??''}><option value="">Not specified</option>{truegoldLevels.map(level=><option key={level}>{level}</option>)}</select></label>
    </fieldset>)}</div></section>
    <section><div className="eyebrow">03 / HERO ROSTER</div><h2>Your battle-ready heroes</h2>
      <p id="hero-requirement">Select only heroes with <strong>at least 4 stars and a level-5 skill</strong>. All available Generation 1–2 heroes are in one list.</p>
      <label>Search heroes<input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search by hero name…"/></label>
      <fieldset className="hero-selection" aria-describedby="hero-requirement"><legend>Eligible heroes</legend><div>{heroes.map(name=><button key={name} className={`filter ${selected.includes(name)?'active':''}`} type="button" aria-pressed={selected.includes(name)} onClick={()=>setSelected(selected.includes(name)?selected.filter(value=>value!==name):[...selected,name])}>{name}</button>)}</div>{!heroes.length&&<p>No matching heroes. Try another name.</p>}</fieldset>
      <p aria-live="polite">{selected.length} eligible heroes selected{selected.length>0&&`: ${[...selected].sort().join(', ')}`}</p><p className="field-help">Leave the list empty if none of your heroes meet both requirements.</p>
    </section>
    <section><div className="eyebrow">04 / GOVERNOR EQUIPMENT</div><h2>Governor Gear</h2><p>Search by color, tier, or stars and choose the level shown on each piece.</p><div className="form-grid">{gearSlots.map(slot=><SearchSelect key={slot.id} name={`gear_${slot.id}`} label={`${slot.label} · ${slot.troop}`} options={gearOptions} initialValue={initial?.gear[slot.id]??''}/>)}</div><p className="field-help">Green through Red / Legendary T6, 3 stars. Choose gear you currently own; leave an unknown level blank.</p></section>
    <section><div className="eyebrow">05 / CHARMS</div><h2>Charm levels</h2><p>Three charms per gear piece. Choose each charm’s current level.</p>{gearSlots.map(slot=><fieldset key={slot.id}><legend>{slot.label} · {slot.troop}</legend><div className="form-grid three">{[1,2,3].map(number=><label key={number}>Charm {number}<select name={`charm_${slot.id}_${number}`} defaultValue={initial?.charms[slot.id]?.[number-1]??''}><option value="">Not specified</option>{charmOptions.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}</div></fieldset>)}<p className="field-help">Full game range: not equipped and levels 1–22.</p></section>
    <section><div className="eyebrow">06 / ADDITIONAL DETAILS</div><h2>Hero & pet power</h2><div className="form-grid">
      <label>Hero power<input name="hero_power" type="number" min="0" max="1000000000000" step="1" defaultValue={initial?.hero_power??0}/></label>
      <label>Pet power<input name="pet_power" type="number" min="0" max="1000000000000" step="1" defaultValue={initial?.pet_power??0}/></label>
      <label>Mystic Trial total score<input name="mystic_trial_score" type="number" min="0" max="1000000000000" step="1" defaultValue={initial?.mystic_trial_score??0}/></label>
    </div></section>
    <button className="button" disabled={saved.busy} type="submit">{saved.busy?'Saving…':saved.canSave?'Save player profile':'Check entries'}</button>
    {saved.status&&<p className={`form-message ${saved.error?'error':''}`} role={saved.error?'alert':'status'}>{saved.status}</p>}
  </form>;
}
