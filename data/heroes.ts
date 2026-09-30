// Reviewed 2026-09-30. Kingdom 2312 is capped at Generation 2.
// Community references (not developer documentation):
// https://kingshotdata.com/category/heroes/
// https://kingshot.net/heroes
export const heroGroups = [
  { label: 'Generation 1 · Legendary', names: ['Amadeus', 'Helga', 'Jabel', 'Saul'] },
  { label: 'Generation 2 · Legendary', names: ['Hilde', 'Marlin', 'Zoe'] },
  { label: 'Epic · Early roster', names: ['Amane', 'Chenko', 'Diana', 'Fahd', 'Gordon', 'Howard', 'Quinn', 'Yeonwoo'] },
  { label: 'Rare · Early roster', names: ['Edwin', 'Forrest', 'Olive', 'Seth'] },
] as const;
export const allowedHeroNames = heroGroups.flatMap(group => [...group.names]);
export const memberProfileConfig = { maxHeroGeneration: 2, includeMasterPower: false } as const;
