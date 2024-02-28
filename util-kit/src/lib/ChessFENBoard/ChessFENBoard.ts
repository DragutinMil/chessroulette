import { deepmerge } from 'deepmerge-ts';
import { getNewChessGame, isShortChessColor, toShortColor } from '../Chess/lib';
import {
  ChessFEN,
  ChessFENStateNotation,
  DetailedChessMove,
} from '../Chess/types';
import { invoke, isOneOf } from '../misc';
import {
  FENBoard,
  FenBoardPieceSymbol,
  FenBoardPromotionalPieceSymbol,
  emptyBoard,
  fenBoardPieceSymbolToDetailedChessPiece,
  fenBoardPieceSymbolToPieceSymbol,
  getFileRank,
  matrixIndexToSquare,
  swapColor,
} from './chessUtils';
import { SQUARES, type Color, type PieceSymbol, type Square } from 'chess.js';
import { Err, Ok, Result } from 'ts-results';
import { DeepPartial } from '../miscType';
import { matrixFind } from '../matrix';

export type FenState = {
  turn: Color;
  castlingRights: {
    w: { kingSide: boolean; queenSide: boolean };
    b: { kingSide: boolean; queenSide: boolean };
  };
  enPassant: Square | undefined;
  halfMoves: number;
  fullMoves: number;
};

export class ChessFENBoard {
  static STARTING_FEN: ChessFEN =
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  static ONLY_KINGS_FEN: ChessFEN = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
  // '8/8/8/8/8/8/8/8 w - - 0 1'; // TODO: Add ability to have an empty baord

  // This is a get because it's meant to be readonly
  static get STARTING_FEN_STATE(): FenState {
    return {
      turn: 'w',
      castlingRights: {
        w: { kingSide: true, queenSide: true },
        b: { kingSide: true, queenSide: true },
      },
      enPassant: undefined,
      halfMoves: 0,
      fullMoves: 1, // This always needs to be bigger than 0
    };
  }

  private _state: {
    board: FENBoard;
    fen: ChessFEN;
    fenState: FenState;
  } = {
    board: ChessFENBoard.calculateBoard(ChessFENBoard.STARTING_FEN),
    fen: ChessFENBoard.STARTING_FEN,
    fenState: ChessFENBoard.STARTING_FEN_STATE,
  };

  constructor(fen?: ChessFEN) {
    if (fen) {
      this.loadFen(fen);
    }
  }

  /**
   * Gets the piece at a square
   *
   * @param {string} square - The square. Eg: "a2"
   * @return {string} piece - the ascii representation of a piece. Eg: "K"
   */
  piece(square: Square) {
    const [file, rank] = getFileRank(square);
    return ChessFENBoard.getPiece(this._state.board, file, rank);
  }

  /**
   * Places a piece in the given square.
   *
   * @param {string} square - The square. Eg: "a2"
   * @param {string} piece - the ascii representation of a piece. Eg: "K"
   */
  put(square: Square, piece: FenBoardPieceSymbol | '') {
    const [file, rank] = getFileRank(square);

    // TODO: Add it back This needs to recalcualte the fen as well
    const nextBoard = ChessFENBoard.setPieceInBoard(
      this.board,
      file,
      rank,
      piece
    );

    const next = ChessFENBoard.calculateFen(nextBoard, this._state.fenState);

    // TODO: Can Optimize to not calc fen all the time
    this._state = {
      board: nextBoard,
      fen: next.fen,
      fenState: next.fenState,
    };
  }

  /**
   * Removes the piece at the given square.
   *
   * @param {string} square - The square. Eg: "a2"
   */
  clear(square: Square) {
    // TODO: Add it back This needs to recalcualte the fen as well
    this.put(square, '');
  }

