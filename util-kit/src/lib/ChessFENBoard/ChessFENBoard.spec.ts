import { ChessFENBoard } from './ChessFENBoard';

const STARTING_BOARD = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

test('starts with starting fen when nothing is given', () => {
  const chessFenBoard = new ChessFENBoard();

  expect(chessFenBoard.fen).toBe(ChessFENBoard.STARTING_FEN);
  expect(chessFenBoard.board).toEqual(STARTING_BOARD);
});

test('starts with given FEN', () => {
  const chessFenBoard = new ChessFENBoard(
    'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
  );

  expect(chessFenBoard.fen).toBe(
    'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
  );

  expect(chessFenBoard.board).toEqual([
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', '', '', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', 'p', '', '', '', ''],
    ['', '', 'p', '', 'P', 'P', '', ''],
    ['', '', 'P', '', '', 'N', 'P', ''],
    ['P', 'P', '', 'P', '', '', '', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', '', 'R'],
  ]);
});

describe('Fen State Notation', () => {
  describe('Turn', () => {
    test('Invalid Turn', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R u KQkq - 0 1' // Notice the invalid 'u' in the 2nd position
        );
      };

      expect(actual).toThrow('InvalidTurnNotation');
    });

    test('White Turn', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w KQkq - 0 1'
      );
    });

    test('Black Turn', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b KQkq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b KQkq - 0 1'
      );
    });
  });

  describe('Castling Rights', () => {
    test('Invalid Castling Rights Notatoin', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w Kskq - 0 1' // Notice the invalid 's' in the 3rd position
        );
      };

      expect(actual).toThrow('InvalidCastlingRightsNotation');
    });

    test('Fails when colors are reversed (black first)', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w kqKQ - 0 1'
        );
      };

      expect(actual).toThrow('InvalidCastlingRightsNotation');
    });

    test('No Castling', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b - - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b - - 0 1'
      );
    });

    test('White King & Black Queen only', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kq - 0 1'
      );
    });

    test('White King, Black King & Queen only', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kkq - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b Kkq - 0 1'
      );
    });

    test('Black King only', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b k - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R b k - 0 1'
      );
    });
  });

  describe('EnPassant', () => {
    test('Fails when enPassant is invalid', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e 0 1' // Notice the invalid 'e' in the 4th position
        );
      };

      expect(actual).toThrow('InvalidEnPassantNotation');
    });

    test('Fails when enPassant Square is invalid', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e9 0 1' // Notice the invalid 'e9' in the 4th position
        );
      };

      expect(actual).toThrow('InvalidEnPassantNotation');
    });

    test('No EnPassant', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      );
    });

    test('No EnPassant', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 1'
      );
    });

    test('EnPassant with Valid Square', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e3 0 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - e3 0 1'
      );
    });
  });

  describe('Half Moves', () => {
    test('Negative Half Moves Count', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - -2 1' // Notice the invalid '-2' in the 5th position
        );
      };

      expect(actual).toThrow('InvalidHalfMovesNotation');
    });

    test('Half Moves as String', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - s 1' // Notice the invalid 's' in the 5th position
        );
      };

      expect(actual).toThrow('InvalidHalfMovesNotation');
    });

    test('Half Moves as Positive Number', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 5 1'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 5 1'
      );
    });
  });

  describe('Full Moves', () => {
    test('Negative Full Moves Count', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 -1' // Notice the invalid '-1' in the 6th position
        );
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });

    test('Zero Full Moves Count (needs to always be positive)', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 0' // Notice the invalid '0' in the 6th position
        );
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });

    test('Full Moves as String', () => {
      const actual = () => {
        new ChessFENBoard(
          'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 s' // Notice the invalid 's' in the 6th position
        );
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });

    test('Full Moves as String', () => {
      const actual = new ChessFENBoard(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 2'
      ).fen;

      expect(actual).toBe(
        'rnbqkbnr/pp2pppp/8/3p4/2p1PP2/2P2NP1/PP1P3P/RNBQKB1R w - - 0 2'
      );
    });
  });
});

