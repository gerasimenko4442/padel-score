import type { Player, Team } from '../types';
import { chunk, randomId, shuffle } from '../utils/random';

/**
 * ============================================================================
 * PAIRING ALGORITHM
 * ============================================================================
 * This is the core "fairness engine" of the app. Per spec it works by brute
 * force sampling: generate many candidate configurations for the round,
 * score each one against a fixed rubric, and keep the highest scorer.
 *
 * This is intentionally a scored-search rather than an exact optimizer
 * (e.g. a min-cost-matching solver): with gender constraints, balance, and
 * dual history-avoidance (partners AND opponents) all at once, an exact
 * solver would need a much more complex model for marginal gain. Random
 * search over ~800 samples is cheap (well under a millisecond for 40+
 * players) and in practice converges on excellent configurations because
 * the scoring rubric is additive and smooth.
 * ============================================================================
 */

const SAMPLE_COUNT = 800;

// Scoring weights — copied verbatim from the spec.
const SCORE_NEW_PARTNER = 100;
const SCORE_REPEATED_PARTNER = -300;
const SCORE_NEW_OPPONENT = 80;
const SCORE_REPEATED_OPPONENT = -150;
const SCORE_BALANCED_MATCH_MAX = 50;
const SCORE_FAIR_REST = 30;
const SCORE_INVALID_GENDER = -1000;

export interface CourtAssignment {
  court: number;
  teamA: Team;
  teamB: Team;
}

export interface PairingConfiguration {
  courts: CourtAssignment[];
}

export interface PairingResult {
  configuration: PairingConfiguration;
  score: number;
  /** True if the best configuration found still breaks a gender rule somewhere
   *  (can happen when the gender ratio of available players makes a fully
   *  valid split mathematically impossible for this round). */
  hasGenderViolation: boolean;
}

function playerStrength(p: Player): number {
  return p.stats.wins - p.stats.losses + p.stats.pointsDifference * 0.1;
}

function teamStrength(players: [Player, Player]): number {
  return playerStrength(players[0]) + playerStrength(players[1]);
}

function partnerScore(p1: Player, p2: Player): number {
  const timesTogether = p1.stats.partnerCounts[p2.id] ?? 0;
  return timesTogether === 0 ? SCORE_NEW_PARTNER : SCORE_REPEATED_PARTNER;
}

function opponentScore(p1: Player, p2: Player): number {
  const timesAgainst = p1.stats.opponentCounts[p2.id] ?? 0;
  return timesAgainst === 0 ? SCORE_NEW_OPPONENT : SCORE_REPEATED_OPPONENT;
}

function balanceScore(teamA: [Player, Player], teamB: [Player, Player]): number {
  const diff = Math.abs(teamStrength(teamA) - teamStrength(teamB));
  return Math.max(0, SCORE_BALANCED_MATCH_MAX - diff * 8);
}

type GenderPattern = 'MM' | 'FF' | 'MIXED' | 'INVALID';

function genderPattern(players: [Player, Player]): GenderPattern {
  const genders = players.map((p) => p.gender).sort();
  if (genders[0] === 'male' && genders[1] === 'male') return 'MM';
  if (genders[0] === 'female' && genders[1] === 'female') return 'FF';
  return 'MIXED';
}

/** Only MM-vs-MM, FF-vs-FF, or Mixed-vs-Mixed are allowed. */
function isValidGenderMatchup(teamA: [Player, Player], teamB: [Player, Player]): boolean {
  const a = genderPattern(teamA);
  const b = genderPattern(teamB);
  return a === b;
}

function byId(players: Player[]): Map<string, Player> {
  return new Map(players.map((p) => [p.id, p]));
}

// ---------------------------------------------------------------------------
// RANDOM MODE
// ---------------------------------------------------------------------------

function scoreRandomConfiguration(
  courts: { teamA: [Player, Player]; teamB: [Player, Player] }[],
  genderRulesEnabled: boolean,
): { score: number; hasGenderViolation: boolean } {
  let score = 0;
  let hasGenderViolation = false;

  for (const { teamA, teamB } of courts) {
    if (genderRulesEnabled && !isValidGenderMatchup(teamA, teamB)) {
      score += SCORE_INVALID_GENDER;
      hasGenderViolation = true;
    }
    score += partnerScore(teamA[0], teamA[1]);
    score += partnerScore(teamB[0], teamB[1]);
    for (const pa of teamA) {
      for (const pb of teamB) {
        score += opponentScore(pa, pb);
      }
    }
    score += balanceScore(teamA, teamB);
  }

  // Fair-rest-distribution credit: the rotation algorithm already picked who
  // sits out; every sampled configuration shares that same resting set, so
  // this bonus is constant across samples for a given round (it doesn't
  // change which configuration wins) but is still counted, per spec, in the
  // final transparency score shown for the round.
  score += SCORE_FAIR_REST;

  return { score, hasGenderViolation };
}

