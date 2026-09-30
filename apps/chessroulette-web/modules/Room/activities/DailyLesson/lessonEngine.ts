import { Chess, Square } from 'chess.js';
import { ChessColor, ChessFEN } from '@xmatter/util-kit';
import { ArrowsMap } from '@app/components/Chessboard/types';
import { ANY_LEGAL_REPLY, LessonStep } from './lessonDatabase';

export type LessonMove = { from: Square; to: Square; promoteTo?: string };

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Cita figuru direktno iz FEN board dela - bez chess.js, pa radi i na
 * pozicijama kojima smo rucno okrenuli boju na potezu.
 */
export function pieceAt(
  fen: ChessFEN,
  square: string
): { color: ChessColor; type: string } | null {
  const rows = fen.split(' ')[0]?.split('/');
  if (!rows || rows.length !== 8) return null;

  const fileIndex = FILES.indexOf(square[0]);
  const rank = Number(square[1]);
  if (fileIndex < 0 || !rank || rank < 1 || rank > 8) return null;

  const row = rows[8 - rank];
  if (!row) return null;

  let col = 0;
  for (const ch of row) {
    const empty = Number(ch);
    if (!Number.isNaN(empty)) {
      if (fileIndex < col + empty) return null;
      col += empty;
      continue;
    }
    if (col === fileIndex) {
      return {
        color: ch === ch.toUpperCase() ? 'w' : 'b',
        type: ch.toLowerCase(),
      };
    }
    col += 1;
  }
  return null;
}

export function uciToMove(uci: string): LessonMove {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.length >= 5 ? { promoteTo: uci[4] } : {}),
  };
}

export function movesMatch(uci: string, move: LessonMove): boolean {
  return uci.slice(0, 4) === `${move.from}${move.to}`;
}

/**
 * Sva polja do kojih data figura STVARNO moze da stigne iz `from` - koristi
 * chess.js (ne rucni obrazac kretanja), pa vazi tacno za tu figuru (top ide
 * pravo, lovac dijagonalno, itd.) umesto da uvek pretpostavi top.
 *
 * Boju na potezu forsiramo na boju figure - hint je cisto edukativan
 * ("kako se ova figura krece"), ne zavisi od toga cija je stvarno partija na
 * potezu u FEN-u.
 */
export function pieceLegalTargets(fen: ChessFEN, from: string): string[] {
  const piece = pieceAt(fen, from);
  if (!piece) return [];

  const parts = fen.split(' ');
  parts[1] = piece.color;
  parts[3] = '-';

  try {
    const chess = new Chess(parts.join(' '));
    return chess
      .moves({ square: from as Square, verbose: true })
      .map((m) => m.to);
  } catch {
    return [];
  }
}

/** Strelica na tacan potez - koristi se za Hint dugme. */
export function buildSolutionArrow(
  uci: string,
  colorHex = '#07DA63'
): ArrowsMap {
  const { from, to } = uciToMove(uci);
  const id = `${from}${to}-${colorHex}` as keyof ArrowsMap;
  return { [id]: [from, to, colorHex] } as ArrowsMap;
}

/**
 * Bira protivnicki odgovor. Za skriptovane poteze vraca zadati UCI, a za
 * ANY_LEGAL_REPLY nasumican legalan potez (puzzle 5 - "kralj gde god").
 */
export function resolveOpponentReply(
  fen: ChessFEN,
  uci: string
): LessonMove | null {
  if (uci !== ANY_LEGAL_REPLY) return uciToMove(uci);

  try {
    const legal = new Chess(fen).moves({ verbose: true });
    if (legal.length === 0) return null;
    const pick = legal[Math.floor(Math.random() * legal.length)];
    return { from: pick.from as Square, to: pick.to as Square };
  } catch {
    return null;
  }
}

/**
 * Posle korisnikovog poteza na indeksu `index`, da li jos ima njegovih
 * poteza u koraku? Odredjuje da li forsiramo potez nazad na njegovu boju.
 */
export function hasMoreUserMoves(step: LessonStep, index: number): boolean {
  if (step.kind === 'teach') return index + 1 < step.solution.length;
  return index + 2 < step.solution.length;
}