describe('put', () => {
  test('adds any piece in any square', () => {
    const chessFenBoard = new ChessFENBoard();

    chessFenBoard.put('a3', 'k');
    chessFenBoard.put('g1', 'q');
    chessFenBoard.put('b4', 'P');
    chessFenBoard.put('c4', 'p');
    chessFenBoard.put('a1', '');

    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/1Pp5/k7/PPPPPPPP/1NBQKBqR w KQkq - 0 1'
    );

    expect(chessFenBoard.board).toEqual([
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', 'P', 'p', '', '', '', '', ''],
      ['k', '', '', '', '', '', '', ''],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['', 'N', 'B', 'Q', 'K', 'B', 'q', 'R'],
    ]);
  });
});

describe('Set Fen Notation', () => {
  describe('From Fen State', () => {
    test('With Valid Props', () => {
      const chessFenBoard = new ChessFENBoard();

      chessFenBoard.setFenNotation({
        fromState: {
          turn: 'b',
          halfMoves: 5,
          fullMoves: 1,
          castlingRights: {
            w: {
              kingSide: false,
            },
          },
        },
      });

      const actual = chessFenBoard.fen;

      expect(actual).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b Qkq - 5 1'
      );
    });

    test('With Invalid Full Moves', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenNotation({
          fromState: {
            turn: 'b',
            halfMoves: 5,
            fullMoves: 0,
            castlingRights: {
              w: {
                kingSide: true,
              },
            },
          },
        });
      };

      expect(actual).toThrow('InvalidFenState:InvalidFullMoves');
    });

    test('With Invalid Half Moves', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenNotation({
          fromState: {
            turn: 'b',
            halfMoves: -1,
            fullMoves: 2,
            castlingRights: {
              w: {
                kingSide: true,
              },
            },
          },
        });
      };

      expect(actual).toThrow('InvalidFenState:InvalidHalfMoves');
    });
  });

  describe('From Fen Notation', () => {
    test('With Valid Notation', () => {
      const chessFenBoard = new ChessFENBoard();

      chessFenBoard.setFenNotation({
        fromNotation: 'b Kq e3 0 1',
      });

      const actual = chessFenBoard.fen;

      expect(actual).toBe(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b Kq e3 0 1'
      );
    });

    test('With Invalid Turn', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenNotation({
          fromNotation: '- Kq e3 0 1',
        });
      };

      expect(actual).toThrow('InvalidTurnNotation');
    });

    test('With Invalid Full Moves', () => {
      const chessFenBoard = new ChessFENBoard();

      const actual = () => {
        chessFenBoard.setFenNotation({
          fromNotation: 'w Kq e3 0 0',
        });
      };

      expect(actual).toThrow('InvalidFullMovesNotation');
    });
  });
});