  /**
   * Moves a piece.
   *
   * @param {string} from - The square to move from. Eg: "a2"
   * @param {string} to - The square to move to. Eg: "a3"
   */
  move(
    from: Square,
    to: Square,
    promoteTo?: FenBoardPromotionalPieceSymbol
  ): DetailedChessMove {
    const piece = promoteTo || this.piece(from);

    if (!piece) {
      throw new Error(`Move Error: the from square (${from}) was empty!`);
    }

    const castlingMove = this.isCastlingMove({ from, to, piece });
    const enPassant = this.isEnPassantMove({ from, to, piece });

    const capturedPieceViaEnPassant = this.getCapturedPieceViaEnPassant({
      from,
      to,
      piece,
    });

    if (capturedPieceViaEnPassant) {
      // Remove the captured pawn
      this.clear(capturedPieceViaEnPassant.square);
    }

    const targetPiece = this.piece(to) || capturedPieceViaEnPassant?.piece;
    const captured: PieceSymbol | undefined = targetPiece
      ? fenBoardPieceSymbolToPieceSymbol(targetPiece)
      : undefined;

    // TODO: here the fen gets recalculate 2 times (one for put one for clear)
    this.put(to, piece);
    this.clear(from);

    // Check for castling
    if (castlingMove) {
      const rookPiece = this.piece(castlingMove.rookFrom);
      // Move the rook as well
      this.put(castlingMove.rookTo, rookPiece);
      this.clear(castlingMove.rookFrom);
    }

    const detailedPiece = fenBoardPieceSymbolToDetailedChessPiece(piece);

    const sanPiece =
      detailedPiece.type === 'p'
        ? ''
        : detailedPiece.type.toLocaleUpperCase();
    const sanCaptured = invoke(() => {
      if (!captured) {
        return '';
      }

      if (detailedPiece.type === 'p') {
        return `${from[0]}x`;
      }

      return 'x';
    });

    const san = invoke(() => {
      if (castlingMove) {
        return castlingMove.side === 'k' ? '0-0' : '0-0-0';
      }

      return `${sanPiece}${sanCaptured}${to}`;
    });
    const prevFenState = this._state.fenState;

    // Refresh the Fen State
    this.setFenNotation({
      fromState: {
        // turn: prevFenState.turn === 'b' ? 'w' : 'b',
        turn: toShortColor(swapColor(detailedPiece.color)),

        ...(castlingMove && {
          // Remove the castling rights if applied this move
          castlingRights: {
            [detailedPiece.color]: {
              kingSide: false,
              queenSide: false,
            },
          },
        }),

        enPassant,

        /**
         * Half Moves reset when there is a capture or a pawn advance otherwise they increment
         *
         * See this https://www.chess.com/terms/fen-chess#halfmove-clock
         */
        halfMoves:
          captured || detailedPiece.type === 'p'
            ? 0
            : prevFenState.halfMoves + 1,

        /**
         * Full Moves increment when there is a black move (complete turn)
         *
         * See this https://www.chess.com/terms/fen-chess#fullmove-number
         */
        fullMoves:
          prevFenState.fullMoves + (detailedPiece.color === 'b' ? 1 : 0),
      },
    });

    return {
      color: detailedPiece.color,
      piece: detailedPiece.type,
      captured,
      san,
      to,
      from,
    };
  }

  private isCastlingMove({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }): null | { rookFrom: Square; rookTo: Square; side: 'q' | 'k' } {
    if (!isOneOf(piece, ['K', 'k'])) {
      return null;
    }

    // white
    if (piece === 'K') {
      if (!isOneOf(to, ['g1', 'c1'])) {
        return null;
      }

      // If King side
      if (to === 'g1') {
        if (!this._state.fenState.castlingRights.w.kingSide) {
          return null;
        }

        // If there are piece at f1 or g1 fail
        if (this.piece('f1') || this.piece('g1')) {
          return null;
        }

        if (this.piece('h1') !== 'R') {
          return null;
        }

        return { rookFrom: 'h1', rookTo: 'f1', side: 'k' };
      }

      // If Queen side
      else if (to === 'c1') {
        if (!this._state.fenState.castlingRights.w.queenSide) {
          return null;
        }

        if (this.piece('d1') || this.piece('c1')) {
          return null;
        }

        if (this.piece('a1') !== 'R') {
          return null;
        }

        return { rookFrom: 'a1', rookTo: 'd1', side: 'q' };
      }
    }

    // black
    if (piece === 'k') {
      if (!isOneOf(to, ['g8', 'c8'])) {
        return null;
      }

      // If King side
      if (to === 'g8') {
        if (!this._state.fenState.castlingRights.b.kingSide) {
          return null;
        }

        // If there are piece at f1 or g1 fail
        if (this.piece('f8') || this.piece('g8')) {
          return null;
        }

        if (this.piece('h8') !== 'r') {
          return null;
        }

        return { rookFrom: 'h8', rookTo: 'f8', side: 'k' };
      }

      // If Queen side
      else if (to === 'c8') {
        if (!this._state.fenState.castlingRights.b.queenSide) {
          return null;
        }

        if (this.piece('d8') || this.piece('c8')) {
          return null;
        }

        if (this.piece('a8') !== 'r') {
          return null;
        }

        return { rookFrom: 'a8', rookTo: 'd8', side: 'q' };
      }
    }

    return null;
  }

