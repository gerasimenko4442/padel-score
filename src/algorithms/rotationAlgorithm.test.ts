import { describe, expect, it } from 'vitest';
import { computeFixedModeRotation, computeRandomModeRotation } from './rotationAlgorithm';
import { makePlayers } from '../test/factories';
import type { Round, Team } from '../types';

describe('computeRandomModeRotation', () => {
  it('sends exactly enough players to the sidelines to fill whole courts', () => {
    const players = makePlayers(10);
    const result = computeRandomModeRotation(players, 2, undefined); // 2 courts = 8 slots

    expect(result.playingIds).toHaveLength(8);
    expect(result.restingIds).toHaveLength(2);
    expect(result.courtsUsed).toBe(2);
    // Every player is accounted for exactly once.
    const combined = [...result.playingIds, ...result.restingIds];
    expect(new Set(combined).size).toBe(10);
  });

  it('never rests more players than necessary when everyone fits', () => {
    const players = makePlayers(8);
    const result = computeRandomModeRotation(players, 2, undefined);
    expect(result.restingIds).toHaveLength(0);
    expect(result.playingIds).toHaveLength(8);
  });

  it('gives players who rested last round high priority to play this round', () => {
    const players = makePlayers(6); // 1 court = 4 slots, so 2 must rest
    const previousRound: Round = {
      id: 'r0',
      index: 1,
      matches: [],
      // players[0] and players[1] already rested last round.
      restingPlayerIds: [players[0]!.id, players[1]!.id],
      completed: true,
      pairingScore: 0,
    };
    // Reflect that history in the players' own stats, as recomputeStats would.
    players[0]!.stats.restCount = 1;
    players[1]!.stats.restCount = 1;
    players[2]!.stats.currentPlayStreak = 1;
    players[3]!.stats.currentPlayStreak = 1;
    players[4]!.stats.currentPlayStreak = 1;
    players[5]!.stats.currentPlayStreak = 1;

    const result = computeRandomModeRotation(players, 1, previousRound);

    // The two who just rested should now be playing, not resting again.
    expect(result.playingIds).toContain(players[0]!.id);
    expect(result.playingIds).toContain(players[1]!.id);
  });

  it('always honors a voluntary rest request', () => {
    const players = makePlayers(8);
    players[0]!.wantsRestNextRound = true;
    const result = computeRandomModeRotation(players, 2, undefined);
    expect(result.restingIds).toContain(players[0]!.id);
  });
});

describe('computeFixedModeRotation', () => {
  it('keeps both members of a team playing or resting together', () => {
    const players = makePlayers(8);
    const teams: Team[] = [
      { id: 't1', playerIds: [players[0]!.id, players[1]!.id] },
      { id: 't2', playerIds: [players[2]!.id, players[3]!.id] },
      { id: 't3', playerIds: [players[4]!.id, players[5]!.id] },
      { id: 't4', playerIds: [players[6]!.id, players[7]!.id] },
    ];
    // 1 court means only 2 of the 4 teams play; the other 2 teams (4 players) rest.
    const result = computeFixedModeRotation(teams, players, 1, undefined);

    expect(result.playingIds).toHaveLength(4);
    expect(result.restingIds).toHaveLength(4);
    for (const team of teams) {
      const bothPlaying = team.playerIds.every((id) => result.playingIds.includes(id));
      const bothResting = team.playerIds.every((id) => result.restingIds.includes(id));
      expect(bothPlaying || bothResting).toBe(true);
    }
  });
});
