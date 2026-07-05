import { describe, expect, it } from 'vitest';
import { recomputeStats, sortPlayersForLeaderboard } from './statistics';
import { makePlayers } from '../test/factories';
import type { Round } from '../types';

describe('recomputeStats', () => {
  it('credits the winner with a win and the loser with a loss, and tracks points', () => {
    const [a, b, c, d, e] = makePlayers(5);
    const round: Round = {
      id: 'r1',
      index: 1,
      completed: true,
      pairingScore: 0,
      restingPlayerIds: [e!.id],
      matches: [
        {
          id: 'm1',
          court: 1,
          teamA: { id: 'ta', playerIds: [a!.id, b!.id] },
          teamB: { id: 'tb', playerIds: [c!.id, d!.id] },
          scoreA: 6,
          scoreB: 3,
          winner: 'A',
        },
      ],
    };

    const result = recomputeStats([a!, b!, c!, d!, e!], [round]);
    const byId = new Map(result.map((p) => [p.id, p]));

    expect(byId.get(a!.id)!.stats.wins).toBe(1);
    expect(byId.get(a!.id)!.stats.losses).toBe(0);
    expect(byId.get(a!.id)!.stats.pointsScored).toBe(6);
    expect(byId.get(a!.id)!.stats.pointsDifference).toBe(3);

    expect(byId.get(c!.id)!.stats.wins).toBe(0);
    expect(byId.get(c!.id)!.stats.losses).toBe(1);
    expect(byId.get(c!.id)!.stats.pointsDifference).toBe(-3);

    // Partner/opponent bookkeeping.
    expect(byId.get(a!.id)!.stats.partnerCounts[b!.id]).toBe(1);
    expect(byId.get(a!.id)!.stats.opponentCounts[c!.id]).toBe(1);
    expect(byId.get(a!.id)!.stats.opponentCounts[d!.id]).toBe(1);

    // The resting player gets a rest credit and no match played.
    expect(byId.get(e!.id)!.stats.restCount).toBe(1);
    expect(byId.get(e!.id)!.stats.matchesPlayed).toBe(0);
  });

  it('ignores rounds that are not yet completed', () => {
    const [a, b, c, d] = makePlayers(4);
    const inProgress: Round = {
      id: 'r1',
      index: 1,
      completed: false,
      pairingScore: 0,
      restingPlayerIds: [],
      matches: [
        {
          id: 'm1',
          court: 1,
          teamA: { id: 'ta', playerIds: [a!.id, b!.id] },
          teamB: { id: 'tb', playerIds: [c!.id, d!.id] },
          scoreA: 6,
          scoreB: 2,
          winner: 'A',
        },
      ],
    };

    const result = recomputeStats([a!, b!, c!, d!], [inProgress]);
    expect(result.every((p) => p.stats.matchesPlayed === 0)).toBe(true);
  });

  it('identifies the most frequent partner and opponent from round history', () => {
    const [a, b, c, d, e] = makePlayers(5);
    const rounds: Round[] = [
      {
        id: 'r1',
        index: 1,
        completed: true,
        pairingScore: 0,
        restingPlayerIds: [e!.id],
        matches: [
          {
            id: 'm1',
            court: 1,
            teamA: { id: 'ta1', playerIds: [a!.id, b!.id] },
            teamB: { id: 'tb1', playerIds: [c!.id, d!.id] },
            scoreA: 6,
            scoreB: 2,
            winner: 'A',
          },
        ],
      },
      {
        id: 'r2',
        index: 2,
        completed: true,
        pairingScore: 0,
        restingPlayerIds: [e!.id],
        matches: [
          {
            id: 'm2',
            court: 1,
            teamA: { id: 'ta2', playerIds: [a!.id, b!.id] },
            teamB: { id: 'tb2', playerIds: [c!.id, d!.id] },
            scoreA: 6,
            scoreB: 4,
            winner: 'A',
          },
        ],
      },
      {
        id: 'r3',
        index: 3,
        completed: true,
        pairingScore: 0,
        restingPlayerIds: [b!.id],
        matches: [
          {
            id: 'm3',
            court: 1,
            teamA: { id: 'ta3', playerIds: [a!.id, e!.id] },
            teamB: { id: 'tb3', playerIds: [c!.id, d!.id] },
            scoreA: 6,
            scoreB: 1,
            winner: 'A',
          },
        ],
      },
    ];

    const result = recomputeStats([a!, b!, c!, d!, e!], rounds);
    const aStats = result.find((p) => p.id === a!.id)!.stats;

    // a partnered with b twice and e once -> b is the most frequent partner.
    expect(aStats.mostFrequentPartnerId).toBe(b!.id);
    // a faced c and d three times each; c was recorded first, so it wins the tie.
    expect(aStats.mostFrequentOpponentId).toBe(c!.id);
  });
});

describe('sortPlayersForLeaderboard', () => {
  it('sorts by wins, then points difference, then points scored', () => {
    const [a, b, c] = makePlayers(3);
    a!.stats.wins = 2;
    a!.stats.pointsDifference = 1;
    a!.stats.pointsScored = 10;
    b!.stats.wins = 2;
    b!.stats.pointsDifference = 5;
    b!.stats.pointsScored = 8;
    c!.stats.wins = 3;
    c!.stats.pointsDifference = -2;
    c!.stats.pointsScored = 20;

    const sorted = sortPlayersForLeaderboard([a!, b!, c!]);
    expect(sorted.map((p) => p.id)).toEqual([c!.id, b!.id, a!.id]);
  });
});
