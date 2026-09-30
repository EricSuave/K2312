import {battleSchedule} from '@/data/battle';

export type BattleWindow = {
  event_date: string;
  attendance: string;
  starts_at?: string;
  ends_at?: string;
};

export function battleWindowError(window: BattleWindow): string | undefined {
  if(window.attendance==='unavailable') {
    if(window.starts_at || window.ends_at)return 'Remove the time window when marking yourself unavailable.';
    return;
  }
  if(!window.starts_at || !window.ends_at)return 'Select both a start and end time.';
  const start=Date.parse(window.starts_at),end=Date.parse(window.ends_at);
  const battleStart=Date.parse(`${window.event_date}T${battleSchedule.start}:00Z`);
  const battleEnd=Date.parse(`${window.event_date}T${battleSchedule.end}:00Z`);
  if(![start,end,battleStart,battleEnd].every(Number.isFinite))return 'Choose a valid battle date and UTC time window.';
  if(end<=start)return 'Your end time must be after your start time.';
  if(start<battleStart || end>battleEnd)return `Choose a window within ${battleSchedule.start}–${battleSchedule.end} UTC on the selected battle date.`;
}
