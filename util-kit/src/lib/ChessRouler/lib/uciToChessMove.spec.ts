import { uciToChessMove } from './misc';

describe('uciToChessMove', () => {
  test('Regular move has no promoteTo', () => {
    expect(uciToChessMove('e2e4', 'w')).toEqual({ from: 'e2', to: 'e4' });
  });

  test('Black knight underpromotion - the "g2g1n" move that crashed the puzzle', () => {
    expect(uciToChessMove('g2g1n', 'b')).toEqual({
      from: 'g2',
      to: 'g1',
      promoteTo: 'n',
    });
  });

  test.each(['q', 'r', 'b', 'n'])(
    'White promotion to "%s" is an uppercase FEN symbol',
    (piece) => {
      expect(uciToChessMove(`e7e8${piece}`, 'w')).toEqual({
        from: 'e7',
        to: 'e8',
        promoteTo: piece.toUpperCase(),
      });
    }
  );

  test.each(['q', 'r', 'b', 'n'])(
    'Black promotion to "%s" is a lowercase FEN symbol',
    (piece) => {
      expect(uciToChessMove(`d2d1${piece}`, 'b')).toEqual({
        from: 'd2',
        to: 'd1',
        promoteTo: piece,
      });
    }
  );

  test('Unknown 5th character is ignored (no invalid promoteTo)', () => {
    expect(uciToChessMove('e7e8k', 'w')).toEqual({ from: 'e7', to: 'e8' });
  });
});
