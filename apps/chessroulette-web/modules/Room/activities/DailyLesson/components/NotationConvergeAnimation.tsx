import React, { useEffect, useState } from 'react';
import { Square } from 'chess.js';

type Props = {
  /** Ciljno polje, npr. 'c5' - vidi LessonStep.revealSquareAnimation. */
  square: Square;
  /**
   * Opciono slovo figure (npr. 'N' za konja) - Day 27 Part C "napisi potez".
   * Kad je zadato, prikazuje se ISPRED slova/broja, istim redosledom kojim
   * se notacija stvarno pise (figura, pa file, pa rank - npr. "Nf3").
   * Izostavljeno za cist naziv polja (Part A/B) i za pesacke poteze (pesak
   * nema slovo u notaciji).
   */
  pieceLetter?: string;
  /** Isti pixel iznos kao Daily Lesson tabla (sizePx/boardSize). */
  sizePx: number;
  orientation: 'w' | 'b';
  color?: string;
  /** Poziva se kad animacija potpuno izbledi - roditelj onda unmount-uje. */
  onDone: () => void;
};

const squareCenterPx = (
  square: Square,
  sizePx: number,
  orientation: 'w' | 'b'
) => {
  const squareSize = sizePx / 8;
  const file = square.charCodeAt(0) - 97; // 'a' -> 0 ... 'h' -> 7
  const rank = parseInt(square[1], 10); // 1..8
  const fileIndex = orientation === 'w' ? file : 7 - file;
  const rankIndexFromTop = orientation === 'w' ? 8 - rank : rank - 1;
  return {
    x: fileIndex * squareSize + squareSize / 2,
    y: rankIndexFromTop * squareSize + squareSize / 2,
    squareSize,
  };
};

type Phase = 'idle' | 'pieceIn' | 'letterIn' | 'numberIn' | 'settled' | 'fadeOut';

/**
 * Day 27 "Chess Notation" - kad se otkriva tacan potez (posle TACNOG ili
 * NETACNOG odgovora, vidi LessonStep.revealSquareAnimation), notacija se
 * sklapa istim redosledom kojim se pise: (1) slovo figure iskoci odozgo i
 * slegne se (npr. "N" za konja, samo ako je pieceLetter zadato - pesaci ga
 * nemaju), (2) slovo kolone (file) uleti odozdo iz SVOJE kolone, (3) broj
 * reda (rank) uleti sleva iz SVOG reda - sve se sastavi u punu notaciju
 * (npr. "Nf3") tacno iznad ciljnog polja. Korisnicin eksplicitan zahtev.
 * Samo vizuelni flourish preko vec postojeceg trajnog highlight-a
 * (quizBoardHighlight) - ovde nestaje posle par sekundi, highlight ostaje.
 */
export const NotationConvergeAnimation = ({
  square,
  pieceLetter,
  sizePx,
  orientation,
  color = '#07DA63',
  onDone,
}: Props) => {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    setPhase('idle');
    const timers = [
      setTimeout(() => setPhase('pieceIn'), 30),
      setTimeout(() => setPhase('letterIn'), pieceLetter ? 430 : 30),
      setTimeout(() => setPhase('numberIn'), pieceLetter ? 830 : 430),
      setTimeout(() => setPhase('settled'), pieceLetter ? 1300 : 900),
      setTimeout(() => setPhase('fadeOut'), pieceLetter ? 2500 : 2100),
      setTimeout(() => onDone(), pieceLetter ? 2900 : 2500),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [square, pieceLetter]);

  const { x: endX, y: endY, squareSize } = squareCenterPx(
    square,
    sizePx,
    orientation
  );
  // Malo slovo (korisnicin zahtev - "prvo slovo uvek malo"), ne veliko -
  // vazi za KOORDINATU (file), ne za slovo FIGURE (pieceLetter), koje se
  // pise veliko u notaciji (npr. "N", ne "n").
  const fileChar = square[0].toLowerCase();
  const rankChar = square[1];
  const fontSize = Math.max(13, squareSize * 0.32);
  const bubble = fontSize * 1.2;
  // Centar-do-centra razmak izmedju susednih "oblacica" - malo vise od
  // precnika (bubble) da se nikad ne preklapaju, cak ni u 3-clanom nizu
  // (korisnica prijavila da joj se krugovi preklapaju).
  const charSpacing = bubble * 1.08;

  const charCount = pieceLetter ? 3 : 2;
  // offsetIndex: redom piece(0) - file(1) - rank(2) kad ima sve tri, inace
  // file(0) - rank(1). Grupa je UVEK centrirana na stvarni centar polja.
  const offsetFor = (indexAmongShown: number) =>
    (indexAmongShown - (charCount - 1) / 2) * charSpacing;

  const pieceOffset = offsetFor(0);
  const fileOffset = offsetFor(pieceLetter ? 1 : 0);
  const rankOffset = offsetFor(pieceLetter ? 2 : 1);

  // Slovo figure - nema svoju "liniju" na tabli kao file/rank, pa samo
  // iskoci (pop-in) na svoju konacnu poziciju, ne klizi izdaleka.
  const pieceEnd = { x: endX + pieceOffset, y: endY };
  // File kreze iz SVOJE kolone, ispod table (gde stoje a-h oznake) - x se
  // NE menja dok putuje, samo y (ide gore, ka redu ciljnog polja).
  const fileStart = { x: endX, y: sizePx + squareSize * 0.6 };
  const fileEnd = { x: endX + fileOffset, y: endY };
  // Rank kreze iz SVOG reda, levo od table (gde stoje 1-8 oznake) - y se NE
  // menja, samo x (ide desno, ka koloni ciljnog polja).
  const rankStart = { x: -squareSize * 0.6, y: endY };
  const rankEnd = { x: endX + rankOffset, y: endY };

  const pieceShown = phase !== 'idle';
  const fileMoved = phase !== 'idle' && phase !== 'pieceIn';
  const filePos = fileMoved ? fileEnd : fileStart;
  const rankMoved =
    phase === 'numberIn' || phase === 'settled' || phase === 'fadeOut';
  const rankPos = rankMoved ? rankEnd : rankStart;
  const rankVisible = rankMoved;
  const isSettledOrLater = phase === 'settled' || phase === 'fadeOut';
  const isFadingOut = phase === 'fadeOut';

  const bubbleStyle = (
    pos: { x: number; y: number },
    visible: boolean,
    popIn?: boolean
  ): React.CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: bubble,
    height: bubble,
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize,
    color: '#06231a',
    background: color,
    boxShadow: `0 0 14px 2px ${color}aa`,
    transform: `translate(${pos.x - bubble / 2}px, ${pos.y - bubble / 2}px) scale(${
      !visible && popIn ? 0.4 : isSettledOrLater ? 1.16 : 1
    })`,
    opacity: isFadingOut ? 0 : visible ? 1 : 0,
    transition:
      'transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease-out',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 20,
      }}
    >
      {pieceLetter && (
        <span style={bubbleStyle(pieceEnd, pieceShown, true)}>
          {pieceLetter}
        </span>
      )}
      <span style={bubbleStyle(filePos, true)}>{fileChar}</span>
      <span style={bubbleStyle(rankPos, rankVisible)}>{rankChar}</span>
    </div>
  );
};
