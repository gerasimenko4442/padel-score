import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { GameState, Gender } from '../types';
import { sortPlayersForLeaderboard } from '../utils/statistics';

type Rgb = [number, number, number];

const COLOR = {
  primary: [31, 157, 92] as Rgb,
  primaryDark: [18, 99, 58] as Rgb,
  info: [46, 111, 226] as Rgb,
  ink: [23, 36, 28] as Rgb,
  inkMuted: [92, 107, 98] as Rgb,
  white: [255, 255, 255] as Rgb,
  gold: [201, 155, 47] as Rgb,
  silver: [140, 150, 158] as Rgb,
  bronze: [176, 105, 57] as Rgb,
};

const MARGIN = 14;

function genderLabel(g: Gender): string {
  return g === 'male' ? 'Чоловік' : 'Жінка';
}

function getFinalY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLOR.primaryDark);
  doc.text(text, MARGIN, y);
  doc.setDrawColor(...COLOR.primary);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 2.5, doc.internal.pageSize.getWidth() - MARGIN, y + 2.5);
  return y + 10;
}

/**
 * Builds and downloads the full end-of-game PDF report:
 * players, final ranking, podium, round-by-round match results, and
 * per-player statistics — per spec section 14.
 */
export function exportGameToPdf(state: GameState): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = MARGIN;

  // ---------------------------------------------------------------- Header
  doc.setFillColor(...COLOR.primary);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLOR.white);
  doc.text('Padel Score', MARGIN, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date(state.createdAt).toLocaleDateString('uk-UA');
  doc.text(`${state.name} · ${dateStr}`, MARGIN, 22);
  y = 34;

  // --------------------------------------------------------------- Players
  y = sectionTitle(doc, `Гравці (${state.players.length})`, y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['#', "Ім'я", 'Стать']],
    body: state.players.map((p, i) => [String(i + 1), p.name, genderLabel(p.gender)]),
    theme: 'striped',
    headStyles: { fillColor: COLOR.primary, textColor: COLOR.white },
    styles: { fontSize: 9, textColor: COLOR.ink },
  });
  y = getFinalY(doc) + 10;

  // ---------------------------------------------------------- Final ranking
  const ranked = sortPlayersForLeaderboard(state.players);
  y = sectionTitle(doc, 'Турнірна таблиця', y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [['Місце', "Ім'я", 'В', 'П', 'Різниця', 'Очки']],
    body: ranked.map((p, i) => [
      String(i + 1),
      p.name,
      String(p.stats.wins),
      String(p.stats.losses),
      (p.stats.pointsDifference > 0 ? '+' : '') + p.stats.pointsDifference,
      String(p.stats.pointsScored),
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR.primaryDark, textColor: COLOR.white },
    styles: { fontSize: 9, textColor: COLOR.ink },
  });
  y = getFinalY(doc) + 10;

  // ------------------------------------------------------------- Podium
  y = ensureSpace(doc, y, 10 + ranked.length * 12);
  y = sectionTitle(doc, "П'єдестал", y);
  const podium = ranked.slice(0, 3);
  const podiumColors: Rgb[] = [COLOR.gold, COLOR.silver, COLOR.bronze];
  const labels = ['1 місце', '2 місце', '3 місце'];
  podium.forEach((p, i) => {
    const boxY = y + i * 12;
    // Safe: podium has at most 3 entries, and podiumColors/labels always have exactly 3.
    doc.setFillColor(...podiumColors[i]!);
    doc.roundedRect(MARGIN, boxY, pageWidth - MARGIN * 2, 10, 2, 2, 'F');
    doc.setTextColor(...COLOR.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`${labels[i]}  ·  ${p.name}`, MARGIN + 4, boxY + 6.8);
  });
  y = y + podium.length * 12 + 8;

  // ------------------------------------------------------- Round results
  y = ensureSpace(doc, y, 16);
  y = sectionTitle(doc, 'Результати раундів', y);
  const playerName = (id: string) => state.players.find((pl) => pl.id === id)?.name ?? '?';
  const completedRounds = state.rounds.filter((r) => r.completed);

  for (const round of completedRounds) {
    y = ensureSpace(doc, y, 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR.ink);
    doc.text(`Раунд ${round.index}`, MARGIN, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Корт', 'Команда A', 'Команда B', 'Рахунок', 'Переможець']],
      body: round.matches.map((m) => [
        String(m.court),
        m.teamA.playerIds.map(playerName).join(' / '),
        m.teamB.playerIds.map(playerName).join(' / '),
        `${m.scoreA ?? '-'} : ${m.scoreB ?? '-'}`,
        m.winner === 'A'
          ? m.teamA.playerIds.map(playerName).join(' / ')
          : m.winner === 'B'
            ? m.teamB.playerIds.map(playerName).join(' / ')
            : '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: COLOR.info, textColor: COLOR.white },
      styles: { fontSize: 8.5, textColor: COLOR.ink },
    });
    y = getFinalY(doc) + 7;

    if (round.restingPlayerIds.length > 0) {
      y = ensureSpace(doc, y, 7);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR.inkMuted);
      doc.text(`Відпочивають: ${round.restingPlayerIds.map(playerName).join(', ')}`, MARGIN, y);
      y += 8;
    }
  }

  // ----------------------------------------------------------- Statistics
  y = ensureSpace(doc, y, 16);
  y = sectionTitle(doc, 'Статистика гравців', y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        "Ім'я",
        'Матчі',
        'В',
        'П',
        'Різниця',
        'Відпочинок',
        'Серія перемог',
        'Найкраща серія',
        'Частий партнер',
        'Частий суперник',
      ],
    ],
    body: ranked.map((p) => [
      p.name,
      String(p.stats.matchesPlayed),
      String(p.stats.wins),
      String(p.stats.losses),
      (p.stats.pointsDifference > 0 ? '+' : '') + p.stats.pointsDifference,
      String(p.stats.restCount),
      String(p.stats.winStreak),
      String(p.stats.longestWinStreak),
      p.stats.mostFrequentPartnerId ? playerName(p.stats.mostFrequentPartnerId) : '—',
      p.stats.mostFrequentOpponentId ? playerName(p.stats.mostFrequentOpponentId) : '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: COLOR.primaryDark, textColor: COLOR.white, fontSize: 7.5 },
    styles: { fontSize: 7.5, textColor: COLOR.ink },
  });

  // ------------------------------------------------------------- Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.inkMuted);
    doc.text(`Padel Score · сторінка ${i} з ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, {
      align: 'center',
    });
  }

  const safeName = state.name.replace(/[^\p{L}\p{N}]+/gu, '_') || 'gra';
  doc.save(`${safeName}_zvit.pdf`);
}
