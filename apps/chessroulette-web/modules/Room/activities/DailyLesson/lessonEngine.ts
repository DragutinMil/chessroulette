import { Chess, Square } from 'chess.js';
import { ChessColor, ChessFEN } from '@xmatter/util-kit';
import { ArrowsMap } from '@app/components/Chessboard/types';
import { withStockfishLock } from '@app/modules/ChessEngine/stockfishWorker.js';
import { ANY_LEGAL_REPLY, LessonStep } from './lessonDatabase';

export type LessonMove = { from: Square; to: Square; promoteTo?: string };

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/**
 * Jednokratan upit Stockfish-u za najbolji potez u DATOJ poziciji (ne
 * kontinuiran protivnikov "engine" kao PawnyEngine/MateDefenseEngine -
 * ovo je za LessonStep.liveHint, Day 20 "Deliver Mate" Phase 2 Hint dugme).
 * Isti deljeni worker singleton, kroz `withStockfishLock` (stockfishWorker.js)
 * - ranije se ovde pretpostavljalo da se Hint i protivnikov engine "u praksi"
 * ne preklapaju (Hint samo na korisnikov red, engine samo na protivnikov), ali
 * pickBoxMethodHint ume da napravi i do 4 uzastopna ovakva upita u JEDNOM
 * Hint kliku - to je bilo dovoljno da im se stop/position/go i 'message'
 * listeneri preplicu sa MateDefenseEngine-ovim upitom cim bi se partija
 * nastavila (stvaran uzrok "crni ne odgovara" bug-a). Lock garantuje da je u
 * svakom trenutku najvise JEDNA pretraga aktivna na deljenom worker-u. Vraca
 * UCI string ili null (nevalidna pozicija, worker nedostupan, ili nikad nije
 * stigao odgovor - 5s bezbednosni limit).
 */
export function requestBestMoveUci(fen: string): Promise<string | null> {
  return requestBestMoveAmong(fen);
}

/**
 * Isto kao requestBestMoveUci, ali opciono OGRANICENO na dati podskup
 * poteza (standardno UCI `go searchmoves ...`) - engine i dalje bira
 * NAJBOLJI potez, samo mu je izbor suzen. Koristi LessonStep.hintTechnique
 * 'queenBoxMethod' (Day 20 "Deliver Mate" Phase 2) - "slusaj engine-ov
 * najbolji potez DAMOM dok kralj ima vise od jednog bekstva, tek onda
 * engine-ov najbolji potez KRALJEM" (korisnicin eksplicitan zahtev - ne
 * sopstvena heuristika koja samo broji preostala polja).
 */
export function requestBestMoveAmong(
  fen: string,
  candidateUcis?: string[]
): Promise<string | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (candidateUcis && candidateUcis.length === 0) {
    return Promise.resolve(null);
  }
  return withStockfishLock(
    (worker: Worker) =>
      new Promise<string | null>((resolve) => {
        let settled = false;
        const finish = (uci: string | null) => {
          if (settled) return;
          settled = true;
          worker.removeEventListener('message', onMessage);
          clearTimeout(safetyTimeout);
          resolve(uci);
        };
        const onMessage = (event: MessageEvent) => {
          const data = event.data;
          if (typeof data === 'string' && data.startsWith('bestmove')) {
            const uci = data.split(' ')[1];
            finish(uci && uci !== '(none)' ? uci : null);
          }
        };
        const safetyTimeout = setTimeout(() => finish(null), 5000);
        worker.addEventListener('message', onMessage);
        worker.postMessage('setoption name Skill Level value 20');
        worker.postMessage('stop');
        worker.postMessage(`position fen ${fen}`);
        const searchmoves = candidateUcis?.length
          ? ` searchmoves ${candidateUcis.join(' ')}`
          : '';
        worker.postMessage(`go movetime 600${searchmoves}`);
      })
  );
}

/**
 * Sva polja izmedju `from` i `to` (ukljucujuci oba kraja), redom - SAMO ako
 * leze na istom redu (row), koloni (file) ili dijagonali. Vraca null ako
 * nisu poravnati. Koristi se za "reveal path" animaciju (History lekcija,
 * "oznaci red/kolonu/dijagonalu"), ali je generican geometrijski helper.
 */
