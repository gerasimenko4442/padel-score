import type { Gender, Player, Round, Team } from '../types';
import { shuffle } from '../utils/random';

export interface RotationResult {
  /** Units that will play this round. In fixed mode these are Teams (both members always
   *  play/rest together); in random mode these are individual Players. */
  playingIds: string[];
  restingIds: string[];
  /** How many courts are actually used this round (can be less than settings.courtsCount
   *  if there aren't enough players/teams to fill every court). */
  courtsUsed: number;
}

/**
 * Computes a fairness priority for resting a given player/team THIS round.
 * Higher score = stronger candidate to rest now.
 *
 * Rules encoded (see spec section 7 - ROTATION SYSTEM):
 *  - a unit that rested last round gets a heavy penalty, so it is very
 *    unlikely to be picked to rest twice in a row ("high priority to play").
 *  - units that have played many consecutive rounds without a break, or
 *    have rested comparatively rarely so far, are prioritized to rest now,
 *    so rest gets distributed evenly across the whole session.
 */
function restPriority(restCount: number, playStreak: number, restedLastRound: boolean): number {
  let score = playStreak * 10 - restCount * 15;
  if (restedLastRound) score -= 10_000;
  return score;
}

interface RotationUnit {
  id: string;
  restCount: number;
  playStreak: number;
  restedLastRound: boolean;
  /** True if this unit voluntarily asked to sit out this round. */
  voluntary: boolean;
}

function pickResters(units: RotationUnit[], slotsAvailable: number): { playing: string[]; resting: string[] } {
  const voluntary = units.filter((u) => u.voluntary);
  const rest = units.filter((u) => !u.voluntary);

  // Voluntary rest requests are always honored.
  const restingIds = voluntary.map((u) => u.id);

  // How many of the remaining (non-voluntary) units can actually play?
  const remainingCapacity = Math.max(0, slotsAvailable - 0); // slots are shared across all units
  const nonVoluntaryPlayCount = Math.min(rest.length, remainingCapacity);
  const forcedRestCount = rest.length - nonVoluntaryPlayCount;

  if (forcedRestCount > 0) {
    const sorted = shuffle(rest) // random tie-break, then sort by priority desc
      .map((u) => ({ u, score: restPriority(u.restCount, u.playStreak, u.restedLastRound) }))
      .sort((a, b) => b.score - a.score);
    sorted.slice(0, forcedRestCount).forEach(({ u }) => restingIds.push(u.id));
  }

  const restingSet = new Set(restingIds);
  const playingIds = units.filter((u) => !restingSet.has(u.id)).map((u) => u.id);
  return { playing: playingIds, resting: restingIds };
}

/**
 * Gender-aware version of pickResters, used in random mode when gender
 * rules are enabled.
 *
 * A round of courts can only be split into valid MM/FF/Mixed matchups if the
 * PLAYING group has an even number of men (and therefore an even number of
 * women too, since courts always contribute men/women in pairs of 0, 2, or
 * 4). So: whoever RESTS must contain a number of men with the same parity as
 * the total number of men overall — that's the one thing that keeps the
 * remaining group splittable.
 *
 * We start from the fairness-only baseline (same as pickResters) and, if its
 * parity is wrong, look for the single least-disruptive swap — one resting
 * player traded for one playing player of the OPPOSITE gender — that fixes
 * it. If no such swap exists (e.g. the gender ratio makes it impossible),
 * we fall back to the fairness-only baseline: the pairing algorithm already
 * degrades gracefully and flags a warning in that case.
 */
function pickRestersGenderAware(
  units: RotationUnit[],
  slotsAvailable: number,
  genderOf: Map<string, Gender>,
): { playing: string[]; resting: string[] } {
  const voluntary = units.filter((u) => u.voluntary);
  const rest = units.filter((u) => !u.voluntary);
  const restingIds = voluntary.map((u) => u.id);

  const nonVoluntaryPlayCount = Math.min(rest.length, Math.max(0, slotsAvailable));
  const forcedRestCount = rest.length - nonVoluntaryPlayCount;

  if (forcedRestCount > 0) {
    const totalMaleCount = [...genderOf.values()].filter((g) => g === 'male').length;
    const targetRestingMaleParity = totalMaleCount % 2;

    const sorted = shuffle(rest)
      .map((u) => ({ u, score: restPriority(u.restCount, u.playStreak, u.restedLastRound) }))
      .sort((a, b) => b.score - a.score);

    const chosen = sorted.slice(0, forcedRestCount);
    const notChosen = sorted.slice(forcedRestCount);

    const voluntaryMaleCount = voluntary.filter((u) => genderOf.get(u.id) === 'male').length;
    const chosenMaleCount = chosen.filter((c) => genderOf.get(c.u.id) === 'male').length + voluntaryMaleCount;

    if (chosenMaleCount % 2 !== targetRestingMaleParity) {
      // Find the swap (remove one from `chosen`, add one from `notChosen` of
      // the opposite gender) that costs the least in fairness terms.
      let bestRemoveIdx = -1;
      let bestAddIdx = -1;
      let bestCost = Infinity;
      chosen.forEach((toRemove, removeIdx) => {
        notChosen.forEach((toAdd, addIdx) => {
          if (genderOf.get(toRemove.u.id) === genderOf.get(toAdd.u.id)) return; // must differ to flip parity
          const cost = toRemove.score - toAdd.score; // fairness given up by swapping
          if (cost < bestCost) {
            bestCost = cost;
            bestRemoveIdx = removeIdx;
            bestAddIdx = addIdx;
          }
        });
      });

      if (bestRemoveIdx !== -1 && bestAddIdx !== -1) {
        chosen.splice(bestRemoveIdx, 1, notChosen[bestAddIdx]!);
      }
      // If no valid swap exists, we keep the fairness-only baseline — this is
      // the deliberate exception: when no arrangement can satisfy the gender
      // rule, we proceed with the best available fairness-based choice.
    }

    chosen.forEach(({ u }) => restingIds.push(u.id));
  }

  const restingSet = new Set(restingIds);
  const playingIds = units.filter((u) => !restingSet.has(u.id)).map((u) => u.id);
  return { playing: playingIds, resting: restingIds };
}

