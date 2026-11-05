import { Chess, Square } from 'chess.js';
import type { FBHMove } from '@xmatter/util-kit';
import { ai_prompt } from '../../util';
import { analyzePosition, EngineLine } from '../../lessonEngine';

import type { ChapterState } from '../../movex/types';

const UI_CONTROLS = `
UI CONTROLS AVAILABLE TO THE USER:
- "Hint" button: highlights the correct move on the board with an arrow.
- "Repeat" button: restarts the current position from the beginning.
- "Next" button: moves on to the next position, enabled once the current one is solved.
`.trim();

const COACH_STYLE = `
You are a chess coach teaching a complete beginner (rating 100-500).
Lead with the point. One or two short sentences. Go longer only when the question truly needs a step-by-step explanation, and even then stay under four sentences.
No filler, no restating the question, no "great question", no em dashes.
Always bold the key point with **double asterisks**: one or two short phrases per answer, such as a move (**Nf3**), a piece (**Queen**), a square (**e4**) or the core idea (**protect your King**). Never bold a whole sentence. Never start the answer with bold text.
Never use jargon without explaining it. Always answer in English.
`.trim();

// pitanje ne ceka engine duze od ovoga, bez ENGINE bloka ide kao ranije
const ENGINE_WAIT_MS = 3000;
const RECENT_MOVES = 8;

const PIECE_LABELS: Record<string, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
};

const KEY_POINT_REGEX =
  /\b(?:O-O(?:-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|Kings?|Queens?|Rooks?|Bishops?|Knights?|Pawns?|checkmate|stalemate)\b/g;
const MAX_KEY_POINTS = 2;

// AI cesto vrati odgovor bez **, pa sami podebljamo do dve poente (potez/polje, figura)
export function emphasizeKeyPoints(text: string): string {
  if (!text || text.includes('**')) return text;
  const seen = new Set<string>();
  let count = 0;
  return text.replace(KEY_POINT_REGEX, (match, offset: number) => {
    if (count >= MAX_KEY_POINTS || offset === 0) return match;
    // potezi sa brojem (1. e4 e5) su klikabilna dugmad u chatu, ne smeju dobiti **
    if (/\d+\.(?:\.\.)?\s*(?:\S+\s+)?$/.test(text.slice(0, offset)))
      return match;
    const key = match.toLowerCase();
    if (seen.has(key)) return match;
    seen.add(key);
    count++;
    return `**${match}**`;
  });
}

// fokus na polje za pitanje pokrene analizu, a slanje ceka isti rezultat umesto nove analize
const engineContextCache = new Map<string, Promise<string>>();

export function prepareEngineContext(state: ChapterState): Promise<string> {
  const fen = state.displayFen;
  const cached = engineContextCache.get(fen);
  if (cached) return cached;
  if (engineContextCache.size > 20) engineContextCache.clear();
  const promise = buildEngineContext(state)
    .catch(() => '')
    .then((context) => {
      // prazan rezultat (npr. engine se jos ucitavao) se ne pamti, sledece pitanje proba ponovo
      if (!context) engineContextCache.delete(fen);
      return context;
    });
  engineContextCache.set(fen, promise);
  return promise;
}

export async function SendQuestionCoach(
  prompt: string,
  currentChapterState: ChapterState,
  lessonContext?: string
) {
  const model = 'gpt-5.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      ?.idResponse ?? '';

  const engineContext = await Promise.race([
    prepareEngineContext(currentChapterState),
    new Promise<string>((resolve) =>
      setTimeout(() => resolve(''), ENGINE_WAIT_MS)
    ),
  ]);

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'FEN: ' +
    currentChapterState.displayFen +
    (lessonContext ? '\n' + lessonContext : '') +
    (engineContext ? '\n\n' + engineContext : '') +
    '\n\n' +
    COACH_STYLE +
    '\n\n' +
    UI_CONTROLS;

  const data = await ai_prompt(question, previusMessageId, model);

  return data;
}

async function buildEngineContext(state: ChapterState): Promise<string> {
  const fen = state.displayFen;
  const lines = await analyzePosition(fen);
  if (!lines) return '';

  const chess = new Chess(fen);
  const turn = chess.turn();
  const out = [
    'ENGINE (Stockfish, background for you, never quote these numbers to the user):',
    `Side to move: ${colorName(turn)}`,
    `Eval: ${describeScore(lines[0], turn)}`,
    'Best moves: ' +
      lines
        .map(
          (line, i) =>
            `${i + 1}. ${uciToSan(fen, line.uci[0])} (${formatScore(
              line,
              turn
            )})`
        )
        .join('  '),
  ];

  const moves = mainLineMoves(state);
  if (moves.length) {
    out.push(
      `Moves played so far: ${moves
        .slice(-RECENT_MOVES)
        .map((m) => m.san)
        .join(' ')}`
    );
  }

  const userMove = await describeUserMove(state, moves, lines);
  if (userMove) out.push(userMove);

  const hanging = hangingPieces(chess);
  if (hanging.length)
    out.push(`Attacked and undefended: ${hanging.join(', ')}`);

  return out.join('\n');
}

// ocenu pre i posle korisnikovog poteza dobijamo ponovnim igranjem od startingFen; ako se ne poklopi sa tablom, red se preskace
async function describeUserMove(
  state: ChapterState,
  moves: RealMove[],
  currentLines: EngineLine[]
): Promise<string> {
  const userColor = String(state.orientation).startsWith('b') ? 'b' : 'w';
  let index = -1;
  moves.forEach((m, i) => {
    if (m.color === userColor) index = i;
  });
  if (index < 0) return '';

  let before = '';
  let after = '';
  try {
    const chess = new Chess(state.notation.startingFen);
    moves.forEach((m, i) => {
      if (i === index) before = chess.fen();
      chess.move({ from: m.from, to: m.to, promotion: m.promoteTo });
      if (i === index) after = chess.fen();
    });
    if (board(chess.fen()) !== board(state.displayFen)) return '';
  } catch {
    return '';
  }

  const beforeLines = await analyzePosition(before, {
    multiPv: 1,
    movetime: 400,
  });
  // ako protivnik jos nije odgovorio, pozicija posle poteza je ova na tabli i vec je analizirana
  const afterLines =
    board(after) === board(state.displayFen)
      ? currentLines
      : await analyzePosition(after, { multiPv: 1, movetime: 400 });
  if (!beforeLines || !afterLines) return '';

  // engine ocenjuje iz ugla strane na potezu: pre poteza je to korisnik, posle protivnik
  const beforeCp = toCp(beforeLines[0]);
  const afterCp = -toCp(afterLines[0]);
  const loss = beforeCp - afterCp;
  const verdict =
    loss >= 300
      ? 'blunder'
      : loss >= 150
      ? 'mistake'
      : loss >= 70
      ? 'inaccuracy'
      : 'fine';

  return `User's last move: ${
    moves[index].san
  }, eval for the user before ${formatCp(beforeCp)}, after ${formatCp(
    afterCp
  )} (${verdict})`;
}

type RealMove = FBHMove & { isNonMove?: false };

function mainLineMoves(state: ChapterState): RealMove[] {
  const turns = (state.notation?.history ?? []) as FBHMove[][];
  return turns.flat().filter((m): m is RealMove => !m.isNonMove);
}

function hangingPieces(chess: Chess): string[] {
  const result: string[] = [];
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece || piece.type === 'k') continue;
      const enemy = piece.color === 'w' ? 'b' : 'w';
      if (
        chess.isAttacked(piece.square, enemy) &&
        !chess.isAttacked(piece.square, piece.color)
      ) {
        result.push(
          `${colorName(piece.color)} ${PIECE_LABELS[piece.type]} on ${
            piece.square
          }`
        );
      }
    }
  }
  return result;
}

