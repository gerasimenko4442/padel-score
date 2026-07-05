import type { GameState } from '../types';

const STORAGE_KEY = 'padel-score:game-state:v1';

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Не вдалося зберегти стан гри в localStorage', err);
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (err) {
    console.error('Не вдалося прочитати збережений стан гри', err);
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Не вдалося очистити збережений стан гри', err);
  }
}

/** A saved game is only worth resuming if it actually has players / progress. */
export function hasResumableGame(): boolean {
  const state = loadGameState();
  return !!state && state.status !== 'finished' && state.players.length > 0;
}
