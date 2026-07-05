import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { GameMode, GameState, Gender, Player, Round } from '../types';
import { createEmptyStatistics } from '../types';
import { generateNextRound, rerollPairing as rerollPairingService } from '../services/gameService';
import { clearGameState, hasResumableGame, loadGameState, saveGameState } from '../services/storageService';
import { recomputeStats } from '../utils/statistics';
import { canFormFixedTeams, canStartGame, validatePlayerName, validateScore } from '../utils/validation';
import { randomId } from '../utils/random';
import {
  generateRandomFixedTeams,
  swapFixedModeTeams,
  swapPlayersBetweenFixedTeams,
  swapRandomModePlayers,
} from '../utils/teamAssignment';

function createNewGameState(name: string): GameState {
  const now = Date.now();
  return {
    id: randomId(),
    name: name.trim() || 'Padel Score',
    players: [],
    fixedTeams: [],
    rounds: [],
    currentRoundIndex: -1,
    settings: { gameMode: 'random', courtsCount: 2, genderRulesEnabled: false },
    status: 'setup',
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Reducer: every case here is a pure, non-throwing state transition. Any
// computation that CAN fail (generating a round needs enough players) is
// done ahead of time by the action-creator functions below, which validate
// and call the algorithms themselves, then dispatch plain, already-computed
// results. This keeps the reducer trivially safe and keeps validation in one
// place (the hook), matching the "no UI dependency in core logic" and
// "testable" architecture requirements.
// ---------------------------------------------------------------------------

type Action =
  | { type: 'CREATE_GAME'; name: string }
  | { type: 'ADD_PLAYER'; name: string; gender: Gender }
  | { type: 'REMOVE_PLAYER'; id: string }
  | { type: 'UPDATE_PLAYER'; id: string; patch: Partial<Pick<Player, 'name' | 'gender'>> }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'SET_COURTS_COUNT'; count: number }
  | { type: 'SET_GENDER_RULES'; enabled: boolean }
  | { type: 'SHUFFLE_FIXED_TEAMS' }
  | { type: 'SWAP_FIXED_TEAM_PLAYERS'; playerIdA: string; playerIdB: string }
  | { type: 'TOGGLE_VOLUNTARY_REST'; playerId: string }
  | { type: 'BEGIN_GAME'; round: Round }
  | { type: 'SUBMIT_MATCH_SCORE'; matchId: string; scoreA: number; scoreB: number }
  | { type: 'APPLY_REROLLED_PAIRING'; round: Round }
  | { type: 'SWAP_IN_ROUND'; idA: string; idB: string }
  | { type: 'FINISH_GAME'; completedRounds: Round[]; players: Player[] }
  | { type: 'ADVANCE_TO_NEXT_ROUND'; completedRounds: Round[]; players: Player[]; round: Round }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_GAME'; state: GameState };

function gameReducer(state: GameState, action: Action): GameState {
  const now = Date.now();
  switch (action.type) {
    case 'CREATE_GAME':
      return createNewGameState(action.name);

    case 'ADD_PLAYER': {
      const player: Player = {
        id: randomId(),
        name: action.name.trim(),
        gender: action.gender,
        wantsRestNextRound: false,
        stats: createEmptyStatistics(),
      };
      return { ...state, players: [...state.players, player], updatedAt: now };
    }

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter((p) => p.id !== action.id),
        fixedTeams: state.fixedTeams.filter((t) => !t.playerIds.includes(action.id)),
        updatedAt: now,
      };

    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
        updatedAt: now,
      };

    case 'SET_GAME_MODE': {
      const fixedTeams = action.mode === 'fixed' ? generateRandomFixedTeams(state.players) : [];
      return { ...state, settings: { ...state.settings, gameMode: action.mode }, fixedTeams, updatedAt: now };
    }

    case 'SET_COURTS_COUNT':
      return { ...state, settings: { ...state.settings, courtsCount: Math.max(1, action.count) }, updatedAt: now };

    case 'SET_GENDER_RULES':
      return { ...state, settings: { ...state.settings, genderRulesEnabled: action.enabled }, updatedAt: now };

    case 'SHUFFLE_FIXED_TEAMS':
      return { ...state, fixedTeams: generateRandomFixedTeams(state.players), updatedAt: now };

    case 'SWAP_FIXED_TEAM_PLAYERS':
      return {
        ...state,
        fixedTeams: swapPlayersBetweenFixedTeams(state.fixedTeams, action.playerIdA, action.playerIdB),
        updatedAt: now,
      };

    case 'TOGGLE_VOLUNTARY_REST':
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, wantsRestNextRound: !p.wantsRestNextRound } : p,
        ),
        updatedAt: now,
      };

    case 'BEGIN_GAME':
      return {
        ...state,
        players: state.players.map((p) => ({ ...p, wantsRestNextRound: false })),
        status: 'in_progress',
        rounds: [action.round],
        currentRoundIndex: 0,
        updatedAt: now,
      };

    case 'SUBMIT_MATCH_SCORE': {
      const winner = action.scoreA > action.scoreB ? ('A' as const) : ('B' as const);
      const rounds = state.rounds.map((r, idx) => {
        if (idx !== state.currentRoundIndex) return r;
        return {
          ...r,
          matches: r.matches.map((m) =>
            m.id === action.matchId ? { ...m, scoreA: action.scoreA, scoreB: action.scoreB, winner } : m,
          ),
        };
      });
      return { ...state, rounds, updatedAt: now };
    }

    case 'APPLY_REROLLED_PAIRING': {
      const rounds = state.rounds.map((r, idx) => (idx === state.currentRoundIndex ? action.round : r));
      return { ...state, rounds, updatedAt: now };
    }

    case 'SWAP_IN_ROUND': {
      const currentRound = state.rounds[state.currentRoundIndex];
      if (!currentRound) return state;
      const updatedRound =
        state.settings.gameMode === 'fixed'
          ? swapFixedModeTeams(currentRound, state.fixedTeams, action.idA, action.idB)
          : swapRandomModePlayers(currentRound, action.idA, action.idB);
      const rounds = state.rounds.map((r, idx) => (idx === state.currentRoundIndex ? updatedRound : r));
      return { ...state, rounds, updatedAt: now };
    }

    case 'FINISH_GAME':
      return {
        ...state,
        rounds: action.completedRounds,
        players: action.players.map((p) => ({ ...p, wantsRestNextRound: false })),
        status: 'finished',
        updatedAt: now,
      };

    case 'ADVANCE_TO_NEXT_ROUND':
      // The voluntary-rest flags were already consumed by generateNextRound
      // (called by the advanceRound action-creator below) to build `action.round`;
      // reset them now so opting in to rest is a one-round-only signal, not sticky.
      return {
        ...state,
        rounds: [...action.completedRounds, action.round],
        players: action.players.map((p) => ({ ...p, wantsRestNextRound: false })),
        currentRoundIndex: state.currentRoundIndex + 1,
        updatedAt: now,
      };

    case 'RESET_GAME':
      return createNewGameState('Padel Score');

    case 'LOAD_GAME':
      return action.state;

    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createNewGameState('Padel Score'));
  const [error, setError] = useState<string | null>(null);
  const [genderWarning, setGenderWarning] = useState<string | null>(null);
  const [resumeAvailable] = useState<boolean>(() => hasResumableGame());
  // Guards against overwriting a resumable save before the user has chosen
  // whether to resume it or start fresh (see resumeGame/discardSavedGame/createGame).
  const resolvedResumePrompt = useRef(!hasResumableGame());

  useEffect(() => {
    if (!resolvedResumePrompt.current) return;
    saveGameState(state);
  }, [state]);

  const clearError = useCallback(() => setError(null), []);
  const clearGenderWarning = useCallback(() => setGenderWarning(null), []);

  const createGame = useCallback((name: string) => {
    resolvedResumePrompt.current = true;
    dispatch({ type: 'CREATE_GAME', name });
  }, []);

  const resumeGame = useCallback((): GameState | null => {
    resolvedResumePrompt.current = true;
    const saved = loadGameState();
    if (!saved) return null;
    dispatch({ type: 'LOAD_GAME', state: saved });
    return saved;
  }, []);

  const discardSavedGame = useCallback(() => {
    resolvedResumePrompt.current = true;
    clearGameState();
  }, []);

  const addPlayer = useCallback(
    (name: string, gender: Gender) => {
      const err = validatePlayerName(name, state.players);
      if (err) {
        setError(err);
        return false;
      }
      dispatch({ type: 'ADD_PLAYER', name, gender });
      return true;
    },
    [state.players],
  );

  const removePlayer = useCallback((id: string) => dispatch({ type: 'REMOVE_PLAYER', id }), []);

  const updatePlayer = useCallback(
    (id: string, patch: Partial<Pick<Player, 'name' | 'gender'>>) => {
      if (patch.name !== undefined) {
        const err = validatePlayerName(patch.name, state.players, id);
        if (err) {
          setError(err);
          return false;
        }
      }
      dispatch({ type: 'UPDATE_PLAYER', id, patch });
      return true;
    },
    [state.players],
  );

  const setGameMode = useCallback(
    (mode: GameMode) => {
      if (mode === 'fixed') {
        const err = canFormFixedTeams(state.players.length);
        if (err) {
          setError(err);
          return false;
        }
      }
      dispatch({ type: 'SET_GAME_MODE', mode });
      return true;
    },
    [state.players.length],
  );

  const setCourtsCount = useCallback((count: number) => dispatch({ type: 'SET_COURTS_COUNT', count }), []);
  const setGenderRules = useCallback((enabled: boolean) => dispatch({ type: 'SET_GENDER_RULES', enabled }), []);
  const shuffleFixedTeams = useCallback(() => dispatch({ type: 'SHUFFLE_FIXED_TEAMS' }), []);
  const swapFixedTeamPlayers = useCallback(
    (playerIdA: string, playerIdB: string) => dispatch({ type: 'SWAP_FIXED_TEAM_PLAYERS', playerIdA, playerIdB }),
    [],
  );
  const toggleVoluntaryRest = useCallback((playerId: string) => dispatch({ type: 'TOGGLE_VOLUNTARY_REST', playerId }), []);

  const startGame = useCallback(() => {
    const err = canStartGame(state.players.length, state.settings.courtsCount);
    if (err) {
      setError(err);
      return false;
    }
    if (state.settings.gameMode === 'fixed' && state.fixedTeams.length < 2) {
      setError('Сформуйте принаймні 2 команди, щоб почати гру');
      return false;
    }
    try {
      const { round, hasGenderViolation } = generateNextRound(state);
      dispatch({ type: 'BEGIN_GAME', round });
      if (hasGenderViolation) {
        setGenderWarning('Не вдалося повністю дотриматись гендерних правил у цьому раунді через співвідношення гравців.');
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося сформувати перший раунд');
      return false;
    }
  }, [state]);

  const submitMatchScore = useCallback(
    (matchId: string, scoreA: number, scoreB: number) => {
      const err = validateScore(scoreA, scoreB);
      if (err) {
        setError(err);
        return false;
      }
      dispatch({ type: 'SUBMIT_MATCH_SCORE', matchId, scoreA, scoreB });
      return true;
    },
    [],
  );

  const currentRound = state.rounds[state.currentRoundIndex] ?? null;

  const rerollPairing = useCallback(() => {
    if (!currentRound) return false;
    try {
      const { round, hasGenderViolation } = rerollPairingService(state, currentRound);
      dispatch({ type: 'APPLY_REROLLED_PAIRING', round });
      if (hasGenderViolation) {
        setGenderWarning('Не вдалося повністю дотриматись гендерних правил у цьому раунді через співвідношення гравців.');
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося перегенерувати пари');
      return false;
    }
  }, [state, currentRound]);

  const swapInRound = useCallback((idA: string, idB: string) => dispatch({ type: 'SWAP_IN_ROUND', idA, idB }), []);

  const advanceRound = useCallback(
    (finish: boolean) => {
      const completedRounds = state.rounds.map((r, idx) => (idx === state.currentRoundIndex ? { ...r, completed: true } : r));
      const playersWithStats = recomputeStats(state.players, completedRounds);

      if (finish) {
        dispatch({ type: 'FINISH_GAME', completedRounds, players: playersWithStats });
        return true;
      }

      try {
        const { round, hasGenderViolation } = generateNextRound({ ...state, players: playersWithStats, rounds: completedRounds });
        dispatch({ type: 'ADVANCE_TO_NEXT_ROUND', completedRounds, players: playersWithStats, round });
        if (hasGenderViolation) {
          setGenderWarning('Не вдалося повністю дотриматись гендерних правил у цьому раунді через співвідношення гравців.');
        }
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не вдалося сформувати наступний раунд');
        return false;
      }
    },
    [state],
  );

  const resetGame = useCallback(() => {
    clearGameState();
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const isCurrentRoundFullyScored = useMemo(
    () => !!currentRound && currentRound.matches.every((m) => m.winner !== null),
    [currentRound],
  );

  return {
    state,
    error,
    clearError,
    genderWarning,
    clearGenderWarning,
    resumeAvailable,
    resumeGame,
    discardSavedGame,
    createGame,
    addPlayer,
    removePlayer,
    updatePlayer,
    setGameMode,
    setCourtsCount,
    setGenderRules,
    shuffleFixedTeams,
    swapFixedTeamPlayers,
    toggleVoluntaryRest,
    startGame,
    submitMatchScore,
    rerollPairing,
    swapInRound,
    advanceRound,
    resetGame,
    currentRound,
    isCurrentRoundFullyScored,
  };
}

export type UseGameState = ReturnType<typeof useGameState>;
