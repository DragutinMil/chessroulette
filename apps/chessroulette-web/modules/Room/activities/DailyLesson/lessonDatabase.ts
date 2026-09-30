import { ChessColor, ChessFEN } from '@xmatter/util-kit';

/**
 * 'teach' - korisnik igra vise uzastopnih poteza svojom bojom (bez protivnika).
 * 'puzzle' - klasican puzzle, solution ide naizmenicno korisnik/protivnik.
 */
export type LessonStepKind = 'teach' | 'puzzle';

/** Protivnicki odgovor koji nije skriptovan - engine bira bilo koji legalan potez. */
export const ANY_LEGAL_REPLY = '*';

export type LessonStep = {
  id: string;
  kind: LessonStepKind;
  fen: ChessFEN;
  /** Boja kojom korisnik igra (i orijentacija table). */
  orientation: ChessColor;
  /**
   * UCI potezi.
   * teach: svi potezi su korisnikovi.
   * puzzle: parni indeksi su korisnikovi, neparni protivnicki (ili ANY_LEGAL_REPLY).
   */
  solution: string[];
  /** Naslov iznad table. */
  prompt: string;
  /** Poruka trenera kad korak pocne. */
  introText: string;
  /** Poruka trenera posle svakog tacnog poteza koji nije poslednji. */
  successText?: string;
  /** Poruka trenera kad je korak zavrsen. */
  doneText: string;
  /** Poruka trenera na pogresan potez. */
  hintText: string;
  /** Pun celebration overlay sa konfetima na kraju koraka. */
  celebrate?: boolean;
};

export type Lesson = {
  id: string;
  level: 1 | 2 | 3;
  day: number;
  title: string;
  intro: { title: string; text: string };
  /** Figura koju lekcija uci - pokrece uvodnu animaciju i generisane poruke. */
  piece: {
    name: string; // 'rook', 'bishop', ... - koristi se u tekstu ("mastered the {name}")
    glyph: string; // unicode figura za mini-animaciju uvoda
    movement: 'straight' | 'diagonal';
  };
  steps: LessonStep[];
};

