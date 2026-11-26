import { FreeBoardHistory, pgnToFen } from '@xmatter/util-kit';
import {
  getCheckmateSquares,
  getFenFromPgn,
  getGameDisplayState,
  getTurnFromPgn,
} from './util';

const PGNS = {
  empty: '',
  oneMove: '1. e4',
  enPassant: '1. e4 a6 2. e5 d5 3. exd6',
  knightPromotion: '1. h4 g5 2. hxg5 h5 3. g6 Bh6 4. g7 Nf6 5. g8=N',
  // Opera game - long castle, captures, ends in mate
  opera:
    '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#',
  foolsMate: '1. f3 e5 2. g4 Qh4#',
  checkNotMate: '1. e4 d5 2. Bb5+',
};

describe('PGN cache - same result as parsing without cache', () => {
  test.each(Object.entries(PGNS))('%s', (_, pgn) => {
    const actual = getGameDisplayState({ pgn });

    expect(actual.history).toEqual(FreeBoardHistory.pgnToHistory(pgn));
    expect(actual.fen).toBe(pgnToFen(pgn));
    expect(getFenFromPgn(pgn)).toBe(pgnToFen(pgn));
  });

  test('Alternating PGNs never return a stale result', () => {
    expect(getFenFromPgn(PGNS.opera)).toBe(pgnToFen(PGNS.opera));
    expect(getFenFromPgn(PGNS.oneMove)).toBe(pgnToFen(PGNS.oneMove));
    expect(getFenFromPgn(PGNS.opera)).toBe(pgnToFen(PGNS.opera));
  });

  test('Turn follows a takeback (shorter PGN after a longer one)', () => {
    expect(getTurnFromPgn('1. e4 e5')).toBe('w');
    expect(getTurnFromPgn('1. e4')).toBe('b');
    expect(getTurnFromPgn('')).toBe('w');
  });

  test('Focused index shows the position at that move', () => {
    const actual = getGameDisplayState({
      pgn: PGNS.opera,
      focusedIndex: [0, 0],
    });

    // ovaj put racuna fen preko ChessFENBoard-a (upisuje en passant polje), pa poredimo raspored i potez
    const placementAndTurn = (fen: string) => fen.split(' ').slice(0, 2);
    expect(placementAndTurn(actual.fen)).toEqual(
      placementAndTurn(pgnToFen(PGNS.oneMove))
    );
    expect(actual.lastMove).toMatchObject({ from: 'e2', to: 'e4' });
  });
});

describe('getCheckmateSquares', () => {
  const squaresFor = (pgn: string) => {
    const { fen, lastMove } = getGameDisplayState({ pgn });
    return getCheckmateSquares(fen, lastMove);
  };

  test('White mates (Opera game, Rd8#)', () => {
    expect(squaresFor(PGNS.opera)).toEqual({
      attackerSquare: 'd8',
      kingSquare: 'e8',
    });
  });

  test("Black mates (Fool's mate, Qh4#)", () => {
    expect(squaresFor(PGNS.foolsMate)).toEqual({
      attackerSquare: 'h4',
      kingSquare: 'e1',
    });
  });

  test('Check that is not mate gives nothing', () => {
    expect(squaresFor(PGNS.checkNotMate)).toBeUndefined();
  });

  test('Mate position viewed at an earlier move gives nothing', () => {
    const { fen, lastMove } = getGameDisplayState({
      pgn: PGNS.opera,
      focusedIndex: [0, 0],
    });

    expect(getCheckmateSquares(fen, lastMove)).toBeUndefined();
  });

  test('No last move gives nothing', () => {
    expect(getCheckmateSquares(pgnToFen(PGNS.foolsMate))).toBeUndefined();
  });
});