describe('move', () => {
  test('moves any existent piece to any square', () => {
    const chessFenBoard = new ChessFENBoard();

    chessFenBoard.move('a2', 'a5');
    chessFenBoard.move('h1', 'c4');
    chessFenBoard.move('e8', 'd1');

    expect(chessFenBoard.fen).toBe(
      'rnbq1bnr/pppppppp/8/P7/2R5/8/1PPPPPPP/RNBkKBN1 w KQkq - 0 2'
    );

    expect(chessFenBoard.board).toEqual([
      ['r', 'n', 'b', 'q', '', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      ['', '', '', '', '', '', '', ''],
      ['P', '', '', '', '', '', '', ''],
      ['', '', 'R', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'k', 'K', 'B', 'N', ''],
    ]);
  });

  test('throws when attempting to move an inexistent piece', () => {
    const chessFenBoard = new ChessFENBoard(
      'rnbq1bnr/pppppppp/8/P7/2R5/8/1PPPPPPP/RNBkKBN1 w - - 0 1'
    );

    const actual = () => {
      chessFenBoard.move('a2', 'a3');
    };

    expect(actual).toThrow('Move Error: the from square (a2) was empty!');
  });

  test('throws when attempting to move an inexistent piece', () => {
    const chessFenBoard = new ChessFENBoard(
      'rnbq1bnr/pppppppp/8/P7/2R5/8/1PPPPPPP/RNBkKBN1 w - - 0 1'
    );

    const actual = () => {
      chessFenBoard.move('a2', 'a3');
    };

    expect(actual).toThrow('Move Error: the from square (a2) was empty!');
  });

  test('moves with promotion', () => {
    const chessFenBoard = new ChessFENBoard();

    chessFenBoard.move('a2', 'a8', 'Q');

    const actual = chessFenBoard.fen;

    expect(actual).toBe(
      'Qnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1'
    );
  });

  test('full moves get counted correctly', () => {
    const chessFenBoard = new ChessFENBoard();

    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    );

    chessFenBoard.move('e2', 'e4');

    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
    );

    chessFenBoard.move('d7', 'd6');

    // Increments Full Move
    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/ppp1pppp/3p4/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
    );

    chessFenBoard.move('d1', 'g4');

    // Increments Full Move & Half Move b/c it's not a pawn move
    expect(chessFenBoard.fen).toBe(
      'rnbqkbnr/ppp1pppp/3p4/8/4P1Q1/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2'
    );

    chessFenBoard.move('g8', 'f6');

    // Increments Full Move & Half Move b/c it's not a pawn move
    expect(chessFenBoard.fen).toBe(
      'rnbqkb1r/ppp1pppp/3p1n2/8/4P1Q1/8/PPPP1PPP/RNB1KBNR w KQkq - 2 3'
    );

    chessFenBoard.move('a2', 'a3');

    // Resets Half Move b/c it's a pawn move, and does not increment Full Move b/c it's not black
    expect(chessFenBoard.fen).toBe(
      'rnbqkb1r/ppp1pppp/3p1n2/8/4P1Q1/P7/1PPP1PPP/RNB1KBNR b KQkq - 0 3'
    );

    chessFenBoard.move('c8', 'g4');

    // Increments Full Move & Half Move b/c it's not a pawn move
    expect(chessFenBoard.fen).toBe(
      'rn1qkb1r/ppp1pppp/3p1n2/8/4P1b1/P7/1PPP1PPP/RNB1KBNR w KQkq - 0 4'
    );

    // More moves
    chessFenBoard.move('f1', 'c4');
    chessFenBoard.move('b8', 'c6');
    chessFenBoard.move('g1', 'f3');
    chessFenBoard.move('d8', 'd7');

    expect(chessFenBoard.fen).toBe(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB1K2R w KQkq - 4 6'
    );

    // Castle Move
    chessFenBoard.move('e1', 'g1');
    expect(chessFenBoard.fen).toBe(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB2RK1 b kq - 5 6'
    );
  });
});