export function computeLinePath(from: Square, to: Square): Square[] | null {
  const fromFile = FILES.indexOf(from[0]);
  const fromRank = Number(from[1]);
  const toFile = FILES.indexOf(to[0]);
  const toRank = Number(to[1]);
  const df = toFile - fromFile;
  const dr = toRank - fromRank;
  if (df === 0 && dr === 0) return null;
  if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) return null;

  const steps = Math.max(Math.abs(df), Math.abs(dr));
  const stepFile = df === 0 ? 0 : df / steps;
  const stepRank = dr === 0 ? 0 : dr / steps;

  const path: Square[] = [];
  for (let i = 0; i <= steps; i++) {
    const file = fromFile + stepFile * i;
    const rank = fromRank + stepRank * i;
    path.push(`${FILES[file]}${rank}` as Square);
  }
  return path;
}

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

/**
 * Geometrijsko "poljace" L-poteza skakaca - polje od `from` pomereno za JEDAN
 * korak duz duze ose L-a (2-polja pravac), na istom polju kao pocetno duz
 * krace ose. Ne postoji stvarno "usput" polje za skakaca (on skace), ovo je
 * cisto vizuelni oslonac za "jump over" efekat (LessonStep.jumpGlow) - ako na
 * tom polju STVARNO stoji neka figura, ona kratko zasvetli kad skakac odigra.
 */
export function knightElbowSquare(from: Square, to: Square): Square | null {
  const fromFile = FILES.indexOf(from[0]);
  const fromRank = Number(from[1]);
  const toFile = FILES.indexOf(to[0]);
  const toRank = Number(to[1]);
  const df = toFile - fromFile;
  const dr = toRank - fromRank;
  if (Math.abs(df) !== 2 && Math.abs(dr) !== 2) return null;

  if (Math.abs(df) === 2) {
    return `${FILES[fromFile + df / 2]}${fromRank}` as Square;
  }
  return `${from[0]}${fromRank + dr / 2}` as Square;
}

/**
 * Trenutno polje figure datog tipa/boje - koristi se za 'unorderedTargets'
 * korake, gde polazno polje iz solution niza vise ne vazi posle prvog poteza
 * (figura se pomerila, a redosled hvatanja mete nije fiksiran).
 */
export function findPieceSquare(
  fen: ChessFEN,
  color: ChessColor,
  type: string
): Square | null {
  for (let rank = 1; rank <= 8; rank++) {
    for (const file of FILES) {
      const square = `${file}${rank}`;
      const piece = pieceAt(fen, square);
      if (piece && piece.color === color && piece.type === type) {
        return square as Square;
      }
    }
  }
  return null;
}

/**
 * Puni RED (rank) na kom stoji svaki top date boje - NE kolona, NE dijagonala
 * (vidi LessonStep.highlightRookRanks, npr. Day 17 "Two Rooks Checkmate" -
 * posle svakog poteza, oba topa pokazuju CEO red na kom stoje, da korisnik
 * vidi koliko polja je kralju oduzeto). Grupisano PO TOPU (ne spljosteno u
 * jednu listu) da pozivalac moze da oboji svaki top svojom bojom (npr. onaj
 * koji bas sahira drugacije od onog koji samo drzi liniju).
 */
export function rookRankSquaresByRook(
  fen: ChessFEN,
  color: ChessColor
): { rookSquare: string; rankSquares: string[] }[] {
  const groups: { rookSquare: string; rankSquares: string[] }[] = [];
  for (let rank = 1; rank <= 8; rank++) {
    for (const file of FILES) {
      const square = `${file}${rank}`;
      const piece = pieceAt(fen, square);
      if (piece && piece.color === color && piece.type === 'r') {
        groups.push({
          rookSquare: square,
          rankSquares: FILES.map((f) => `${f}${rank}`),
        });
      }
    }
  }
  return groups;
}

export function uciToMove(uci: string): LessonMove {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    ...(uci.length >= 5 ? { promoteTo: uci[4] } : {}),
  };
}

