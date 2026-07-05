/**
 * Core domain types for Padel Score.
 *
 * Design decision: `Player.stats` is a DERIVED cache, not a value that gets
 * mutated incrementally. The single source of truth for everything that
 * happened in the game is `GameState.rounds` (the match history). Stats are
 * rebuilt from that history by `recomputeStats()` (see utils/statistics.ts)
 * every time a round is generated or a score is submitted. This avoids an
 * entire class of bugs where incremental counters drift out of sync with
 * the actual match log, and it means the match log can always be trusted
 * as the ground truth (important for the PDF report and tournament table).
 */

export type Gender = 'male' | 'female';

export type GameMode = 'fixed' | 'random';

export type AppScreen =
  | 'splash'
  | 'newGame'
  | 'addPlayers'
  | 'gameMode'
  | 'setupCourts'
  | 'round'
  | 'finalResults';

/** Derived, recomputed statistics for a single player. Never mutate directly. */
export interface PlayerStatistics {
  matchesPlayed: number;
  wins: number;
  losses: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDifference: number;
  restCount: number;
  /** Rounds played consecutively without a rest, right up to now. */
  currentPlayStreak: number;
  winStreak: number;
  longestWinStreak: number;
  /** playerId -> number of rounds played as a partner */
  partnerCounts: Record<string, number>;
  /** playerId -> number of rounds played as an opponent */
  opponentCounts: Record<string, number>;
  /** Derived convenience fields, resolved from the maps above. */
  mostFrequentPartnerId: string | null;
  mostFrequentOpponentId: string | null;
}

export function createEmptyStatistics(): PlayerStatistics {
  return {
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    pointsScored: 0,
    pointsConceded: 0,
    pointsDifference: 0,
    restCount: 0,
    currentPlayStreak: 0,
    winStreak: 0,
    longestWinStreak: 0,
    partnerCounts: {},
    opponentCounts: {},
    mostFrequentPartnerId: null,
    mostFrequentOpponentId: null,
  };
}

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  /** True while this player has voluntarily opted to sit out the next round. */
  wantsRestNextRound: boolean;
  stats: PlayerStatistics;
}

/** A fixed or ad-hoc pairing of exactly two players. */
export interface Team {
  id: string;
  playerIds: [string, string];
}

export interface Match {
  id: string;
  /** 1-based court number. */
  court: number;
  teamA: Team;
  teamB: Team;
  scoreA: number | null;
  scoreB: number | null;
  winner: 'A' | 'B' | null;
}

export interface Round {
  id: string;
  /** 1-based round number. */
  index: number;
  matches: Match[];
  restingPlayerIds: string[];
  completed: boolean;
  /** Score of the pairing configuration the algorithm picked (for transparency/debugging). */
  pairingScore: number;
}

export interface GameSettings {
  gameMode: GameMode;
  courtsCount: number;
  /** Only enforced in random mode; fixed mode has no gender restrictions. */
  genderRulesEnabled: boolean;
}

export interface GameState {
  id: string;
  name: string;
  players: Player[];
  /** Only populated when settings.gameMode === 'fixed'. */
  fixedTeams: Team[];
  rounds: Round[];
  /** -1 before the game has started. */
  currentRoundIndex: number;
  settings: GameSettings;
  status: 'setup' | 'in_progress' | 'finished';
  createdAt: number;
  updatedAt: number;
}

export const MIN_PLAYERS = 4;
export const MAX_SUPPORTED_PLAYERS = 60;
