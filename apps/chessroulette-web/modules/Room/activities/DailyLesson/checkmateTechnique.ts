import { Chess } from 'chess.js';
import { ChessColor, ChessFEN } from '@xmatter/util-kit';
import { requestBestMoveAmong } from './lessonEngine';

export type BoxMethodPhase = 'box' | 'approach' | 'mate';

export type BoxMethodHint = {
  uci: string;
  san: string;
  phase: BoxMethodPhase;
};

/**
 * "Box method" za mat kraljicom i kraljem protiv usamljenog kralja (Day 20
 * "Deliver Mate" Phase 2) - korisnica eksplicitno trazila:
 *   1. BOX - dama SAMA (bez kralja) suzava protivnikov prostor, UVEK. Nijedan
 *      potez koji POGORSA stvari (vece bekstvo kraljju) se ne predlaze -
 *      vidi `safeQueenMoves` ispod. Kad POSTOJI potez koji STROGO smanjuje
 *      kraljevu pokretljivost, engine/fallback ga prirodno preferira (manja
 *      preostala pokretljivost = bolji rezultat). Kad TRENUTNO nijedan potez
 *      ne smanjuje (korisnicin primer - kralj sa 3 bekstva, nijedan JEDAN
 *      damin potez ih odmah ne svede ispod 3), dama i dalje NASTAVLJA da
 *      radi "pripremnim" potezom (jednako dobrim, ne gorim) umesto da
 *      prerano preda kontrolu kralju - `lastHintQueenSquare` sprecava da se
 *      taj pripremni potez naizmenicno vrati na isto polje (ciklus).
 *   2. "Bocni" sah je DOZVOLJEN kao box potez kad ne pogorsava stvari (cesto
 *      ba STROGO poboljsava, potiskuje kralja za jos jednu liniju) - to JESTE
 *      deo prave tehnike.
 *   3. APPROACH - cim VISE NIJEDAN bezbedan damin potez ne postoji uopste
 *      (box je stvarno iscrpljen), Hint prelazi na engine-ov najbolji potez
 *      KRALJEM - prakticno se ovo poklapa sa "kralju ostalo jedno bekstvo"
 *      (korisnicin opis), ali je provera adaptivna (stvarno "nema vise sta
 *      dama da uradi"), ne tvrdo "==1".
 *   4. MATE - cim je mat moguc (bilo kojim potezom), ima prednost nad svim.
 * Engine se ogranicava na dati (vec filtriran) podskup poteza preko
 * standardnog UCI `go searchmoves` (requestBestMoveAmong) - njegova PRAVA
 * procena, samo suzen i VEC bezbedan izbor. Ako engine poziv ne uspe (worker
 * nedostupan, timeout), pada nazad na lokalnu "najvise suzi polja kralju"
 * heuristiku nad ISTIM filtriranim skupom, da Hint nikad ne ostane bez
 * odgovora i nikad ne predlozi korak unazad.
 */

function findPiece(
  chess: Chess,
  type: 'k' | 'q',
  color: ChessColor
): string | null {
  const board = chess.board();
  for (const row of board) {
    for (const sq of row) {
      if (sq && sq.type === type && sq.color === color) return sq.square;
    }
  }
  return null;
}

/**
 * Legalni potezi kralja date boje u DATOJ poziciji, bez obzira na to ciji je
 * stvarno red (FEN-turn-flip trik) - "koliko bekstva ima kralj SAD".
 */
function hypotheticalKingMoves(fen: ChessFEN, color: ChessColor) {
  const parts = fen.split(' ');
  parts[1] = color;
  parts[3] = '-';
  try {
    const chess = new Chess(parts.join(' ') as ChessFEN);
    return chess.moves({ verbose: true }).filter((m) => m.piece === 'k');
  } catch {
    return [];
  }
}

type VerboseQueenMove = { from: string; to: string; san: string; piece: string };

/**
 * Damini potezi koji su SIGURNI (ne daju damu, ne prave pat). `maxMobility`
 * kontrolise koliko strogo - ako je `currentMobility - 1` (stroza, PROVERENO
 * ciklus-bezbedna varijanta), trazi se STVARNO smanjenje; ako je
 * `currentMobility` (labavija), dozvoljavaju se i "vezani"/pripremni potezi
 * koji ne pogorsavaju. Labavija varijanta SAMA PO SEBI nije ciklus-bezbedna
 * (testirano - lokalna "najmanja preostala pokretljivost" heuristika upada u
 * 3-4-ciklus medju vezanim potezima) - zato se labavija lista nudi SAMO
 * engine-u (vidi pickBoxMethodHint), nikad lokalnom fallback-u.
 */