/**
 * `requireExactPromotion` (LessonStep.requireExactPromotion, npr. Day 19
 * "Pawn Promotion" trke - samo promocija u DAMU je tacna, top/lovac/skakac
 * se tretiraju kao pogresan potez, ne kao "tacno ali drugi ton" - za razliku
 * od Pawn lekcije (nonQueenPromotionText), gde je svaka promocija tacna.
 * Default (false) - ignorise promoteTo pri poredjenju, postojece ponasanje.
 */
export function movesMatch(
  uci: string,
  move: LessonMove,
  requireExactPromotion?: boolean
): boolean {
  if (uci.slice(0, 4) !== `${move.from}${move.to}`) return false;
  if (requireExactPromotion && uci.length >= 5) {
    return (move.promoteTo ?? '').toLowerCase() === uci[4].toLowerCase();
  }
  return true;
}

/**
 * Sva polja do kojih data figura STVARNO moze da stigne iz `from` - koristi
 * chess.js (ne rucni obrazac kretanja), pa vazi tacno za tu figuru (top ide
 * pravo, lovac dijagonalno, itd.) umesto da uvek pretpostavi top.
 *
 * Boju na potezu forsiramo na boju figure - hint je cisto edukativan
 * ("kako se ova figura krece"), ne zavisi od toga cija je stvarno partija na
 * potezu u FEN-u. En passant polje (5. deo FEN-a) NAMERNO ostaje netaknuto -
 * ako ga bi brisali, chess.js ne bi prepoznao en passant kao legalan potez
 * pesaka, pa bi Hint na takvom koraku pokazao PRAZNO umesto tacnog polja.
 */
