import type { Player, Round } from '../types';
import { MIN_PLAYERS } from '../types';

/** Returns an error message, or null if the name is valid. */
export function validatePlayerName(name: string, existingPlayers: Player[], excludeId?: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Введіть ім'я гравця";
  if (trimmed.length > 30) return "Ім'я занадто довге (макс. 30 символів)";
  const duplicate = existingPlayers.some(
    (p) => p.id !== excludeId && p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) return 'Гравець з таким іменем вже доданий';
  return null;
}

export function canStartGame(playerCount: number, courtsCount: number): string | null {
  if (playerCount < MIN_PLAYERS) return `Потрібно щонайменше ${MIN_PLAYERS} гравці, щоб почати гру`;
  if (courtsCount < 1) return 'Потрібен щонайменше 1 корт';
  if (courtsCount * 4 > 200) return 'Забагато кортів для кількості гравців';
  return null;
}

export function canFormFixedTeams(playerCount: number): string | null {
  if (playerCount < MIN_PLAYERS) return `Потрібно щонайменше ${MIN_PLAYERS} гравці`;
  if (playerCount % 2 !== 0) return 'Для фіксованих пар кількість гравців має бути парною';
  return null;
}

/** No draws are allowed — every match must produce a winner. */
export function validateScore(scoreA: number | null, scoreB: number | null): string | null {
  if (scoreA == null || scoreB == null) return 'Введіть рахунок обох команд';
  if (!Number.isFinite(scoreA) || !Number.isFinite(scoreB)) return 'Рахунок має бути числом';
  if (scoreA < 0 || scoreB < 0) return "Рахунок не може бути від'ємним";
  if (scoreA === scoreB) return 'Нічия неможлива — потрібен переможець';
  return null;
}

/**
 * Defensive integrity check for a generated round: no player may appear
 * twice within the round (whether across two matches, or resting AND
 * playing at once), and every match must have exactly 4 distinct players.
 * Used as a safety net around the pairing algorithm's output.
 */
export function validateRoundIntegrity(round: Round): string | null {
  const seen = new Set<string>();
  for (const match of round.matches) {
    const ids = [...match.teamA.playerIds, ...match.teamB.playerIds];
    if (new Set(ids).size !== 4) return `Матч на корті ${match.court}: гравець призначений двічі в одному матчі`;
    for (const id of ids) {
      if (seen.has(id)) return `Раунд ${round.index}: гравець призначений одразу на двох кортах`;
      seen.add(id);
    }
  }
  for (const id of round.restingPlayerIds) {
    if (seen.has(id)) return `Раунд ${round.index}: гравець одночасно відпочиває і грає`;
    seen.add(id);
  }
  return null;
}