function safeQueenMoves(
  fen: ChessFEN,
  allMoves: VerboseQueenMove[],
  defenderColor: ChessColor,
  maxMobility: number,
  excludeSquare?: string | null
): VerboseQueenMove[] {
  const queenMoves = allMoves.filter((m) => m.piece === 'q');
  const result: VerboseQueenMove[] = [];
  for (const m of queenMoves) {
    if (excludeSquare && m.to === excludeSquare) continue;
    const c2 = new Chess(fen);
    c2.move({ from: m.from, to: m.to });
    if (c2.isStalemate()) continue;
    const defKingSq = findPiece(c2, 'k', defenderColor);
    const kingCanTakeQueen =
      !!defKingSq &&
      Math.abs(defKingSq.charCodeAt(0) - m.to.charCodeAt(0)) <= 1 &&
      Math.abs(Number(defKingSq[1]) - Number(m.to[1])) <= 1;
    if (kingCanTakeQueen) continue;
    const newMobility = hypotheticalKingMoves(
      c2.fen() as ChessFEN,
      defenderColor
    ).length;
    if (newMobility <= maxMobility) result.push(m);
  }
  return result;
}

/** Medju vec filtriranim (garantovano napredujucim) kandidatima, bira onaj sa najmanjom preostalom pokretljivoscu. */
function pickTightestMobility(
  fen: ChessFEN,
  candidates: VerboseQueenMove[],
  defenderColor: ChessColor
): VerboseQueenMove | null {
  let best: VerboseQueenMove | null = null;
  let bestMobility = Infinity;
  for (const m of candidates) {
    const c2 = new Chess(fen);
    c2.move({ from: m.from, to: m.to });
    const mobility = hypotheticalKingMoves(c2.fen() as ChessFEN, defenderColor)
      .length;
    if (mobility < bestMobility) {
      bestMobility = mobility;
      best = m;
    }
  }
  return best;
}