export function pieceLegalTargets(fen: ChessFEN, from: string): string[] {
  const piece = pieceAt(fen, from);
  if (!piece) return [];

  const parts = fen.split(' ');
  parts[1] = piece.color;

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

/** Trenutno polje figure koja igra kroz ceo unorderedTargets korak (uvek ista figura). */
function resolveUnorderedPieceSquare(
  fen: ChessFEN,
  step: LessonStep
): Square | null {
  const firstMove = uciToMove(step.solution[0]);
  const startPiece = pieceAt(step.fen, firstMove.from);
  if (!startPiece) return null;
  return findPieceSquare(fen, startPiece.color, startPiece.type);
}

/**
 * Za unorderedTargets korak: da li je korisnikov potez hvatanje NEKE
 * preostale mete (jos nepokupljene) koja je trenutno stvarno legalna sa
 * figurine pozicije - redosled u `solution` je samo spisak meta, ne obavezan
 * redosled igranja. Legalnost (ukljucujuci "ovo polje je jos branjeno")
 * proverava chess.js uzivo.
 */
export function isValidUnorderedMove(
  fen: ChessFEN,
  step: LessonStep,
  move: { from: Square; to: Square }
): boolean {
  const targets = step.solution.map((uci) => uciToMove(uci).to);
  if (!targets.includes(move.to) || !pieceAt(fen, move.to)) return false;
  return pieceLegalTargets(fen, move.from).includes(move.to);
}

/** Prva preostala meta (jos nepokupljena, trenutno legalna) - za Hint strelicu. */
export function resolveNextUnorderedTarget(
  fen: ChessFEN,
  step: LessonStep
): { from: Square; to: Square } | null {
  const pieceSquare = resolveUnorderedPieceSquare(fen, step);
  if (!pieceSquare) return null;
  const legal = pieceLegalTargets(fen, pieceSquare);
  for (const uci of step.solution) {
    const { to } = uciToMove(uci);
    if (pieceAt(fen, to) && legal.includes(to)) {
      return { from: pieceSquare, to };
    }
  }
  return null;
}

export type IllegalMoveReason =
  | 'ownPiece'
  | 'castling'
  | 'inCheck'
  | 'kingIntoCheck'
  | 'pinned'
  | 'blocked'
  | 'pawnCaptureEmpty'
  | 'pawnBlocked'
  | 'pawnDoubleStep'
  | 'pawnBackward'
  | 'pieceShape';

/** Da li su sva polja STROGO izmedju from i to prazna (za top/lovca/damu/pesaka). */
function isPathClear(fen: ChessFEN, from: Square, to: Square): boolean {
  const path = computeLinePath(from, to);
  if (!path) return false;
  return path.slice(1, -1).every((sq) => !pieceAt(fen, sq));
}

/**
 * kind:'freePlay' - ZASTO potez nije legalan, za objasnjenje u chatu. Redom:
 * oblik poteza, sopstvena figura na meti, put, pa tek onda bezbednost kralja.
 * Vraca null ako je potez zapravo legalan ili polje nema korisnikovu figuru.
 */
export function illegalMoveReason(
  fen: ChessFEN,
  from: Square,
  to: Square
): { reason: IllegalMoveReason; piece: string } | null {
  const piece = pieceAt(fen, from);
  if (!piece || from === to) return null;
  if (pieceLegalTargets(fen, from).includes(to)) return null;

  const target = pieceAt(fen, to);

  const df = FILES.indexOf(to[0]) - FILES.indexOf(from[0]);
  const dr = Number(to[1]) - Number(from[1]);
  const adf = Math.abs(df);
  const adr = Math.abs(dr);

  let shapeOk = false;
  let needsClearPath = false;
  switch (piece.type) {
    case 'p': {
      const dir = piece.color === 'w' ? 1 : -1;
      const startRank = piece.color === 'w' ? 2 : 7;
      if (dr * dir <= 0) return { reason: 'pawnBackward', piece: 'p' };
      if (adf === 1 && dr === dir) {
        // Dijagonala - legalno samo kao uzimanje (en passant pokriva chess.js iznad).
        if (!target) return { reason: 'pawnCaptureEmpty', piece: 'p' };
        shapeOk = true;
      } else if (adf === 0 && (dr === dir || dr === 2 * dir)) {
        if (dr === 2 * dir && Number(from[1]) !== startRank) {
          return { reason: 'pawnDoubleStep', piece: 'p' };
        }
        if (target?.color === piece.color) {
          return { reason: 'ownPiece', piece: 'p' };
        }
        if (target || !isPathClear(fen, from, to)) {
          return { reason: 'pawnBlocked', piece: 'p' };
        }
        shapeOk = true;
      }
      break;
    }
    case 'n':
      shapeOk = (adf === 1 && adr === 2) || (adf === 2 && adr === 1);
      break;
    case 'b':
      shapeOk = adf === adr;
      needsClearPath = true;
      break;
    case 'r':
      shapeOk = adf === 0 || adr === 0;
      needsClearPath = true;
      break;
    case 'q':
      shapeOk = adf === adr || adf === 0 || adr === 0;
      needsClearPath = true;
      break;
    case 'k':
      if (adf === 2 && adr === 0) return { reason: 'castling', piece: 'k' };
      shapeOk = adf <= 1 && adr <= 1;
      break;
  }
  if (!shapeOk) return { reason: 'pieceShape', piece: piece.type };
  if (target && target.color === piece.color) {
    return { reason: 'ownPiece', piece: piece.type };
  }
  if (needsClearPath && !isPathClear(fen, from, to)) {
    return { reason: 'blocked', piece: piece.type };
  }

  // Pravilan oblik i slobodan put, a i dalje nelegalno - problem je kralj.
  let inCheck = false;
  try {
    inCheck = new Chess(fen).inCheck();
  } catch {
    // Neispravan FEN - tretiraj kao da nije sah.
  }
  if (inCheck) return { reason: 'inCheck', piece: piece.type };
  if (piece.type === 'k') return { reason: 'kingIntoCheck', piece: 'k' };
  return { reason: 'pinned', piece: piece.type };
}

/**
 * Posle korisnikovog poteza na indeksu `index`, da li jos ima njegovih
 * poteza u koraku? Odredjuje da li forsiramo potez nazad na njegovu boju.
 */
export function hasMoreUserMoves(step: LessonStep, index: number): boolean {
  if (step.kind === 'teach') return index + 1 < step.solution.length;
  return index + 2 < step.solution.length;
}
