import { useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessFEN } from '@xmatter/util-kit';
import {
  getStockfishWorker,
  withStockfishLock,
} from '@app/modules/ChessEngine/stockfishWorker.js';

type Props = {
  fen: ChessFEN;
  /** Da li je Pawny na potezu SAD (crni) i treba da odigra ovu poziciju. */
  active: boolean;
  /** UCI string Pawny-jevog poteza (npr. 'e7e5'). */
  onMove: (uci: string) => void;
  /**
   * Vidi RANDOM_MOVE_CHANCE ispod - opciono po lekciji, da Pawny moze biti
   * MALO jaci u kasnijim partijama (npr. Day 18 "Game 2" - "malo ostriji")
   * bez diranja Day 14 ponasanja. Default (nedefinisano) = RANDOM_MOVE_CHANCE.
   */
  randomMoveChance?: number;
};

/**
 * Pawny (Day 14 "Your First Game") - namerno MNOGO slabiji od "samo Skill
 * Level 0" (to se ispostavilo i dalje prejako - Stockfish-ov Skill Level 0
 * je i dalje otprilike 1100-1400, daleko iznad 100-300 koliko Pawny tvrdi
 * da je). Umesto da se oslanja na Stockfish parametre (nepouzdano ispod
 * njegovog standardnog "poda"), VECINU vremena ignorise Stockfish-ov predlog
 * i odigra NASUMICAN LEGALAN potez (chess.js) - jedini nacin da se garantuje
 * genuinely slaba, "deca ovo pobede" igra, bez obzira sta engine iznutra radi.
 */
const RANDOM_MOVE_CHANCE = 0.8; // "deli figure za zabavu" - uglavnom nasumican potez, retko "pametan"

function pickBotMoveUci(
  fen: string,
  stockfishUci: string,
  randomMoveChance: number
): string {
  if (Math.random() < randomMoveChance) {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (moves.length > 0) {
        const m = moves[Math.floor(Math.random() * moves.length)];
        // Pesak koji stize na krajnji red MORA imati slovo promocije u UCI
        // stringu (inace ChessFENBoard.move() nema sta da stavi na to polje
        // osim samog pesaka - "Invalid FEN: some pawns are on the edge rows"
        // je bas to). chess.js obicno vec vraca m.promotion za ove poteze,
        // ali ovo je eksplicitna sigurnosna mreza ako ikad ne bude.
        const isPromotion =
          m.piece === 'p' && (m.to[1] === '1' || m.to[1] === '8');
        const promotion = m.promotion ?? (isPromotion ? 'q' : '');
        return `${m.from}${m.to}${promotion}`;
      }
    } catch {
      // nevalidan fen ili slicno - padni nazad na Stockfish-ov predlog
    }
  }
  return stockfishUci;
}

// Pawny "razmislja" ovoliko DUGO pre nego sto stvarno odigra potez (izbor
// izmedju nasumicnog i Stockfish-ovog predloga je trenutan, ovo je samo
// vestacka pauza da partija ne deluje robotski). NIKAD duze od 3 sekunde,
// cela partija - samo 1, 2 ili 3s, nasumicno, bez izuzetaka.
function pickPawnyThinkMs() {
  const quick = [1000, 2000, 3000];
  return quick[Math.floor(Math.random() * quick.length)];
}

export const PawnyEngine = ({
  fen,
  active,
  onMove,
  randomMoveChance = RANDOM_MOVE_CHANCE,
}: Props) => {
  const lastRepliedFenRef = useRef<string | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const thinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const worker = getStockfishWorker();
    worker.postMessage('setoption name Skill Level value 0');
    worker.postMessage('setoption name Contempt value 0');
    // NAMERNO se worker ne gasi na unmount (terminateStockfish) - deljen je
    // (singleton) kroz celu partiju/sesiju, isti kao kod ostalih Stockfish
    // potrosaca u ovom repou. Gasenje ovde je u React 18 Strict Mode (dev)
    // izazivalo mount->cleanup->mount na SVAKI load stranice, sto je ubijalo
    // i odmah ponovo pravilo worker tacno dok je prvi "go" vec bio u toku.
  }, []);

  useEffect(() => {
    if (thinkTimeoutRef.current) {
      clearTimeout(thinkTimeoutRef.current);
      thinkTimeoutRef.current = null;
    }
    if (!active) return;
    // Vec odigrano za ovu tacnu poziciju - ne pitaj engine ponovo (fen se
    // jos nije promenio dok Movex ne potvrdi prethodni Pawny potez).
    if (lastRepliedFenRef.current === fen) return;

    // Vidi MateDefenseEngine.tsx - isti razlog za withStockfishLock (deljeni
    // worker, Hint box-method upiti su se preplitali sa ovim upitom).
    let cancelled = false;

    withStockfishLock(
      (worker: Worker) =>
        new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            worker.removeEventListener('message', onMessage);
            clearTimeout(safetyTimeout);
            resolve();
          };
          const onMessage = (event: MessageEvent) => {
            const data = event.data;
            if (typeof data === 'string' && data.startsWith('bestmove')) {
              const stockfishUci = data.split(' ')[1];
              if (
                !cancelled &&
                stockfishUci &&
                stockfishUci !== '(none)'
              ) {
                lastRepliedFenRef.current = fen;
                const uci = pickBotMoveUci(
                  fen,
                  stockfishUci,
                  randomMoveChance
                );
                thinkTimeoutRef.current = setTimeout(() => {
                  onMoveRef.current(uci);
                }, pickPawnyThinkMs());
              }
              finish();
            }
          };
          const safetyTimeout = setTimeout(finish, 5000);
          worker.addEventListener('message', onMessage);

          worker.postMessage('stop');
          worker.postMessage(`position fen ${fen}`);
          worker.postMessage('go movetime 150');
        })
    );

    return () => {
      cancelled = true;
      if (thinkTimeoutRef.current) {
        clearTimeout(thinkTimeoutRef.current);
        thinkTimeoutRef.current = null;
      }
    };
  }, [fen, active, randomMoveChance]);

  return null;
};
