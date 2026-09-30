export const kingdom = {
  number: '2312', name: 'Kingdom 2312', languages: 'Multilingual',
  tagline: 'Never outnumbered, never outworked.',
  motto: 'Forged in KvK. Built to win.',
  // Applications request a leadership review; they do not guarantee a transfer.
  transfersOpen: true,
};
export type Alliance = { slug: string; tag: string; name: string; leader: string | null; bearTime: string | null; bearTrap1: string; bearTrap2: string; otherEvents: string | null; description: string; requirements: string[] };
const confirmedSchedules: Record<string, { leader: string; bearTrap1: string; bearTrap2: string }> = {
  '404': { leader: 'Lady Bonnie', bearTrap1: '12:00', bearTrap2: '18:00' },
  '401': { leader: 'Aschent', bearTrap1: '14:30', bearTrap2: '19:00' },
  'OMG': { leader: 'Bara', bearTrap1: '13:00', bearTrap2: '19:00' },
  'BLO': { leader: 'Jack 308 Jr Jr', bearTrap1: '12:00', bearTrap2: '23:00' },
  'GLX': { leader: 'Nostalgia Farm', bearTrap1: '12:00', bearTrap2: '15:00' },
  'FXF': { leader: 'EEM 000 EMPEROR', bearTrap1: '12:00', bearTrap2: '14:30' },
};
export const alliances: Alliance[] = ['404', '401', 'FXF', 'BLO', 'OMG', 'GLX'].map((tag, index) => ({
  slug: tag.toLowerCase(), tag, name: tag,
  ...confirmedSchedules[tag], bearTime: `${confirmedSchedules[tag].bearTrap1} · ${confirmedSchedules[tag].bearTrap2}`, otherEvents: null,
  description: ['Every rally starts with a team.', 'Preparation is a team effort.', 'A place to contribute and grow.', 'Stronger through coordination.', 'Show up. Team up. Keep growing.', 'Your place in the bigger picture.'][index],
  requirements: ['Choose an alliance whose Bear Trap schedule fits your availability.', 'Discuss your KvK participation and current recruitment requirements with leadership.'],
}));
export const nav = [ ['Home','/'], ['Player Profile','/members/profile'], ['Member Forms','/members'], ['KvK Battle','/members/availability'], ['KvK Prep','/members/prep'], ['Game Guides','/guides'], ['Upgrade Tools','/tools'], ['Kingdom Timeline','/timeline'], ['Transfer','/join'] ];
export const communityNav = [['About','/about'],['Events','/events'],['Gallery','/gallery'],['Join 2312','/join'],['Admin','/admin']];
export type KingdomEvent = { id: string; title: string; kind: 'Bear Hunt' | 'KvK' | 'Alliance'; alliance: string | null; starts_at: string; ends_at: string; description: string; published: boolean };
export type GalleryItem = { id: string; title: string; caption: string; image_url: string; taken_on: string | null; category: string; published: boolean; storage_path?: string | null };
export const originalGallery: GalleryItem[] = [{ id: 'concept-fortress', title: 'A kingdom worth standing for', caption: 'Original fantasy concept art. Created for Kingdom 2312; not an in-game screenshot.', image_url: '/art/fortress.webp', taken_on: null, category: 'Concept art', published: true }];