function buildRandomConfiguration(
  playingPlayers: Player[],
): { teamA: [Player, Player]; teamB: [Player, Player] }[] {
  const shuffled = shuffle(playingPlayers);
  const groups = chunk(shuffled, 4);
  return groups.map((group) => {
    const [a, b, c, d] = shuffle(group);
    // Safe: chunk(..., 4) only ever returns complete groups of exactly 4, so
    // a/b/c/d are always defined. Asserting explicitly (rather than relying
    // on the `as [Player, Player]` below to paper over it) keeps this
    // guarantee visible and consistent with the fixed-mode equivalent.
    return { teamA: [a!, b!] as [Player, Player], teamB: [c!, d!] as [Player, Player] };
  });
}

/**
 * Random mode: forms brand-new teams for this round out of the pool of
 * players who are playing (not resting).
 */
export function generateRandomModePairing(
  playingPlayers: Player[],
  genderRulesEnabled: boolean,
): PairingResult {
  if (playingPlayers.length < 4 || playingPlayers.length % 4 !== 0) {
    throw new Error('Random mode pairing requires a player count that is a multiple of 4.');
  }

  let best: { score: number; hasGenderViolation: boolean; courts: ReturnType<typeof buildRandomConfiguration> } | null = null;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const courts = buildRandomConfiguration(playingPlayers);
    const { score, hasGenderViolation } = scoreRandomConfiguration(courts, genderRulesEnabled);
    if (!best || score > best.score) {
      best = { score, hasGenderViolation, courts };
    }
  }

  const configuration: PairingConfiguration = {
    courts: best!.courts.map((c, idx) => ({
      court: idx + 1,
      teamA: { id: randomId(), playerIds: [c.teamA[0].id, c.teamA[1].id] },
      teamB: { id: randomId(), playerIds: [c.teamB[0].id, c.teamB[1].id] },
    })),
  };

  return { configuration, score: best!.score, hasGenderViolation: best!.hasGenderViolation };
}

// ---------------------------------------------------------------------------
// FIXED MODE
// ---------------------------------------------------------------------------

function scoreFixedConfiguration(courts: { teamA: Team; teamB: Team }[], playerMap: Map<string, Player>): number {
  let score = 0;
  for (const { teamA, teamB } of courts) {
    // Destructure the [string, string] tuples first (fixed arity) before
    // looking each id up, so the result stays known-defined.
    const [aId1, aId2] = teamA.playerIds;
    const [bId1, bId2] = teamB.playerIds;
    const a1 = playerMap.get(aId1)!;
    const a2 = playerMap.get(aId2)!;
    const b1 = playerMap.get(bId1)!;
    const b2 = playerMap.get(bId2)!;
    for (const pa of [a1, a2]) {
      for (const pb of [b1, b2]) {
        score += opponentScore(pa, pb);
      }
    }
    score += balanceScore([a1, a2], [b1, b2]);
  }
  score += SCORE_FAIR_REST;
  return score;
}

/**
 * Fixed mode: partners never change, so we only need to decide which team
 * faces which team, and on what court. No gender constraint (spec: "Fixed
 * mode: no restrictions").
 */
export function generateFixedModePairing(playingTeams: Team[], allPlayers: Player[]): PairingResult {
  if (playingTeams.length < 2 || playingTeams.length % 2 !== 0) {
    throw new Error('Fixed mode pairing requires an even number of teams >= 2.');
  }
  const playerMap = byId(allPlayers);

  let best: { score: number; courts: { teamA: Team; teamB: Team }[] } | null = null;

  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const shuffled = shuffle(playingTeams);
    const pairs = chunk(shuffled, 2);
    // Safe: chunk() only returns complete groups of exactly 2 here.
    const courts = pairs.map((p) => ({ teamA: p[0]!, teamB: p[1]! }));
    const score = scoreFixedConfiguration(courts, playerMap);
    if (!best || score > best.score) {
      best = { score, courts };
    }
  }

  const configuration: PairingConfiguration = {
    courts: best!.courts.map((c, idx) => ({ court: idx + 1, teamA: c.teamA, teamB: c.teamB })),
  };

  return { configuration, score: best!.score, hasGenderViolation: false };
}
