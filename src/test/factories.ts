import type { Gender, Player } from '../types';
import { createEmptyStatistics } from '../types';

let counter = 0;

export function makePlayer(overrides: Partial<Player> = {}): Player {
  counter += 1;
  return {
    id: overrides.id ?? `p${counter}`,
    name: overrides.name ?? `Player ${counter}`,
    gender: overrides.gender ?? 'male',
    wantsRestNextRound: overrides.wantsRestNextRound ?? false,
    stats: overrides.stats ?? createEmptyStatistics(),
  };
}

export function makePlayers(count: number, gender?: Gender): Player[] {
  return Array.from({ length: count }, () => makePlayer(gender ? { gender } : {}));
}
