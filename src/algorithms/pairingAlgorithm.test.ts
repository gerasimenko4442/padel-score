import { describe, expect, it } from 'vitest';
import { generateFixedModePairing, generateRandomModePairing } from './pairingAlgorithm';
import { makePlayer, makePlayers } from '../test/factories';
import type { Team } from '../types';

function allPlayerIdsInConfig(courts: { teamA: { playerIds: [string, string] }; teamB: { playerIds: [string, string] } }[]): string[] {
  return courts.flatMap((c) => [...c.teamA.playerIds, ...c.teamB.playerIds]);
}

describe('generateRandomModePairing', () => {
  it('assigns every playing player to exactly one seat, with no duplicates', () => {
    const players = makePlayers(8);
    const { configuration } = generateRandomModePairing(players, false);

    expect(configuration.courts).toHaveLength(2);
    const ids = allPlayerIdsInConfig(configuration.courts);
    expect(ids).toHaveLength(8);
    expect(new Set(ids).size).toBe(8); // no one appears twice
    expect(new Set(ids)).toEqual(new Set(players.map((p) => p.id)));
  });

  it('rejects a player count that is not a multiple of 4', () => {
    const players = makePlayers(7);
    expect(() => generateRandomModePairing(players, false)).toThrow();
  });

  it('produces only valid gender matchups when gender rules are enabled and a valid split exists', () => {
    // 4 men + 4 women can always be split into two courts that satisfy the
    // MM-vs-MM / FF-vs-FF / Mixed-vs-Mixed rule (e.g. two mixed courts).
    const players = [...makePlayers(4, 'male'), ...makePlayers(4, 'female')];
    const { configuration, hasGenderViolation } = generateRandomModePairing(players, true);

    expect(hasGenderViolation).toBe(false);
    for (const court of configuration.courts) {
      const genderOf = (id: string) => players.find((p) => p.id === id)!.gender;
      const patternOf = (ids: [string, string]) => ids.map(genderOf).sort().join(',');
      expect(patternOf(court.teamA.playerIds)).toBe(patternOf(court.teamB.playerIds));
    }
  });

  it('flags an impossible gender ratio instead of crashing', () => {
    // 3 men + 1 woman: no court composition (4M, 4F, or 2M2F) is achievable,
    // so a valid split can never exist. The algorithm must still return its
    // best-effort configuration rather than throwing.
    const players = [...makePlayers(3, 'male'), ...makePlayers(1, 'female')];
    const { configuration, hasGenderViolation } = generateRandomModePairing(players, true);

    expect(configuration.courts).toHaveLength(1);
    expect(hasGenderViolation).toBe(true);
  });

  it('strongly avoids repeating partners and opponents from history', () => {
    // Two players who have already partnered many times, and two others who
    // have already faced each other many times as opponents.
    const players = makePlayers(8);
    const [a, b, c, d] = [players[0]!, players[1]!, players[2]!, players[3]!];
    a.stats.partnerCounts[b.id] = 5;
    b.stats.partnerCounts[a.id] = 5;
    c.stats.opponentCounts[d.id] = 5;
    d.stats.opponentCounts[c.id] = 5;

    const { configuration } = generateRandomModePairing(players, false);

    const teams = configuration.courts.flatMap((court) => [court.teamA, court.teamB]);
    const isPartnered = (x: string, y: string) => teams.some((t) => t.playerIds.includes(x) && t.playerIds.includes(y));
    expect(isPartnered(a.id, b.id)).toBe(false);

    const opponentPairs = configuration.courts.flatMap((court) =>
      court.teamA.playerIds.flatMap((pa) => court.teamB.playerIds.map((pb) => [pa, pb])),
    );
    const areOpponents = (x: string, y: string) => opponentPairs.some(([pa, pb]) => (pa === x && pb === y) || (pa === y && pb === x));
    expect(areOpponents(c.id, d.id)).toBe(false);
  });
});

describe('generateFixedModePairing', () => {
  it('pairs up teams into courts without repeating a team or splitting it', () => {
    const players = makePlayers(8);
    const teams: Team[] = [];
    for (let i = 0; i < players.length; i += 2) {
      teams.push({ id: `t${i}`, playerIds: [players[i]!.id, players[i + 1]!.id] });
    }

    const { configuration } = generateFixedModePairing(teams, players);
    expect(configuration.courts).toHaveLength(2);

    const usedTeamIds = configuration.courts.flatMap((c) => [c.teamA.id, c.teamB.id]);
    expect(new Set(usedTeamIds).size).toBe(4); // every team appears exactly once
  });

  it('rejects an odd number of teams', () => {
    const players = makePlayers(6);
    const teams: Team[] = [
      { id: 't1', playerIds: [players[0]!.id, players[1]!.id] },
      { id: 't2', playerIds: [players[2]!.id, players[3]!.id] },
      { id: 't3', playerIds: [players[4]!.id, players[5]!.id] },
    ];
    expect(() => generateFixedModePairing(teams, players)).toThrow();
  });
});

describe('makePlayer factory sanity', () => {
  it('creates unique ids by default', () => {
    const p1 = makePlayer();
    const p2 = makePlayer();
    expect(p1.id).not.toBe(p2.id);
  });
});
