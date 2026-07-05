import type { Player, Round, Team } from '../types';
import { chunk, randomId, shuffle } from './random';

/** Randomly pairs up players into fixed teams of 2. Drops one leftover player if the count is odd. */
export function generateRandomFixedTeams(players: Player[]): Team[] {
  const pairs = chunk(shuffle(players), 2);
  // Safe: chunk() only ever returns complete groups of exactly `size`, so
  // every pair here has exactly 2 entries.
  return pairs.map((pair) => ({ id: randomId(), playerIds: [pair[0]!.id, pair[1]!.id] as [string, string] }));
}

/**
 * Swaps two players' team membership in the pre-game "assign fixed teams"
 * editor. Each player belongs to exactly one team, so a direct find-and-
 * replace in both directions is sufficient and always correct.
 */
export function swapPlayersBetweenFixedTeams(teams: Team[], playerIdA: string, playerIdB: string): Team[] {
  if (playerIdA === playerIdB) return teams;
  return teams.map((t) => ({
    ...t,
    playerIds: t.playerIds.map((id) => (id === playerIdA ? playerIdB : id === playerIdB ? playerIdA : id)) as [
      string,
      string,
    ],
  }));
}

/**
 * RANDOM MODE in-round swap: each player occupies exactly one slot (either
 * resting, or one seat in one team), so swapping is a direct two-way
 * find-and-replace across the resting list and every match's teams.
 */
export function swapRandomModePlayers(round: Round, playerIdA: string, playerIdB: string): Round {
  if (playerIdA === playerIdB) return round;

  const swapId = (id: string) => (id === playerIdA ? playerIdB : id === playerIdB ? playerIdA : id);

  const restingPlayerIds = round.restingPlayerIds.map(swapId);
  const matches = round.matches.map((m) => ({
    ...m,
    teamA: { ...m.teamA, playerIds: m.teamA.playerIds.map(swapId) as [string, string] },
    teamB: { ...m.teamB, playerIds: m.teamB.playerIds.map(swapId) as [string, string] },
  }));

  return { ...round, restingPlayerIds, matches };
}

/**
 * FIXED MODE in-round swap: the atomic unit is a Team (2 players who always
 * play together), so we swap which Team object occupies a match slot, then
 * re-derive who's resting as "everyone from an involved team who is not
 * currently seated in a match" — this correctly handles a resting team
 * swapping in for a playing team, or a straight court-for-court swap.
 */
export function swapFixedModeTeams(round: Round, fixedTeams: Team[], teamIdA: string, teamIdB: string): Round {
  if (teamIdA === teamIdB) return round;
  const teamA = fixedTeams.find((t) => t.id === teamIdA);
  const teamB = fixedTeams.find((t) => t.id === teamIdB);
  if (!teamA || !teamB) return round;

  const replace = (team: Team): Team => {
    if (team.id === teamIdA) return teamB;
    if (team.id === teamIdB) return teamA;
    return team;
  };
  const matches = round.matches.map((m) => ({ ...m, teamA: replace(m.teamA), teamB: replace(m.teamB) }));

  const universe = new Set([
    ...round.restingPlayerIds,
    ...round.matches.flatMap((m) => [...m.teamA.playerIds, ...m.teamB.playerIds]),
  ]);
  const playingNow = new Set(matches.flatMap((m) => [...m.teamA.playerIds, ...m.teamB.playerIds]));
  const restingPlayerIds = [...universe].filter((id) => !playingNow.has(id));

  return { ...round, matches, restingPlayerIds };
}