/**
 * RANDOM MODE: the rotation unit is the individual player.
 */
export function computeRandomModeRotation(
  players: Player[],
  courtsCount: number,
  previousRound: Round | undefined,
  genderRulesEnabled: boolean,
): RotationResult {
  const maxSlots = courtsCount * 4;
  const units: RotationUnit[] = players.map((p) => ({
    id: p.id,
    restCount: p.stats.restCount,
    playStreak: p.stats.currentPlayStreak,
    restedLastRound: previousRound?.restingPlayerIds.includes(p.id) ?? false,
    voluntary: p.wantsRestNextRound,
  }));

  // How many players can physically play, before rounding down to a multiple of 4.
  const nonVoluntaryCount = units.filter((u) => !u.voluntary).length;
  let slotCandidate = Math.min(nonVoluntaryCount, maxSlots);
  slotCandidate -= slotCandidate % 4;

  const { playing, resting: forcedPlusVoluntaryResting } = genderRulesEnabled
    ? pickRestersGenderAware(
        units,
        slotCandidate,
        new Map(players.map((p) => [p.id, p.gender])),
      )
    : pickResters(units, slotCandidate);

  const courtsUsed = playing.length / 4;
  return { playingIds: playing, restingIds: forcedPlusVoluntaryResting, courtsUsed };
}

/**
 * FIXED MODE: the rotation unit is the fixed Team (both players always play,
 * or rest, together, since their partnership never changes).
 */
export function computeFixedModeRotation(
  fixedTeams: Team[],
  players: Player[],
  courtsCount: number,
  previousRound: Round | undefined,
): RotationResult {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const maxSlots = courtsCount; // 1 court = 1 team-vs-team pairing = 2 teams

  const previousRestingTeamIds = new Set<string>();
  if (previousRound) {
    // A team rested last round if BOTH of its players are in that round's resting list.
    for (const team of fixedTeams) {
      if (team.playerIds.every((pid) => previousRound.restingPlayerIds.includes(pid))) {
        previousRestingTeamIds.add(team.id);
      }
    }
  }

  const units: RotationUnit[] = fixedTeams.map((t) => {
    // Destructure the [string, string] tuple first (fixed arity, so no
    // undefined risk), THEN look each id up — mapping first would erase the
    // tuple into a plain array and lose that guarantee.
    const [id1, id2] = t.playerIds;
    const p1 = playerById.get(id1)!;
    const p2 = playerById.get(id2)!;
    return {
      id: t.id,
      restCount: Math.max(p1.stats.restCount, p2.stats.restCount),
      playStreak: Math.min(p1.stats.currentPlayStreak, p2.stats.currentPlayStreak),
      restedLastRound: previousRestingTeamIds.has(t.id),
      voluntary: p1.wantsRestNextRound && p2.wantsRestNextRound,
    };
  });

  // Slots are in TEAM units here; 1 court needs 2 teams.
  const maxTeamSlots = maxSlots * 2;
  const nonVoluntaryCount = units.filter((u) => !u.voluntary).length;
  let slotCandidate = Math.min(nonVoluntaryCount, maxTeamSlots);
  slotCandidate -= slotCandidate % 2;

  const { playing, resting } = pickResters(units, slotCandidate);

  const teamById = new Map(fixedTeams.map((t) => [t.id, t]));
  const playingPlayerIds = playing.flatMap((tid) => teamById.get(tid)!.playerIds);
  const restingPlayerIds = resting.flatMap((tid) => teamById.get(tid)!.playerIds);
  const courtsUsed = playing.length / 2;

  return { playingIds: playingPlayerIds, restingIds: restingPlayerIds, courtsUsed };
}
