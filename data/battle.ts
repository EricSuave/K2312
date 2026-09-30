// Times are UTC on the battle date announced by kingdom leadership.
// Official references: Century Games Kingshot Help Center, FAQs 8356 and 8353.
export const battleSchedule = {
  start: '10:00',
  end: '22:00',
  castleStart: '12:00',
  castleEnd: '17:00',
} as const;

export const battleSources = [
  {label:'Official battle start time',url:'https://centurygames.helpshift.com/hc/en/140-kingshot/faq/8356-what-is-the-time-and-duration-of-the-preparation-phase-and-battle-phase/'},
  {label:'Official battle phase schedule',url:'https://centurygames.helpshift.com/hc/en/140-kingshot/faq/8353-how-is-the-12-hour-battle-phase-scheduled/'},
] as const;

export const battleRoles = ['Rally lead','Rally joiner','Garrison / reinforcement','Support','Not sure'] as const;
const startMinutes = Number(battleSchedule.start.slice(0,2)) * 60 + Number(battleSchedule.start.slice(3));
const endMinutes = Number(battleSchedule.end.slice(0,2)) * 60 + Number(battleSchedule.end.slice(3));
export const battleTimeOptions = Array.from({length:(endMinutes-startMinutes)/30+1},(_,i)=>{
  const minutes=startMinutes+i*30;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
});
