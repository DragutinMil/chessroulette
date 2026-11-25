import { getMaterialAdvantage } from './MaterialAdvantage';

describe('getMaterialAdvantage (counted from the cached FEN)', () => {
  test('Starting position is even', () => {
    expect(getMaterialAdvantage('')).toEqual({
      w: { pieces: [], score: 0 },
      b: { pieces: [], score: 0 },
    });
  });

  test('En passant capture gives White one pawn', () => {
    expect(getMaterialAdvantage('1. e4 a6 2. e5 d5 3. exd6')).toEqual({
      w: { pieces: ['wP'], score: 1 },
      b: { pieces: [], score: -1 },
    });
  });

  test('Knight promotion counts as an extra knight', () => {
    expect(
      getMaterialAdvantage('1. h4 g5 2. hxg5 h5 3. g6 Bh6 4. g7 Nf6 5. g8=N')
    ).toEqual({
      w: { pieces: ['wN'], score: 3 },
      b: { pieces: [], score: -3 },
    });
  });

  test('Promotion with capture - extra queen and rook', () => {
    expect(
      getMaterialAdvantage('1. h4 g5 2. hxg5 h5 3. g6 Bh6 4. g7 Nf6 5. gxh8=Q')
    ).toEqual({
      w: { pieces: ['wQ', 'wR'], score: 14 },
      b: { pieces: [], score: -14 },
    });
  });

  test('Opera game final position (Black up queen and knight, White up two pawns)', () => {
    expect(
      getMaterialAdvantage(
        '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#'
      )
    ).toEqual({
      w: { pieces: ['wP', 'wP'], score: -10 },
      b: { pieces: ['wQ', 'wN'], score: 10 },
    });
  });
});