const DAY_1_ROOK: Lesson = {
  id: 'l1-d1-rook',
  level: 1,
  day: 1,
  title: 'Rook — How the Rook Moves',
  piece: { name: 'rook', glyph: '♜', movement: 'straight' },
  intro: {
    title: 'Rook — How the Rook Moves',
    text: 'The rook moves in straight lines — left, right, up and down. As far as it likes — but it can never jump over another piece!',
  },
  steps: [
    {
      id: 'teach-horizontal',
      kind: 'teach',
      fen: '7k/8/8/8/Rp1p2p1/8/8/7K w - - 0 1',
      orientation: 'w',
      solution: ['a4b4', 'b4d4', 'd4g4'],
      prompt: 'Capture all three pawns',
      introText:
        'Your rook is on a4. Slide it sideways and capture every pawn on the row.',
      successText: 'Nice — keep going!',
      doneText: 'Excellent! The rook collected all the pawns!',
      hintText:
        'The rook only moves straight — left, right, up or down. Try again!',
    },
    {
      id: 'teach-vertical',
      kind: 'teach',
      fen: '7k/3p4/3p4/8/8/8/8/3R3K w - - 0 1',
      orientation: 'w',
      solution: ['d1d6', 'd6d7'],
      prompt: 'Now capture going up the board',
      introText:
        'Same rook, new direction. Climb the d-file and take both pawns.',
      successText: "That's it!",
      doneText: 'Great! The rook goes up and down too!',
      hintText:
        "The rook can't jump over pieces — capture the closest pawn first!",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: '7k/8/1p2p3/8/8/4p1p1/8/1R5K w - - 0 1',
      orientation: 'w',
      solution: ['b1b6', 'b6e6', 'e6e3', 'e3g3'],
      prompt: 'Mix it up — sideways and up and down',
      introText:
        'Four pawns this time. Use both directions to collect them all.',
      successText: 'Good one!',
      doneText: 'Bravo — you are a Rook Master now!',
      hintText:
        "Straight lines only. Look for a pawn on the rook's row or column.",
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: '6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1',
      orientation: 'w',
      solution: ['c1c8'],
      prompt: "One move — and it's checkmate! Can you find it?",
      introText:
        'The black king is trapped behind its own pawns. One rook move ends the game.',
      doneText: "CHECKMATE! 🎉 You've learned how the rook moves. Great start!",
      hintText:
        "The king can't breathe behind its own pawns — take the back rank!",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: 'r1b3k1/5ppb/pn5p/1p6/5N2/P5P1/1PP3BP/2KR4 w - - 0 1',
      orientation: 'w',
      solution: ['d1d8'],
      prompt: 'White to play — mate in 1',
      introText: 'Same idea as before. The back rank is wide open.',
      doneText: 'Checkmate! One down.',
      hintText: 'Look at the open d-file and the black back rank.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: 'r5k1/pp3p1p/2r3pB/5n2/8/P2R3P/1P3PP1/3R2K1 w - - 0 1',
      orientation: 'w',
      solution: ['d3d8', 'a8d8', 'd1d8'],
      prompt: 'White to play — mate in 2',
      introText:
        'You have two rooks on the d-file. Give the first one away to open the door.',
      successText: 'Keep going — finish it!',
      doneText: 'Beautiful! A rook sacrifice into mate.',
      hintText: 'Sacrifice on d8 first — the second rook delivers the mate.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: '4r1k1/pb3pp1/1pn1r2p/8/8/2B3P1/PP2NP1P/R3R1K1 b - - 0 1',
      orientation: 'b',
      solution: ['e6e2', 'e1e2', 'e8e2'],
      prompt: 'Black to play — win a piece',
      introText:
        'You are Black now. Both your rooks look down the e-file — count the attackers.',
      successText: 'Good — take it back!',
      doneText: 'A whole knight up. Well played!',
      hintText: 'Stack your rooks on the e-file and take on e2 twice.',
    },
    {
      id: 'puzzle-4',
      kind: 'puzzle',
      fen: 'r7/5pk1/8/1bR5/1P4p1/1BP3Pp/5P1P/6K1 b - - 0 1',
      orientation: 'b',
      solution: ['a8a1', 'b3d1', 'a1d1'],
      prompt: 'Black to play — mate in 2',
      introText:
        'The white king is stuck on the back rank and your pawn on h3 covers g2.',
      successText: 'He blocked — now take it!',
      doneText: 'Checkmate! The back rank strikes again.',
      hintText: 'Bring your rook to the first rank with check.',
    },
    {
      id: 'puzzle-5',
      kind: 'puzzle',
      fen: '8/6k1/R7/8/5K2/8/8/1R6 w - - 0 1',
      orientation: 'w',
      solution: ['b1b7', ANY_LEGAL_REPLY, 'a6a8'],
      prompt: 'White to play — mate in 2',
      introText:
        'Two rooks, no king needed. Push the black king up one rank at a time.',
      successText: 'Now the other rook finishes it.',
      doneText:
        "Ladder mate! That's five puzzles — you mastered the rook today!",
      hintText:
        'Check with one rook to push the king up, then mate with the other.',
      celebrate: true,
    },
  ],
};

