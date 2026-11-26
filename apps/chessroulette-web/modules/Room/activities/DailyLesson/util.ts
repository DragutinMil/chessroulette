import Cookies from 'js-cookie';
import { Chess, Square } from 'chess.js';
import type { IllegalMoveReason } from './lessonEngine';
import type { Lesson } from './lessonDatabase';

export type MessageMoveSegment =
  | { type: 'text'; value: string; start: number; end: number }
  | {
      type: 'move';
      value: string;
      start: number;
      end: number;
      moveNumber: number;
      colorIdx: 0 | 1;
    };

function looksLikeSanMove(word: string): boolean {
  if (!word || word.length > 10) return false;
  if (/^\d+\./.test(word)) return false;
  if (/^\[/.test(word)) return false;
  return /^(O-O-O|O-O|[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8](=[NBRQ])?[+#]?)$/.test(
    word.trim()
  );
}

/**
 * Deli tekst poruke na obican tekst i potezne segmente, da bi potezi u chatu
 * mogli da budu klikabilni i da skacu na poziciju u notaciji.
 */
export function parseMessageMoves(content: string): MessageMoveSegment[] {
  const moveRegex = /(\d+\.(?:\.\.)?\s*[^\s\[\]]+)/g;
  const moveSegments: Array<{
    start: number;
    end: number;
    moveNumber: number;
    colorIdx: 0 | 1;
    value: string;
  }> = [];
  let match: RegExpExecArray | null;
  while ((match = moveRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const numMatch = fullMatch.match(/^(\d+)\.(\.\.)?\s*(.*)$/);
    const moveNumber = numMatch ? parseInt(numMatch[1], 10) : 1;
    const isBlack = !!numMatch?.[2];
    moveSegments.push({
      start: match.index,
      end: match.index + fullMatch.length,
      moveNumber,
      colorIdx: (isBlack ? 1 : 0) as 0 | 1,
      value: fullMatch,
    });
    if (!isBlack) {
      const after = content.slice(match.index + fullMatch.length);
      const inlineBlack = after.match(/^\s+([^\s\[\]]+)/);
      if (inlineBlack && looksLikeSanMove(inlineBlack[1])) {
        const blackValue = inlineBlack[1];
        // Razmak pre crnog poteza ostaje u tekstu, inace se prikaze "e4e5".
        const blackStart =
          match.index +
          fullMatch.length +
          inlineBlack[0].length -
          blackValue.length;
        const blackEnd = blackStart + blackValue.length;
        moveSegments.push({
          start: blackStart,
          end: blackEnd,
          moveNumber,
          colorIdx: 1,
          value: blackValue,
        });
        moveRegex.lastIndex = blackEnd;
      }
    }
  }
  moveSegments.sort((a, b) => a.start - b.start);
  const segments: MessageMoveSegment[] = [];
  let lastEnd = 0;
  for (const seg of moveSegments) {
    if (seg.start > lastEnd) {
      segments.push({
        type: 'text',
        value: content.slice(lastEnd, seg.start),
        start: lastEnd,
        end: seg.start,
      });
    }
    segments.push({
      type: 'move',
      value: seg.value,
      start: seg.start,
      end: seg.end,
      moveNumber: seg.moveNumber,
      colorIdx: seg.colorIdx,
    });
    lastEnd = seg.end;
  }
  if (lastEnd < content.length) {
    segments.push({
      type: 'text',
      value: content.slice(lastEnd),
      start: lastEnd,
      end: content.length,
    });
  }
  return segments;
}

export async function ai_prompt(
  question: string,
  previusMessageId: string,
  model: string
) {
  const token = Cookies.get('sessionToken');
  const body: Record<string, string> = {
    prompt: question,
    model: model,
    agent_name: 'DailyLesson',
  };
  if (previusMessageId?.trim()) body.previous_response_id = previusMessageId;
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_agent_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return data?.message || `Error: ${response.status}`;
    }
    return data;
  } catch (error) {
    console.error('Fetch error', error);
  }
}

export async function getSubscribeInfo() {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_subscription',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}

let movexUpdateQueue = Promise.resolve();

/**
 * Movex dispatch nije concurrent-safe - dva dispatcha u istom ticku pucaju sa
 * "PromiseDelegate is already settled". Zato ih redjamo i ostavljamo razmak
 * da server round-trip i syncState stignu da se zavrse.
 */
export function enqueueMovexUpdate<T>(
  updateFn: () => Promise<T> | void
): Promise<void> {
  movexUpdateQueue = movexUpdateQueue
    .then(async () => {
      await updateFn();
      await new Promise<void>((resolve) => setTimeout(resolve, 150));
    })
    .catch((err) => console.error('Error in Movex update:', err));

  return movexUpdateQueue;
}

/** Kratke, opste podrzavajuce poruke za tacan potez - fallback kad treba variacija. */
const GENERIC_SUCCESS_VARIANTS = [
  'Nice — keep going!',
  'Good move!',
  "That's it!",
  'Keep it up!',
  'Well played!',
  'Sharp!',
];

/** Kratke, opste poruke za pogresan potez - fallback kad treba variacija. */
const GENERIC_WRONG_MOVE_VARIANTS = [
  'Not quite — try again.',
  "Close, but that's not it.",
  'Give it another shot.',
  'Not this time — look again.',
  "Almost — that's not the square.",
];

/** Kratke, podrzavajuce poruke uz Hint dugme - korisnik je zatrazio pomoc, ne pogresio. */
const GENERIC_HINT_HELP_VARIANTS = [
  "Here's some help — take a look at the board!",
  "I've marked the move for you — check the board!",
  'Look at the board, I highlighted it for you.',
  'Here you go — follow the arrow!',
  "Take a peek — I've shown you the way.",
];

/**
 * Lesson.shuffleStepsFrom (Day 22 "Material") - vraca NOVI niz: koraci PRE
 * `fromIndex` ostaju u originalnom redosledu, koraci OD `fromIndex` nadalje
 * se nasumicno premestaju (Fisher-Yates). Original niz se ne menja. Kad je
 * `fromIndex` undefined, vraca isti niz nepromenjen (bez kopiranja).
 */
export function shuffleFrom<T>(items: T[], fromIndex?: number): T[] {
  if (fromIndex == null) return items;
  const fixed = items.slice(0, fromIndex);
  const rest = items.slice(fromIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...fixed, ...rest];
}

/**
 * Bira poruku razlicitu od poslednje poslate, da se dva ista kratka komentara
 * ne nadju za redom. `primary` je uobicajena poruka za ovaj trenutak (npr.
 * step.successText ili step.hintText); ako se poklapa sa poslednjom porukom,
 * izabere se neka druga iz zadatog fonda umesto nje.
 */
export function pickVariedMessage(
  primary: string,
  lastContent?: string,
  variants: string[] = GENERIC_SUCCESS_VARIANTS
): string {
  const pool = [primary, ...variants];
  const candidates = pool.filter((text) => text !== lastContent);
  const options = candidates.length > 0 ? candidates : pool;
  return options[Math.floor(Math.random() * options.length)];
}

/** Isto kao pickVariedMessage, ali sa fondom prilagodjenim pogresnom potezu. */
export function pickVariedWrongMoveMessage(
  primary: string,
  lastContent?: string
): string {
  return pickVariedMessage(primary, lastContent, GENERIC_WRONG_MOVE_VARIANTS);
}

/**
 * Za klik na Hint dugme - korisnik je zatrazio pomoc (ne pogresio potez), pa
 * poruka treba da bude podrzavajuca, ne korektivna. Tabla vec pokazuje strelicu
 * i figuru - tekst samo upucuje korisnika na to.
 */
export function pickHintHelpMessage(lastContent?: string): string {
  const candidates = GENERIC_HINT_HELP_VARIANTS.filter(
    (text) => text !== lastContent
  );
  const options =
    candidates.length > 0 ? candidates : GENERIC_HINT_HELP_VARIANTS;
  return options[Math.floor(Math.random() * options.length)];
}

const PIECE_NAMES: Record<string, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
};

/** kind:'freePlay' - objasnjenje nelegalnog poteza u chatu (vidi illegalMoveReason). */
export function illegalMoveMessage(
  reason: IllegalMoveReason,
  pieceType: string,
  to: string,
  hasLegalTargets: boolean
): string {
  const name = PIECE_NAMES[pieceType] ?? 'piece';
  const text: Record<IllegalMoveReason, string> = {
    ownPiece: `Your own piece is already on ${to}. No capturing your own team.`,
    castling:
      "No castling here. King and Rook can't have moved, the squares between them must be empty, and the King can't pass through check.",
    inCheck:
      'Your King is in check. Fix that first: move the King, block, or capture the attacker.',
    kingIntoCheck: `${to} is under attack. Your King can't walk into check.`,
    pinned: `That ${name} is pinned. Move it and your King is open to attack.`,
    blocked: `Something's in the way. The ${name} can't jump. Only Knights get to do that.`,
    pawnCaptureEmpty: `Pawns go diagonal only to capture. ${to} is empty.`,
    pawnBlocked: `Pawns can't capture straight ahead. The path to ${to} is blocked.`,
    pawnDoubleStep: "2 squares only works on a Pawn's first move.",
    pawnBackward: 'Pawns only go forward. No retreats.',
    pieceShape:
      {
        p: 'Pawns move 1 square forward. 2 on their first move.',
        n: 'Knights move in an L. 2 squares one way, then 1 to the side.',
        b: 'Bishops stay on diagonals. No straight lines.',
        r: 'Rooks move in straight lines. Up, down, left, right. No diagonals.',
        q: 'The Queen goes straight or diagonal. The L belongs to the Knight.',
        k: 'The King moves 1 square at a time. Any direction.',
      }[pieceType] ?? "That piece doesn't move like that.",
  };
  const dots = hasLegalTargets ? ' The dots show where it can go.' : '';
  return `${text[reason]}${dots}`;
}

/**
 * Zakljucavanje lekcija. Dok lekcije pravimo i proveravamo, sve su otvorene
 * svima; pre produkcije prebaciti na false.
 */
export const LESSONS_UNLOCK_ALL = true;
/** PRO korisnik otvara najvise ovoliko novih lekcija dnevno. */
export const LESSONS_PER_DAY = 1;

const LESSON_PROGRESS_KEY = 'outpost.dailyLessons.completed';

/** lessonId -> datum zavrsetka (YYYY-MM-DD, lokalno vreme). */
export type LessonProgress = Record<string, string>;

const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;

// Za sada samo u browseru (localStorage); backend za napredak ne postoji.
export function readLessonProgress(): LessonProgress {
  try {
    const raw = window.localStorage.getItem(LESSON_PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as LessonProgress) : {};
  } catch {
    return {};
  }
}

export function markLessonCompleted(lessonId: string) {
  try {
    const progress = readLessonProgress();
    if (progress[lessonId]) return;
    progress[lessonId] = toDayKey(new Date());
    window.localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage nedostupan (privatni prozor) - napredak se ne pamti.
  }
}

export type LessonAccessStatus = 'done' | 'next' | 'tomorrow' | 'locked';

/**
 * Status svake lekcije po redu: zavrsene su uvek otvorene, prva nezavrsena je
 * "next" dok dnevni limit nije potrosen (inace "tomorrow"), ostale su zakljucane.
 * Bez PRO-a nista nije otvoreno. `unlockAll` otvara sve (admin).
 */
export function getLessonAccess(
  lessonIds: string[],
  progress: LessonProgress,
  isPro: boolean,
  unlockAll = LESSONS_UNLOCK_ALL,
  now = new Date()
) {
  const today = toDayKey(now);
  const doneToday = Object.values(progress).filter((d) => d === today).length;
  const nextIndex = lessonIds.findIndex((id) => !progress[id]);

  return lessonIds.map((id, i) => {
    const status: LessonAccessStatus = progress[id]
      ? 'done'
      : i !== nextIndex
      ? 'locked'
      : doneToday >= LESSONS_PER_DAY
      ? 'tomorrow'
      : 'next';
    const canOpen =
      unlockAll || (isPro && (status === 'done' || status === 'next'));
    return { id, status, canOpen };
  });
}

/** Lesson.pawnyRating - rejting T za jednu partiju, ravnomerno u [min, max]. */
export function rollPawnyRating(lesson: Lesson | null): number | null {
  const cfg = lesson?.pawnyRating;
  if (!cfg) return null;
  if (cfg.fixed != null) return cfg.fixed;
  return Math.round(cfg.min + Math.random() * (cfg.max - cfg.min));
}

/**
 * KPK pravilo 6. reda: beli kralj na 6. redu, tacno ispred svog pesaka
 * (ista linija, ne a/h pesak), pesak bezbedan. Vraca polje kralja ili null.
 */
export function kpkWinningKingSquare(fen: string): string | null {
  const rows = fen.split(' ')[0].split('/');
  let king: string | null = null;
  let enemyKing: string | null = null;
  const pawns: string[] = [];
  rows.forEach((row, r) => {
    let f = 0;
    for (const c of row) {
      if (/\d/.test(c)) {
        f += Number(c);
        continue;
      }
      const sq = `${String.fromCharCode(97 + f)}${8 - r}`;
      if (c === 'K') king = sq;
      if (c === 'k') enemyKing = sq;
      if (c === 'P') pawns.push(sq);
      f += 1;
    }
  });
  if (!king || pawns.length !== 1) return null;
  const k: string = king;
  const p = pawns[0];
  if (p[0] === 'a' || p[0] === 'h') return null;
  const kr = Number(k[1]);
  const dist = (x: string, y: string) =>
    Math.max(
      Math.abs(x.charCodeAt(0) - y.charCodeAt(0)),
      Math.abs(Number(x[1]) - Number(y[1]))
    );
  // Pesak mora biti bezbedan: cuva ga kralj, ili je protivnicki kralj daleko.
  const pawnSafe = dist(k, p) <= 1 || !enemyKing || dist(enemyKing, p) >= 3;
  const ok = kr === 6 && Number(p[1]) < kr && k[0] === p[0] && pawnSafe;
  return ok ? k : null;
}

/**
 * Oznake posle mata: kralj (MATE), figura koja daje sah (CHECK) i njena linija,
 * skakac (GUARD) i polja koja pokriva, ostala pokrivena polja, polja blokirana
 * sopstvenim figurama. Vraca null ako pozicija nije mat.
 */
export function mateExplainHighlight(fen: string): {
  arrows: { from: string; to: string; color: string }[];
  squares: { square: string; color: string; fill: boolean; label?: string }[];
} | null {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return null;
  }
  if (!chess.isCheckmate()) return null;
  const loser = chess.turn();
  const winner = loser === 'w' ? 'b' : 'w';
  const king = chess
    .board()
    .flat()
    .find((p) => p && p.type === 'k' && p.color === loser)?.square;
  if (!king) return null;
  const MATE = 'rgba(242, 53, 141, 0.55)';
  const LINE = 'rgba(7, 218, 99, 0.35)';
  const KNIGHT = 'rgba(17, 198, 209, 0.45)';
  const OWN = 'rgba(140, 140, 140, 0.45)';
  const squares = new Map<
    string,
    { square: string; color: string; fill: boolean; label?: string }
  >();
  const arrows: { from: string; to: string; color: string }[] = [];
  const checkers = chess.attackers(king as Square, winner);
  const f = (sq: string) => sq.charCodeAt(0) - 97;
  const r = (sq: string) => Number(sq[1]);
  const at = (x: number, y: number) => `${String.fromCharCode(97 + x)}${y}`;
  for (const c of checkers) {
    const piece = chess.get(c as Square);
    squares.set(c, { square: c, color: MATE, fill: true, label: 'CHECK' });
    arrows.push({ from: c, to: king, color: 'rgba(242, 53, 141, 0.85)' });
    // Linija napada (top/dama/lovac) do kralja.
    if (piece && piece.type !== 'n' && piece.type !== 'p') {
      const dx = Math.sign(f(king) - f(c));
      const dy = Math.sign(r(king) - r(c));
      let x = f(c) + dx;
      let y = r(c) + dy;
      while (at(x, y) !== king && x >= 0 && x < 8 && y >= 1 && y <= 8) {
        squares.set(at(x, y), { square: at(x, y), color: LINE, fill: true });
        x += dx;
        y += dy;
      }
    }
  }
  // Polja oko kralja; kralj sklonjen da se vide i napadi "kroz" njega.
  const probe = new Chess(fen);
  probe.remove(king as Square);
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const x = f(king) + dx;
      const y = r(king) + dy;
      if (x < 0 || x > 7 || y < 1 || y > 8) continue;
      const sq = at(x, y);
      // Figura koja daje sah zadrzava svoju oznaku (CHECK).
      const keepLabel = squares.get(sq)?.label;
      const occ = chess.get(sq as Square);
      if (occ && occ.color === loser) {
        squares.set(sq, { square: sq, color: OWN, fill: true });
        continue;
      }
      const atk = probe.attackers(sq as Square, winner);
      if (!atk.length) continue;
      const knight = atk.find((a) => probe.get(a as Square)?.type === 'n');
      if (knight) {
        if (!keepLabel)
          squares.set(sq, { square: sq, color: KNIGHT, fill: true });
        arrows.push({ from: knight, to: sq, color: 'rgba(17, 198, 209, 0.8)' });
        if (!squares.get(knight)?.label)
          squares.set(knight, {
            square: knight,
            color: KNIGHT,
            fill: true,
            label: 'GUARD',
          });
      } else if (!squares.has(sq)) {
        squares.set(sq, { square: sq, color: LINE, fill: true });
      }
    }
  squares.set(king, { square: king, color: MATE, fill: true, label: 'MATE' });
  return { arrows, squares: Array.from(squares.values()) };
}

/** Kratak vesel akord (Web Audio, bez fajla) za "Winning position". */
export function playWinChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
    setTimeout(() => ctx.close().catch(() => {}), 1500);
  } catch {
    // bez zvuka ako browser ne podrzava Web Audio
  }
}

/** Zamenjuje {rating} u tekstovima lekcije koje korisnik vidi. */
export function withPawnyRating<T extends Lesson | null>(
  lesson: T,
  rating: number | null
): T {
  if (!lesson || !lesson.pawnyRating) return lesson;
  const fill = (text?: string) =>
    text
      ?.split('{rating}')
      .join(rating == null ? '' : rating.toLocaleString('en-US'));
  return {
    ...lesson,
    endScreenTitle: fill(lesson.endScreenTitle),
    piece: {
      ...lesson.piece,
      bannerText: fill(lesson.piece.bannerText),
      subBannerText: fill(lesson.piece.subBannerText),
    },
    intro: lesson.intro && { ...lesson.intro, text: fill(lesson.intro.text)! },
    introSteps: lesson.introSteps?.map((s) => ({ ...s, text: fill(s.text)! })),
  };
}
