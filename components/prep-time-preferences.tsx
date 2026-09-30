'use client';
import {useState} from 'react';
import {prepTimeSlots} from '@/data/prep';
import styles from './prep-schedule.module.css';

export function TimeSlots({day,title,initial=[]}:{day:number;title:string;initial?:string[]}){
  const[selected,setSelected]=useState<string[]>(()=>[...new Set(initial.filter(time=>prepTimeSlots.includes(time)))]);
  const[announcement,setAnnouncement]=useState('');
  function toggle(time:string){
    setSelected(previous=>previous.includes(time)?previous.filter(value=>value!==time):[...previous,time]);
    setAnnouncement(`${time} UTC ${selected.includes(time)?'removed':'added as preference '+(selected.length+1)}.`);
  }
  function move(index:number,change:number){
    const next=[...selected];const target=index+change;
    if(target<0||target>=next.length)return;
    [next[index],next[target]]=[next[target],next[index]];
    setSelected(next);setAnnouncement(`${selected[index]} UTC is now preference ${target+1}.`);
  }
  return <fieldset className="prep-time-slots" data-day={day}>
    <legend>Preferred Times — Day {day} ({title})</legend>
    <span className="prep-slot-count">{selected.length} selected</span>
    <p className="prep-slot-help">30-minute appointments · UTC. Select your first choice first, then add backup times. Use the arrows below to change their order.</p>
    <div className="prep-slot-grid">{prepTimeSlots.map(time=>{
      const priority=selected.indexOf(time);
      return <button type="button" key={time} aria-pressed={priority>=0} aria-label={`Day ${day}, ${time} UTC${priority>=0?`, preference ${priority+1}`:''}`} onClick={()=>toggle(time)}>{time}{priority>=0&&<small className={styles.preferenceBadge}>#{priority+1}</small>}</button>;
    })}</div>
    {selected.length>0&&<div className={styles.preferences}><p>Preference order · first choice at the top</p><ol aria-label={`Day ${day} preference order`}>{selected.map((time,index)=><li key={time}>
      <strong>{index+1}. {time} UTC</strong><div className={styles.preferenceActions}>
        <button type="button" disabled={index===0} aria-label={`Move ${time} earlier in Day ${day} preferences`} onClick={()=>move(index,-1)}>↑</button>
        <button type="button" disabled={index===selected.length-1} aria-label={`Move ${time} later in Day ${day} preferences`} onClick={()=>move(index,1)}>↓</button>
        <button type="button" aria-label={`Remove ${time} from Day ${day} preferences`} onClick={()=>toggle(time)}>Remove</button>
      </div>
    </li>)}</ol></div>}
    <span role="status" className={styles.announcement}>{announcement}</span>
    {selected.map(time=><input type="hidden" key={time} name={`day_${day}_times`} value={time}/>)}
  </fieldset>;
}