const DAY_2_BISHOP: Lesson = {
  id: 'l1-d2-bishop',
  level: 1,
  day: 2,
  title: 'Bishop — How the Bishop Moves',
  piece: { name: 'bishop', glyph: '♝', movement: 'diagonal' },
  intro: {
    title: 'Bishop — How the Bishop Moves',
    text: 'The bishop moves diagonally — in all four corner directions. As far as it likes — but it can never jump over another piece!',
  },
  steps: [
    {
      id: 'teach-diagonal-up-right',
      kind: 'teach',
      fen: '6k1/8/5p2/8/3p4/8/1p6/B6K w - - 0 1',
      orientation: 'w',
      solution: ['a1b2', 'b2d4', 'd4f6'],
      prompt: 'Capture all three pawns',
      introText:
        'Your bishop is on a1. Slide it along the diagonal and capture every pawn in its path.',
      successText: 'Nice — keep going!',
      doneText: 'Excellent! The bishop collected all the pawns!',
      hintText:
        'The bishop only moves diagonally — like a slanted line. Try again!',
    },
    {
      id: 'teach-diagonal-up-left',
      kind: 'teach',
      fen: 'k7/8/2p5/8/8/5p2/8/K6B w - - 0 1',
      orientation: 'w',
      solution: ['h1f3', 'f3c6'],
      prompt: 'Now capture along the other diagonal',
      introText:
        'Same bishop, opposite corner. Climb the diagonal from h1 and take both pawns.',
      successText: "That's it!",
      doneText: 'Great! The bishop goes diagonally in every direction!',
      hintText:
        "The bishop can't jump over pieces — capture the closest pawn first!",
    },
    {
      id: 'teach-mixed',
      kind: 'teach',
      fen: 'k7/8/4p3/8/8/1p5p/8/3B3K w - - 0 1',
      orientation: 'w',
      solution: ['d1b3', 'b3e6', 'e6h3'],
      prompt: 'Mix it up — zigzag across the diagonals',
      introText:
        'Three pawns this time, in different directions. Zigzag across the board to collect them all.',
      successText: 'Good one!',
      doneText: 'Bravo — you are a Bishop Master now!',
      hintText: 'Diagonals only. Look for a pawn on one of the four rays.',
    },
    {
      id: 'teach-mate',
      kind: 'teach',
      fen: 'k7/ppK5/8/3B4/8/8/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['d5b7'],
      prompt: "One move — and it's checkmate! Can you find it?",
      introText:
        'The black king is trapped in the corner by its own pawns, with your king cutting off the escape. One bishop move ends the game.',
      doneText:
        "CHECKMATE! 🎉 You've learned how the bishop moves. Great start!",
      hintText: "The king can't breathe in the corner — take the pawn!",
      celebrate: true,
    },
    {
      id: 'puzzle-1',
      kind: 'puzzle',
      fen: '6bk/p6p/1p6/8/3nB3/8/P6P/6BK w - - 0 1',
      orientation: 'w',
      solution: ['g1d4'],
      prompt: 'White to play — mate in 1',
      introText: 'Same idea as before. Look for the diagonal into the knight.',
      doneText: 'Checkmate! One down.',
      hintText: 'Look at both bishops - one of them reaches d4 with mate.',
    },
    {
      id: 'puzzle-2',
      kind: 'puzzle',
      fen: '6k1/6B1/6K1/8/8/7B/8/8 w - - 0 1',
      orientation: 'w',
      solution: ['h3e6'],
      prompt: 'White to play — mate in 1',
      introText: 'Two bishops, one king with nowhere to go.',
      doneText: 'Checkmate! Two down.',
      hintText: 'The king on g8 is boxed in - find the check that ends it.',
    },
    {
      id: 'puzzle-3',
      kind: 'puzzle',
      fen: 'r1bk2r1/2pp4/8/8/1PK5/P6P/1B4P1/4R3 w - - 0 1',
      orientation: 'w',
      solution: ['b2f6'],
      prompt: 'White to play — mate in 1',
      introText: 'The bishop has a long, clear diagonal into the black camp.',
      doneText:
        "Checkmate! That's three puzzles — you mastered the bishop today!",
      hintText: 'Follow the long diagonal all the way to f6.',
      celebrate: true,
    },
  ],
};

export const LESSON_DATABASE: Lesson[] = [DAY_1_ROOK, DAY_2_BISHOP];

export const DEFAULT_LESSON_ID = DAY_1_ROOK.id;

export function findLesson(lessonId: string): Lesson | null {
  return LESSON_DATABASE.find((l) => l.id === lessonId) ?? null;
}

export function findLessonStep(
  lessonId: string,
  stepIndex: number
): LessonStep | null {
  return findLesson(lessonId)?.steps[stepIndex] ?? null;
}