  private isEnPassantMove({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }): Square | undefined {
    if (isOneOf(piece, ['P', 'p'])) {
      const [fileFrom, rankFrom] = from;
      const [fileTo, rankTo] = to;

      if (fileFrom === fileTo) {
        // White
        if (rankFrom === '2' && rankTo === '4') {
          return `${fileFrom}3` as Square;
        }

        // Black
        if (rankFrom === '7' && rankTo === '5') {
          return `${fileFrom}6` as Square;
        }
      }
    }

    return undefined;
  }

  private getCapturedPieceViaEnPassant({
    from,
    to,
    piece,
  }: {
    from: Square;
    to: Square;
    piece: FenBoardPieceSymbol;
  }): { piece: FenBoardPieceSymbol; square: Square } | undefined {
    if (
      this._state.fenState.enPassant &&
      to === this._state.fenState.enPassant && // the fen State enPassant is exactly the to square
      isOneOf(piece, ['p', 'P']) && // the captureer is a pawn
      isOneOf(from[1], ['4', '5']) // the capturer is on the same rank as the captured
    ) {
      const targetRank = to[1] === '3' ? Number(to[1]) + 1 : Number(to[1]) - 1;

      const targetSquare = `${to[0]}${targetRank}` as Square;
      const targetPiece = this.piece(targetSquare);

      if (targetPiece) {
        return {
          piece: targetPiece,
          square: targetSquare,
        };
      }
    }

    return undefined;
  }

  /**
   * Set the current position.
   *
   * @param {string} fen - a position string as FEN
   */
  loadFen(fen: ChessFEN) {
    // TODO: Validate FEN

    if (this._state.fen === fen) {
      // They are the same
      return;
    }

    const nextBoard = ChessFENBoard.calculateBoard(fen);

    // const fenStateNotation = ;

    const nextFenStateResult = ChessFENBoard.extractFenStateNotation(
      fen
    ).andThen(ChessFENBoard.fenNotationToFenState);

    // Throw for now
    if (nextFenStateResult.err) {
      throw nextFenStateResult.val;
    }

    const nextFen = ChessFENBoard.calculateFen(
      nextBoard,
      nextFenStateResult.val
    );

    this._state = {
      board: nextBoard,
      fen: nextFen.fen,
      fenState: nextFen.fenState,
    };
  }

  setFenNotation(
    p:
      | { fromState: DeepPartial<FenState>; fromNotation?: undefined }
      | { fromState?: undefined; fromNotation: string }
  ) {
    const prevFen = this.fen;
    const prevFenWithoutNotation =
      ChessFENBoard.extractFenPositionNotation(prevFen);

    const prevFenState = this._state.fenState;

    if (p.fromState) {
      const nextFenState = deepmerge(prevFenState, p.fromState) as FenState;

      const isValidFenStateResult =
        ChessFENBoard.validateFenState(nextFenState);

      if (isValidFenStateResult.err) {
        throw isValidFenStateResult.val;
      }

      const nextFenNotation = ChessFENBoard.fenStateToFenNotation(nextFenState);

      this._state = {
        ...this._state,
        fen: `${prevFenWithoutNotation} ${nextFenNotation}`,
        fenState: nextFenState,
      };
    } else if (p.fromNotation) {
      const nextFenNotation = p.fromNotation;
      const nextFenStateResult =
        ChessFENBoard.fenNotationToFenState(nextFenNotation);

      if (!nextFenStateResult.ok) {
        throw nextFenStateResult.val;
      }

      this._state = {
        ...this._state,
        fen: `${prevFenWithoutNotation} ${nextFenNotation}`,
        fenState: nextFenStateResult.val,
      };
    }
  }

