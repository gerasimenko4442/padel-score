import { describe, expect, it } from 'vitest';
import { swapFixedModeTeams, swapPlayersBetweenFixedTeams, swapRandomModePlayers } from './teamAssignment';
import { makePlayers } from '../test/factories';
import type { Round, Team } from '../types';

describe('swapRandomModePlayers', () => {
  it('swaps a resting player with a playing player', () => {
    const players = makePlayers(5);
    const round: Round = {
      id: 'r1',
      index: 1,
      completed: false,
      pairingScore: 0,
      restingPlayerIds: [players[4]!.id],
      matches: [
        {
          id: 'm1',
          court: 1,
          teamA: { id: 'ta', playerIds: [players[0]!.id, players[1]!.id] },
          teamB: { id: 'tb', playerIds: [players[2]!.id, players[3]!.id] },
          scoreA: null,
          scoreB: null,
          winner: null,
        },
      ],
    };

    const updated = swapRandomModePlayers(round, players[0]!.id, players[4]!.id);

    expect(updated.restingPlayerIds).toEqual([players[0]!.id]);
    expect(updated.matches[0]!.teamA.playerIds).toEqual([players[4]!.id, players[1]!.id]);
    // The other match/team is untouched.
    expect(updated.matches[0]!.teamB.playerIds).toEqual([players[2]!.id, players[3]!.id]);
  });
});

describe('swapFixedModeTeams', () => {
  it('swaps a resting team in for a playing team', () => {
    const players = makePlayers(8);
    const teamA: Team = { id: 'tA', playerIds: [players[0]!.id, players[1]!.id] };
    const teamB: Team = { id: 'tB', playerIds: [players[2]!.id, players[3]!.id] };
    const teamC: Team = { id: 'tC', playerIds: [players[4]!.id, players[5]!.id] };
    const teamD: Team = { id: 'tD', playerIds: [players[6]!.id, players[7]!.id] };
    const fixedTeams = [teamA, teamB, teamC, teamD];

    const round: Round = {
      id: 'r1',
      index: 1,
      completed: false,
      pairingScore: 0,
      restingPlayerIds: [...teamC.playerIds, ...teamD.playerIds],
      matches: [{ id: 'm1', court: 1, teamA, teamB, scoreA: null, scoreB: null, winner: null }],
    };

    const updated = swapFixedModeTeams(round, fixedTeams, teamB.id, teamC.id);

    expect(updated.matches[0]!.teamB.id).toBe('tC');
    expect(updated.restingPlayerIds.sort()).toEqual([...teamB.playerIds, ...teamD.playerIds].sort());
  });
});

describe('swapPlayersBetweenFixedTeams', () => {
  it('swaps two players across team membership before the game starts', () => {
    const players = makePlayers(4);
    const teams: Team[] = [
      { id: 't1', playerIds: [players[0]!.id, players[1]!.id] },
      { id: 't2', playerIds: [players[2]!.id, players[3]!.id] },
    ];

    const updated = swapPlayersBetweenFixedTeams(teams, players[1]!.id, players[2]!.id);

    expect(updated[0]!.playerIds).toEqual([players[0]!.id, players[2]!.id]);
    expect(updated[1]!.playerIds).toEqual([players[1]!.id, players[3]!.id]);
  });
});