describe('Castling Move', () => {
  test('castling for white on king side', () => {
    const chessFenBoard = new ChessFENBoard(
      'rnbqkb1r/5ppp/p2ppn2/1p6/3NP3/1BN5/PPP2PPP/R1BQK2R w KQkq - 0 1'
    );

    const actualMove = chessFenBoard.move('e1', 'g1');
    const actualFen = chessFenBoard.fen;

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'w',
      from: 'e1',
      to: 'g1',
      piece: 'k',
      san: '0-0',
    });
    expect(actualFen).toBe(
      'rnbqkb1r/5ppp/p2ppn2/1p6/3NP3/1BN5/PPP2PPP/R1BQ1RK1 b kq - 1 1'
    );
  });

  test('castling for white on queen side', () => {
    const chessFenBoard = new ChessFENBoard(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R w KQkq - 10 6'
    );

    const actualMove = chessFenBoard.move('e1', 'c1');

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'w',
      from: 'e1',
      to: 'c1',
      piece: 'k',
      san: '0-0-0',
    });

    const actualFen = chessFenBoard.fen;
    expect(actualFen).toBe(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/2KR3R b kq - 11 6'
    );
  });

  test('castling for black on king side', () => {
    const chessFenBoard = new ChessFENBoard(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R b KQkq - 10 6'
    );

    const actualMove = chessFenBoard.move('e8', 'g8');

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'b',
      from: 'e8',
      to: 'g8',
      piece: 'k',
      san: '0-0',
    });

    const actualFen = chessFenBoard.fen;
    expect(actualFen).toBe(
      'r4rk1/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R w KQ - 11 7'
    );
  });

  test('castling for black on queen side', () => {
    const chessFenBoard = new ChessFENBoard(
      'r3k2r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R b KQkq - 10 6'
    );

    const actualMove = chessFenBoard.move('e8', 'c8');

    expect(actualMove).toEqual({
      captured: undefined,
      color: 'b',
      from: 'e8',
      to: 'c8',
      piece: 'k',
      san: '0-0-0',
    });

    const actualFen = chessFenBoard.fen;
    expect(actualFen).toBe(
      '2kr3r/pppppppp/1nbq1bn1/8/8/1NBQ1BN1/PPPPPPPP/R3K2R w KQ - 11 7'
    );
  });

  describe('en passant', () => {
    test('fen adds the en passant notation when pawn moves 2 squares | white', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      );

      chessFenBoard.move('e2', 'e4');

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );
    });

    test('fen adds the en passant notation when pawn moves 2 squares | black', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      chessFenBoard.move('d7', 'd5');

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2'
      );
    });

    test('fen removes the en passant notation when any other move', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      chessFenBoard.move('d2', 'd3');

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/3P4/PPP2PPP/RNBQKBNR b KQkq - 0 1'
      );
    });

    test('does not add en passant when pawn moves on different ranks', () => {
      const chessFenBoard = new ChessFENBoard(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'
      );

      chessFenBoard.move('d2', 'e4');

      const actualFen = chessFenBoard.fen;

      expect(actualFen).toBe(
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPP2PPP/RNBQKBNR b KQkq - 0 1'
      );
    });

    describe('En Passant capturers', () => {
      test('takes the moved white pawn on e6', () => {
        const chessFenBoard = new ChessFENBoard(
          'rnbqkbnr/pppp1ppp/8/4pP2/8/8/PPPPP1PP/RNBQKBNR w KQkq e6 0 2'
        );

        const actualMove = chessFenBoard.move('f5', 'e6');
        const actualFen = chessFenBoard.fen;

        expect(actualMove).toEqual({
          captured: 'bP',
          color: 'w',
          from: 'f5',
          piece: 'p',
          san: 'fxe6',
          to: 'e6',
        });
        expect(actualFen).toBe(
          'rnbqkbnr/pppp1ppp/4P3/8/8/8/PPPPP1PP/RNBQKBNR b KQkq - 0 2'
        );
      });

      test('takes the moved white pawn on e3', () => {
        const chessFenBoard = new ChessFENBoard(
          'rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 2'
        );

        const actualMove = chessFenBoard.move('d4', 'e3');
        const actualFen = chessFenBoard.fen;

        expect(actualMove).toEqual({
          captured: 'wP',
          color: 'b',
          from: 'd4',
          piece: 'p',
          san: 'dxe3',
          to: 'e3',
        });
        expect(actualFen).toBe(
          'rnbqkbnr/ppp1pppp/8/8/8/4p3/PPPP1PPP/RNBQKBNR w KQkq - 0 3'
        );
      });
    });
  });
});

describe('piece', () => {
  const chessFenBoard = new ChessFENBoard();

  const actualWhiteBishop = chessFenBoard.piece('c1');
  expect(actualWhiteBishop).toBe('B');

  const actualWhitePawn = chessFenBoard.piece('a2');
  expect(actualWhitePawn).toBe('P');

  const actualBlackKing = chessFenBoard.piece('e8');
  expect(actualBlackKing).toBe('k');
});

describe('Validate FEN', () => {
  test('passes with correct fen', () => {
    const actual = ChessFENBoard.validateFenString(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB2RK1 b kq - 5 6'
    );

    expect(actual.ok).toBe(true);
  });

  test('passes with correct fen', () => {
    const actual = ChessFENBoard.validateFenString(
      'r3kb1r/pppqpppp/2np1n2/8/2B1P1b1/P4N2/1PPP1PPP/RNB2RK1 b kq - 5 4'
    );

    expect(actual.ok).toBe(true);
  });

  test('fails with incorrect fen state', () => {
    const actual = ChessFENBoard.validateFenString(
      'r3kb1r/pppqpppp/2np1n2/8/2 b kqs - 5 6'
    );

    expect(actual.ok).toBe(false);
  });

  test('fails with incorrect fen position notation', () => {
    const actual = ChessFENBoard.validateFenString('  b kq - 5 6');

    expect(actual.ok).toBe(false);
  });

  test('fails with incorrect fen position notation', () => {
    const actual = ChessFENBoard.validateFenString('asdasda  b kq - 5 6');

    expect(actual.ok).toBe(false);
  });
});