export async function pickBoxMethodHint(
  fen: ChessFEN,
  attackerColor: ChessColor,
  /**
   * Polje na koje je PRETHODNI Hint predlozio damu (ako je taj predlog i bio
   * damin potez) - jedini oslonac protiv ciklusa kad nijedan potez ne pravi
   * strogo poboljsanje (vidi safeQueenMoves). Pozivalac (DailyLessonActivity)
   * cuva ovo u ref-u, azurira ga posle svakog Hint poziva, resetuje na novi
   * korak. Opciono - bez njega se i dalje izbegava pogorsanje, samo bez
   * zastite od "vezanog" ponavljanja istog polja.
   */
  lastHintQueenSquare?: string | null
): Promise<BoxMethodHint | null> {
  const defenderColor: ChessColor = attackerColor === 'w' ? 'b' : 'w';
  const chess = new Chess(fen);
  if (chess.turn() !== attackerColor) return null;

  const allMoves = chess.moves({ verbose: true });

  // 1. Mat uvek ima prednost, u bilo kojoj fazi.
  for (const m of allMoves) {
    const c2 = new Chess(fen);
    c2.move({ from: m.from, to: m.to, promotion: m.promotion });
    if (c2.isCheckmate()) {
      return { uci: m.from + m.to, san: m.san, phase: 'mate' };
    }
  }

  const currentMobility = hypotheticalKingMoves(fen, defenderColor).length;

  // 2a. STROGO poboljsanje - jedini skup ponudjen I engine-u I lokalnom
  // fallback-u, jer je PROVERENO ciklus-bezbedan (konacan brojac, mora da
  // opada). Ovo je glavni, uobicajeni slucaj.
  const strictCandidates = safeQueenMoves(
    fen,
    allMoves,
    defenderColor,
    currentMobility - 1
  );
  const kingMoves = allMoves.filter((m) => m.piece === 'k');

  if (strictCandidates.length) {
    const uciCandidates = strictCandidates.map((m) => m.from + m.to);
    const engineUci = await requestBestMoveAmong(fen, uciCandidates);
    const played = engineUci
      ? strictCandidates.find((m) => m.from + m.to === engineUci)
      : undefined;
    if (played) {
      return { uci: engineUci!, san: played.san, phase: 'box' };
    }
    const fb = pickTightestMobility(fen, strictCandidates, defenderColor);
    if (fb) return { uci: fb.from + fb.to, san: fb.san, phase: 'box' };
  }

  // 2b. Nijedan potez damom TRENUTNO ne smanjuje kraljevu pokretljivost
  // (korisnicin konkretan primer - 3 slobodna polja, nijedan JEDAN potez ih
  // odmah ne svede ispod 3) - dama JOS UVEK ne sme da preda kontrolu kralju
  // ovde, ali "vezan"/pripremni potez je BEZBEDAN SAMO kroz pravu
  // engine-ovu dublju procenu (testirano - moja 1-potezna lokalna
  // heuristika ovde upada u 3-4-potezni ciklus, pa joj se labavija lista
  // namerno NIKAD ne nudi). Ako engine ne odgovori, radije predji na
  // APPROACH fazu ispod nego da lokalno rizikujem ciklus.
  const lateralCandidates = safeQueenMoves(
    fen,
    allMoves,
    defenderColor,
    currentMobility,
    lastHintQueenSquare
  );
  const lateralPool =
    lateralCandidates.length > 0
      ? lateralCandidates
      : safeQueenMoves(fen, allMoves, defenderColor, currentMobility);
  if (lateralPool.length) {
    const uciCandidates = lateralPool.map((m) => m.from + m.to);
    const engineUci = await requestBestMoveAmong(fen, uciCandidates);
    const played = engineUci
      ? lateralPool.find((m) => m.from + m.to === engineUci)
      : undefined;
    if (played) {
      return { uci: engineUci!, san: played.san, phase: 'box' };
    }
  }

  // 3. APPROACH FAZA - box je iscrpljen (nijedan damin potez vise ne pravi
  // napredak) - pitaj engine za najbolji potez SAMO medju potezima kraljem
  // koji STVARNO priblizavaju kraljeve (isti "strogo bolje od trenutnog"
  // filter kao box faza, isti razlog - bez njega kralj ume da se zaglavi
  // naizmenicno izmedju dva susedna polja, isto ponavljanje kao kod dame,
  // samo sad rizikuje i pat ako nijedan kandidat to ne proveri).
  const defKingSqNow = findPiece(chess, 'k', defenderColor);
  const attackerKingSqNow = findPiece(chess, 'k', attackerColor);
  const dist = (a: string, b: string) =>
    Math.max(
      Math.abs(a.charCodeAt(0) - b.charCodeAt(0)),
      Math.abs(Number(a[1]) - Number(b[1]))
    );
  const currentKingDist =
    defKingSqNow && attackerKingSqNow
      ? dist(attackerKingSqNow, defKingSqNow)
      : Infinity;
  const progressingKingMoves = kingMoves.filter((m) => {
    if (!defKingSqNow) return false;
    const c2 = new Chess(fen);
    c2.move({ from: m.from, to: m.to });
    if (c2.isStalemate()) return false;
    return dist(m.to, defKingSqNow) < currentKingDist;
  });

  // Redak slucaj - sva polja koja bi STVARNO priblizila kraljeve su ili
  // nelegalna ili prave pat (npr. dama vec "zatvorila" bas ta polja kao
  // deo box-a) - nasilno guranje kralja na najmanje-lose od preostalih bi
  // ovde moglo da zaglavi u beskonacnom "napred-nazad" sutiranju (nadjeno
  // testiranjem). Umesto toga, trazi od engine-a NEOGRANICEN (bez
  // searchmoves) najbolji potez - moze biti i damin "pricekaj" potez koji
  // oslobodi situaciju, dublja pretraga nalazi izlaz koji 1-potezna lokalna
  // heuristika ne vidi.
  if (progressingKingMoves.length === 0) {
    const anyEngineUci = await requestBestMoveAmong(fen);
    if (anyEngineUci) {
      const playedMove = allMoves.find(
        (m) => m.from + m.to === anyEngineUci
      );
      if (playedMove) {
        return {
          uci: anyEngineUci,
          san: playedMove.san,
          phase: playedMove.piece === 'q' ? 'box' : 'approach',
        };
      }
    }
  }

  const kingCandidates =
    progressingKingMoves.length > 0 ? progressingKingMoves : kingMoves;
  if (kingCandidates.length) {
    const uciCandidates = kingCandidates.map((m) => m.from + m.to);
    const engineUci = await requestBestMoveAmong(fen, uciCandidates);
    const played = engineUci
      ? kingCandidates.find((m) => m.from + m.to === engineUci)
      : undefined;
    if (played) {
      return { uci: engineUci!, san: played.san, phase: 'approach' };
    }
    // Lokalni fallback - kralj koji se najvise priblizi protivnickom kralju,
    // medju vec filtriranim (bezbednim, napredujucim) kandidatima.
    let best: (typeof kingCandidates)[number] | null = null;
    let bestDist = Infinity;
    for (const m of kingCandidates) {
      if (!defKingSqNow) continue;
      const c2 = new Chess(fen);
      c2.move({ from: m.from, to: m.to });
      if (c2.isStalemate()) continue;
      const d = dist(m.to, defKingSqNow);
      if (d < bestDist) {
        bestDist = d;
        best = m;
      }
    }
    if (best) return { uci: best.from + best.to, san: best.san, phase: 'approach' };
  }

  // Bezbednosni fallback - ne bi trebalo da se desi u legalnoj K+Q vs K
  // poziciji (i engine i oba fallback-a iznad bi morali da otkazu). Jos
  // uvek izbegava pat ako je ikako moguce.
  const nonStalemateMoves = allMoves.filter((m) => {
    const c2 = new Chess(fen);
    c2.move({ from: m.from, to: m.to, promotion: m.promotion });
    return !c2.isStalemate();
  });
  const any = nonStalemateMoves[0] ?? allMoves[0];
  return any ? { uci: any.from + any.to, san: any.san, phase: 'approach' } : null;
}
