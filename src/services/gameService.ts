import type { GameState, Match, Round } from '../types';
import { computeFixedModeRotation, computeRandomModeRotation } from '../algorithms/rotationAlgorithm';
import { generateFixedModePairing, generateRandomModePairing } from '../algorithms/pairingAlgorithm';
import { randomId } from '../utils/random';

export interface RoundGenerationOutcome {
  round: Round;
  hasGenderViolation: boolean;
}

function toMatches(
  courts: { court: number; teamA: { id: string; playerIds: [string, string] }; teamB: { id: string; playerIds: [string, string] } }[],
): Match[] {
  return courts.map((c) => ({
    id: randomId(),
    court: c.court,
    teamA: c.teamA,
    teamB: c.teamB,
    scoreA: null,
    scoreB: null,
    winner: null,
  }));
}

/**
 * Generates the next round: first the rotation algorithm decides who plays
 * and who rests, then the pairing algorithm assigns whoever is playing into
 * balanced, history-aware teams and courts.
 */
export function generateNextRound(state: GameState): RoundGenerationOutcome {
  const previousRound = state.rounds[state.rounds.length - 1];

  if (state.settings.gameMode === 'fixed') {
    const rotation = computeFixedModeRotation(state.fixedTeams, state.players, state.settings.courtsCount, previousRound);
    const playingTeams = state.fixedTeams.filter((t) => t.playerIds.every((id) => rotation.playingIds.includes(id)));
    if (playingTeams.length < 2) {
      throw new Error('Недостатньо команд, щоб сформувати раунд.');
    }
    const pairing = generateFixedModePairing(playingTeams, state.players);
    const round: Round = {
      id: randomId(),
      index: state.rounds.length + 1,
      matches: toMatches(pairing.configuration.courts),
      restingPlayerIds: rotation.restingIds,
      completed: false,
      pairingScore: pairing.score,
    };
    return { round, hasGenderViolation: false };
  }

  const rotation = computeRandomModeRotation(
    state.players,
    state.settings.courtsCount,
    previousRound,
    state.settings.genderRulesEnabled,
  );
  const playingPlayers = state.players.filter((p) => rotation.playingIds.includes(p.id));
  if (playingPlayers.length < 4) {
    throw new Error('Недостатньо гравців, щоб сформувати раунд.');
  }
  const pairing = generateRandomModePairing(playingPlayers, state.settings.genderRulesEnabled);
  const round: Round = {
    id: randomId(),
    index: state.rounds.length + 1,
    matches: toMatches(pairing.configuration.courts),
    restingPlayerIds: rotation.restingIds,
    completed: false,
    pairingScore: pairing.score,
  };
  return { round, hasGenderViolation: pairing.hasGenderViolation };
}

/**
 * "Reroll pairs" (spec section 10): keep the SAME resting/playing split that
 * the rotation algorithm already decided (that fairness decision shouldn't
 * be re-randomized on a whim), and only re-run the pairing algorithm to get
 * a fresh team/court configuration for whoever is playing.
 */
export function rerollPairing(state: GameState, currentRound: Round): RoundGenerationOutcome {
  if (state.settings.gameMode === 'fixed') {
    const playingTeams = state.fixedTeams.filter((t) =>
      t.playerIds.every((id) => !currentRound.restingPlayerIds.includes(id)),
    );
    if (playingTeams.length < 2) {
      throw new Error('Недостатньо команд, щоб перегенерувати раунд.');
    }
    const pairing = generateFixedModePairing(playingTeams, state.players);
    return {
      round: { ...currentRound, matches: toMatches(pairing.configuration.courts), pairingScore: pairing.score },
      hasGenderViolation: false,
    };
  }

  const playingPlayers = state.players.filter((p) => !currentRound.restingPlayerIds.includes(p.id));
  if (playingPlayers.length < 4) {
    throw new Error('Недостатньо гравців, щоб перегенерувати раунд.');
  }
  const pairing = generateRandomModePairing(playingPlayers, state.settings.genderRulesEnabled);
  return {
    round: { ...currentRound, matches: toMatches(pairing.configuration.courts), pairingScore: pairing.score },
    hasGenderViolation: pairing.hasGenderViolation,
  };
}
