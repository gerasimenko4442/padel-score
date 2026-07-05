import type { Player, PlayerStatistics, Round } from '../types';
import { createEmptyStatistics } from '../types';

function bumpPartner(map: Map<string, PlayerStatistics>, id1: string, id2: string): void {
  const s1 = map.get(id1);
  if (s1) s1.partnerCounts[id2] = (s1.partnerCounts[id2] ?? 0) + 1;
  const s2 = map.get(id2);
  if (s2) s2.partnerCounts[id1] = (s2.partnerCounts[id1] ?? 0) + 1;
}

function bumpOpponent(map: Map<string, PlayerStatistics>, id1: string, id2: string): void {
  const s1 = map.get(id1);
  if (s1) s1.opponentCounts[id2] = (s1.opponentCounts[id2] ?? 0) + 1;
  const s2 = map.get(id2);
  if (s2) s2.opponentCounts[id1] = (s2.opponentCounts[id1] ?? 0) + 1;
}

function topEntry(counts: Record<string, number>): string | null {
  let bestId: string | null = null;
  let bestCount = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * Rebuilds every player's `stats` field from scratch using the match log
 * (`rounds`) as the single source of truth. Only COMPLETED rounds count —
 * this is what makes "reroll pairs" on the current round safe: an
 * in-progress round has not been folded into history yet, so regenerating
 * it can never double-count or leak into anyone's stats.
 */
export function recomputeStats(players: Player[], rounds: Round[]): Player[] {
  const statsMap = new Map<string, PlayerStatistics>();
  for (const p of players) statsMap.set(p.id, createEmptyStatistics());

  const completedRounds = rounds.filter((r) => r.completed);

  for (const round of completedRounds) {
    for (const restingId of round.restingPlayerIds) {
      const s = statsMap.get(restingId);
      if (!s) continue;
      s.restCount += 1;
      s.currentPlayStreak = 0;
    }

    for (const match of round.matches) {
      if (match.scoreA == null || match.scoreB == null || match.winner == null) continue;

      const teamAIds = match.teamA.playerIds;
      const teamBIds = match.teamB.playerIds;

      for (const id of [...teamAIds, ...teamBIds]) {
        const s = statsMap.get(id);
        if (!s) continue;
        s.matchesPlayed += 1;
        s.currentPlayStreak += 1;
      }

      bumpPartner(statsMap, teamAIds[0], teamAIds[1]);
      bumpPartner(statsMap, teamBIds[0], teamBIds[1]);
      for (const a of teamAIds) {
        for (const b of teamBIds) bumpOpponent(statsMap, a, b);
      }

      const winnerIds = match.winner === 'A' ? teamAIds : teamBIds;
      const loserIds = match.winner === 'A' ? teamBIds : teamAIds;
      const winnerScore = match.winner === 'A' ? match.scoreA : match.scoreB;
      const loserScore = match.winner === 'A' ? match.scoreB : match.scoreA;

      for (const id of winnerIds) {
        const s = statsMap.get(id);
        if (!s) continue;
        s.wins += 1;
        s.pointsScored += winnerScore;
        s.pointsConceded += loserScore;
        s.winStreak += 1;
        s.longestWinStreak = Math.max(s.longestWinStreak, s.winStreak);
      }
      for (const id of loserIds) {
        const s = statsMap.get(id);
        if (!s) continue;
        s.losses += 1;
        s.pointsScored += loserScore;
        s.pointsConceded += winnerScore;
        s.winStreak = 0;
      }
    }
  }

  for (const s of statsMap.values()) {
    s.pointsDifference = s.pointsScored - s.pointsConceded;
    s.mostFrequentPartnerId = topEntry(s.partnerCounts);
    s.mostFrequentOpponentId = topEntry(s.opponentCounts);
  }

  return players.map((p) => ({ ...p, stats: statsMap.get(p.id)! }));
}

/** Tournament table order per spec: wins -> points difference -> points scored. No draws exist. */
export function sortPlayersForLeaderboard(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (b.stats.wins !== a.stats.wins) return b.stats.wins - a.stats.wins;
    if (b.stats.pointsDifference !== a.stats.pointsDifference) return b.stats.pointsDifference - a.stats.pointsDifference;
    return b.stats.pointsScored - a.stats.pointsScored;
  });
}