  getFenStateNotation() {
    return ChessFENBoard.extractFenStateNotation(this.fen);
  }

  getFenPositionNotation() {
    return ChessFENBoard.extractFenPositionNotation(this.fen);
  }

  getFenState() {
    return this._state.fenState;
  }

  private static calculateBoard(fromFen: ChessFEN): FENBoard {
    const nextBoard = emptyBoard();

    // TODO: Can optimize a little if fen is starting fen just return the empty board

    let rank = 0;
    let file = 0;
    let fenIndex = 0;

    let fenChar;
    let count;

    while (fenIndex < fromFen.length) {
      fenChar = fromFen[fenIndex];

      if (fenChar === ' ') {
        break; // ignore the rest
      }
      if (fenChar === '/') {
        rank++;
        file = 0;
        fenIndex++;
        continue;
      }

      if (isNaN(parseInt(fenChar, 10))) {
        ChessFENBoard.setPieceInBoard(
          nextBoard,
          file,
          rank,
          fenChar as FenBoardPieceSymbol
        );
        file++;
      } else {
        count = parseInt(fenChar, 10);
        for (let i = 0; i < count; i++) {
          ChessFENBoard.setPieceInBoard(nextBoard, file, rank, '');
          file++;
        }
      }

      fenIndex++;
    }

    return nextBoard;
  }

  /**
   * This is the fenState -> "w KQkq - 0 1"
   *
   * @param fenNotation
   * @returns
   */
  private static fenNotationToFenState = (
    fenNotation: string
  ): Result<FenState, unknown> => {
    const [turn, castlingRights, enPassant, halfMoves, fullMoves] = fenNotation
      .trim()
      .split(' ');

    let state: FenState = ChessFENBoard.STARTING_FEN_STATE;

    if (turn && isShortChessColor(turn)) {
      state = {
        ...state,
        turn,
      };
    } else {
      return new Err('InvalidTurnNotation');
    }

    // KQkq | Kk | Qq | Kq | kQ | -
    if (
      isOneOf(castlingRights, [
        'KQkq',
        'KQk',
        'KQq',
        'Kkq',
        'Qkq',
        'Kk',
        'Kq',
        'Qq',
        'Qk',
        'KQ',
        'kq',
        'K',
        'Q',
        'k',
        'q',
        '-',
      ])
    ) {
      if (castlingRights !== '-') {
        state = {
          ...state,
          castlingRights: {
            w: {
              kingSide: castlingRights.indexOf('K') > -1,
              queenSide: castlingRights.indexOf('Q') > -1,
            },
            b: {
              kingSide: castlingRights.indexOf('k') > -1,
              queenSide: castlingRights.indexOf('q') > -1,
            },
          },
        };
      } else {
        state = {
          ...state,
          castlingRights: {
            w: {
              kingSide: false,
              queenSide: false,
            },
            b: {
              kingSide: false,
              queenSide: false,
            },
          },
        };
      }
    } else {
      return new Err('InvalidCastlingRightsNotation');
    }

    if (enPassant && isOneOf(enPassant, [...SQUARES, '-'])) {
      state = {
        ...state,
        enPassant: enPassant === '-' ? undefined : (enPassant as Square),
      };
    } else {
      return new Err('InvalidEnPassantNotation');
    }

    if (Number(halfMoves) > -1) {
      state = {
        ...state,
        halfMoves: Number(halfMoves),
      };
    } else {
      return new Err('InvalidHalfMovesNotation');
    }

    if (Number(fullMoves) > 0) {
      state = {
        ...state,
        fullMoves: Number(fullMoves),
      };
    } else {
      return new Err('InvalidFullMovesNotation');
    }

    return new Ok(state);
  };