function uciToSan(fen: string, uci: string): string {
  try {
    return new Chess(fen).move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: uci[4],
    }).san;
  } catch {
    return uci;
  }
}

// mat se racuna kao ogromna prednost da bi poredjenje pre/posle radilo isto kao za cp
function toCp(line: EngineLine): number {
  if (line.mate !== null) return line.mate > 0 ? 10000 : -10000;
  return line.scoreCp ?? 0;
}

function formatCp(cp: number): string {
  if (Math.abs(cp) >= 10000) return cp > 0 ? 'forced mate' : 'getting mated';
  const pawns = cp / 100;
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

// Stockfish daje ocenu iz ugla strane na potezu, ovde se prebacuje u ugao belog
function formatScore(line: EngineLine, turn: 'w' | 'b'): string {
  const sign = turn === 'w' ? 1 : -1;
  if (line.mate !== null) {
    const mate = line.mate * sign;
    return `mate in ${Math.abs(mate)} for ${mate > 0 ? 'White' : 'Black'}`;
  }
  const pawns = ((line.scoreCp ?? 0) * sign) / 100;
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

function describeScore(line: EngineLine, turn: 'w' | 'b'): string {
  if (line.mate !== null) return formatScore(line, turn);
  const pawns = ((line.scoreCp ?? 0) * (turn === 'w' ? 1 : -1)) / 100;
  const side = pawns > 0 ? 'White' : 'Black';
  const abs = Math.abs(pawns);
  const words =
    abs < 0.5
      ? 'roughly equal'
      : abs < 1.5
      ? `${side} is slightly better`
      : abs < 3
      ? `${side} is better`
      : `${side} is winning`;
  return `${formatScore(line, turn)} (${words})`;
}

function colorName(color: 'w' | 'b'): string {
  return color === 'w' ? 'White' : 'Black';
}

function board(fen: string): string {
  return fen.split(' ')[0];
}
