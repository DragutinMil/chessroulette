import { useEffect, useRef } from 'react';
import { ChessFEN } from '@xmatter/util-kit';
import {
  getStockfishWorker,
  withStockfishLock,
} from '@app/modules/ChessEngine/stockfishWorker.js';

type Props = {
  fen: ChessFEN;
  /** Da li je protivnik (crni) na potezu SAD i treba da odigra ovu poziciju. */
  active: boolean;
  /** UCI string protivnikovog poteza (npr. 'b6c6'). */
  onMove: (uci: string) => void;
};

/**
 * Protivnik za slobodno matiranje (Day 20 "Deliver Mate" Phase 2, i buduce
 * slicne vezbe) - PUNA snaga Stockfish-a, bez namernog slabljenja ili
 * nasumicnosti (za razliku od PawnyEngine.tsx, koji je namerno MNOGO slabiji
 * za "prava partija" lekcije). Ovde je bas poenta vezbe da se crni kralj
 * brani najboljom odbranom koju engine nadje - korisnik uci da matira PROTIV
 * stvarnog otpora, ne protiv slucajnih poteza.
 *
 * Deljeni worker (getStockfishWorker, isti singleton kao PawnyEngine i svi
 * ostali Stockfish potrosaci) - zato se Skill Level EKSPLICITNO resetuje na
 * maksimum pri mount-u, ne oslanja se da je worker vec u "jakom" stanju (ako
 * je korisnik malopre bio u Day 14/18 partiji, worker bi inace ostao na
 * Pawny-jevom Skill Level 0).
 *
 * `withStockfishLock` (stockfishWorker.js) - sam upit (stop/position/go i
 * njegov 'message' listener) ide kroz DELJENI red, ne direktno na worker.
 * Ranije, bez reda, Hint box-method upiti (checkmateTechnique.ts, do 4 po
 * kliku) su mogli da "upadnu" tacno izmedju ovog stop/position/go i njegovog
 * bestmove-a - jedan bi prekinuo pretragu drugog, ili bi mu tudj listener
 * "pojeo" bestmove - i crni je ostajao bez odgovora. Lock garantuje da je u
 * svakom trenutku najvise jedan upit aktivan na worker-u.
 */
export const MateDefenseEngine = ({ fen, active, onMove }: Props) => {
  const lastRepliedFenRef = useRef<string | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const worker = getStockfishWorker();
    worker.postMessage('setoption name Skill Level value 20');
    worker.postMessage('setoption name Contempt value 0');
    // NAMERNO se worker ne gasi na unmount - isti razlog kao PawnyEngine.tsx
    // (deljeni singleton, gasenje u Strict Mode izazivalo mount->cleanup->mount).
  }, []);

  useEffect(() => {
    if (!active) return;
    // Vec odigrano za ovu tacnu poziciju - ne pitaj engine ponovo (fen se
    // jos nije promenio dok Movex ne potvrdi prethodni potez).
    if (lastRepliedFenRef.current === fen) return;

    // Ako se ovaj efekat ocisti (fen se promenio, potez vracen, unmount) PRE
    // nego sto bestmove stigne, odgovor se i dalje ceka (da lock-u bude
    // osloboden kad-tad) ali se vise NE primenjuje - sprecava da zastareo,
    // "zakasneo" potez upadne na vec promenjenu tablu.
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
              const uci = data.split(' ')[1];
              if (!cancelled && uci && uci !== '(none)') {
                lastRepliedFenRef.current = fen;
                onMoveRef.current(uci);
              }
              finish();
            }
          };
          // Bezbednosni limit - bez ovoga, ako engine iz bilo kog razloga
          // nikad ne odgovori, lock bi ostao zauvek zakljucan za sve ostale
          // potrosace (Hint, PawnyEngine).
          const safetyTimeout = setTimeout(finish, 5000);
          worker.addEventListener('message', onMessage);

          worker.postMessage('stop');
          worker.postMessage(`position fen ${fen}`);
          // K+Q vs K je trivijalno za bilo koji engine i na plitkoj pretrazi,
          // ali 500ms daje malo vise sigurnosti (i prirodniju, ne-trenutnu
          // pauzu) bez da partija deluje spora.
          worker.postMessage('go movetime 500');
        })
    );

    return () => {
      cancelled = true;
    };
  }, [fen, active]);

  return null;
};