  private static validateFenState(s: FenState) {
    if (s.fullMoves < 1) {
      return new Err('InvalidFenState:InvalidFullMoves');
    }

    if (s.halfMoves < 0) {
      return new Err('InvalidFenState:InvalidHalfMoves');
    }

    return new Ok(s as FenState);
  }

  static validateFenStateNotation(str: string) {
    return ChessFENBoard.fenNotationToFenState(str).map(
      () => str as ChessFENStateNotation
    );
  }

  static validateFenString(str: string) {
    const slots = str.split(' ');

    if (slots.length !== 6) {
      return new Err('InvalidState:InvalidNumberOfSlots');
    }

    try {
      getNewChessGame().load(str);

      return new Ok(str as ChessFEN);
    } catch (e) {
      console.log('eeee', e);

      return new Err(e);
    }
  }

  private static fenStateToFenNotation(fenState: FenState) {
    const {
      turn,
      castlingRights: cr,
      enPassant,
      halfMoves,
      fullMoves,
    } = fenState;

    const castlingRightsNotation = `${cr.w.kingSide ? 'K' : ''}${
      cr.w.queenSide ? 'Q' : ''
    }${cr.b.kingSide ? 'k' : ''}${cr.b.queenSide ? 'q' : ''}`;

    return `${turn} ${castlingRightsNotation || '-'} ${
      enPassant || '-'
    } ${halfMoves} ${fullMoves}`;
  }

  private static calculateFen(
    fromBoard: FENBoard,
    fenState: FenState
  ): {
    fen: ChessFEN;
    fenState: FenState;
    fenStateNotation: string;
  } {
    const nextFen = [];
    for (let i = 0; i < 8; i++) {
      let empty = 0;
      for (let j = 0; j < 8; j++) {
        const piece = ChessFENBoard.getPiece(fromBoard, j, i);
        if (piece) {
          if (empty > 0) {
            nextFen.push(empty);
            empty = 0;
          }
          nextFen.push(piece);
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        nextFen.push(empty);
      }
      nextFen.push('/');
    }
    nextFen.pop();

    const isValidFenStateResult = ChessFENBoard.validateFenState(fenState);

    if (isValidFenStateResult.err) {
      throw isValidFenStateResult.val;
    }

    const nextFenNotation = ChessFENBoard.fenStateToFenNotation(fenState);

    return {
      fen: nextFen.join('') + ` ${nextFenNotation}`,
      fenState: fenState,
      fenStateNotation: nextFenNotation,
    };
  }

  loadBoard(fenBoard: FENBoard) {
    //
  }

  get board() {
    return this._state.board;
  }

  get fen() {
    return this._state.fen;
  }

  getKingSquare(color: Color) {
    const kingSymbol = color === 'b' ? 'k' : 'K';

    let square: Square | undefined = undefined;

    matrixFind(this.board, (p, index) => {
      if (p === kingSymbol) {
        square = matrixIndexToSquare(index);
        return true;
      }

      return false;
    });

    return square;
  }

  static extractFenStateNotation = (fen: ChessFEN) => {
    const notation = fen.slice(fen.indexOf(' ')).trim();

    if (!notation) {
      return new Err('InvalidFen:AbsentNotation'); // TODO: Add a FEN Validator that will throw this error automatically
    }

    return ChessFENBoard.validateFenStateNotation(notation);
  };

  static extractFenPositionNotation = (fen: ChessFEN) => {
    return fen.slice(0, fen.indexOf(' ')).trim();
  };

  private static setPieceInBoard = (
    board: FENBoard,
    file: number,
    rank: number,
    fenChar: FenBoardPieceSymbol | ''
  ) => {
    board[rank][file] = fenChar;

    return board;
  };

  private static getPiece = (board: FENBoard, file: number, rank: number) => {
    return board[rank][file];
  };
}
