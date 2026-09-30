// Kingdom 2312 limits confirmed by leadership, 2026-09-30.
// Do not auto-unlock later content based on estimated server age.
export const progression = {
  heroGeneration: 2,
  maxTruegoldLevel: 3,
  maxTroopTier: 10,
  truegoldDust: false,
  temperedTruegold: false,
  masterPower: false,
} as const;
export const truegoldLevels = ['Not unlocked', 'TG1', 'TG2', 'TG3'] as const;
export const troopTiers = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10'] as const;
export const constructionTargets = ['Standard building upgrades', 'TG1', 'TG2', 'TG3'] as const;
// Regular Truegold is a construction resource, distinct from Truegold Dust.
export const preparationResources = ['truegold','construction_speedups','research_speedups','training_speedups','general_speedups'] as const;
