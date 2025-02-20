import { Chess, Move } from 'chess.js';
import { ChessFEN, ChessMove, ChessPGN, GameOverReason } from './types';
import { DistributivePick } from '../miscType';
import { ChessFENBoard, swapColor } from '../ChessFENBoard';
import { localChessMoveToChessLibraryMove } from './lib';
import { toDictIndexedBy } from '../misc';
import { ChessColor } from './lib/chessColor/types';

type SpecificChessJS = DistributivePick<
  Chess,
  'fen' | 'pgn' | 'move' | 'turn' | 'history' | 'moveNumber'
>;

export class ChessRouler implements SpecificChessJS {
  public chess: Chess = new Chess();

  constructor(
    props?:
      | { pgn: ChessPGN; fen?: undefined }
      | { fen: ChessFEN; pgn?: undefined }
  ) {
    try {
      if (props?.pgn) {
        this.chess.loadPgn(props.pgn);
      }

      if (props?.fen) {
        this.chess.load(props.fen);
      }
    } catch (e) {
      console.error('[ChessRouler] new', e);
    }
  }

  fen = this.chess.fen.bind(this.chess);
  pgn = this.chess.pgn.bind(this.chess);
  turn = this.chess.turn.bind(this.chess);
  history = this.chess.history.bind(this.chess);
  move = this.chess.move.bind(this.chess);
  moveNumber = this.chess.moveNumber.bind(this.chess);

  isValidMove(move: ChessMove) {
    const _instance = new ChessRouler({ pgn: this.pgn() });

    try {
      _instance.move(localChessMoveToChessLibraryMove(move));

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * This is based on the FIDE rule that it is a draw if opponent cannot force mate
   * See this thread: https://www.chess.com/forum/view/general/what-is-considered-insufficient-material#comment-31144738
   *
   * There is distinction between Force Mate and Help Mate, which is the difference between the Fide regulation and the USCIF
   * We're checking for forceMates only here!
   *
   * Note: The case where there are 2 bishops of the same color and a King only, currently returns true, where it should be false!
   *
   * @param color
   * @param fen
   */
  hasSufficientMaterialToForceMate(color: ChessColor) {
    const allPiecesByColor = new ChessFENBoard(this.fen()).getAllPiecesByColor(
      color
    );
     console.log('allPiecesByColor.length',allPiecesByColor.length ,color)
    if (allPiecesByColor.length > 3) {
      return true;
    }
    console.log('provera 2',allPiecesByColor)
    if (allPiecesByColor.indexOf('R')!==-1 ) {
      return true;
    }
    console.log('provera 3',allPiecesByColor)
    if ( allPiecesByColor.indexOf('Q')!==-1 ) {
      return true;
    }
    console.log('provera 4',allPiecesByColor)
    if ( allPiecesByColor.indexOf('P')!==-1 ) {
      return true;
    }
    if (allPiecesByColor.indexOf('r')!==-1 ) {
      return true;
    }
    if ( allPiecesByColor.indexOf('q')!==-1 ) {
      return true;
    }
    if ( allPiecesByColor.indexOf('p')!==-1 ) {
      return true;
    }
    // const indexedPieces = toDictIndexedBy(
    //   new ChessFENBoard(this.fen()).getAllPiecesByColor(color),
    //   (k) => k.toLowerCase()
    // );
    console.log('provera 5',allPiecesByColor)
    
     
    
    if (allPiecesByColor.length === 3) {
      console.log('provera 3')
      // Check for Knight and Bishop
      // if (indexedPieces['b'] && indexedPieces['n']) {
      //   return true;
      // } 
      //  // Check for Knight and rook
      // if (indexedPieces['r'] && indexedPieces['n']) {
      //   return true;
      // }
      //  // Check for Knight and queen
      // if (indexedPieces['q'] && indexedPieces['n']) {
      //   return true;
      // }
      return true
     

      // Otherwise, false with 2 knights  //this is problem, true on one knight
    //  return !indexedPieces['n'];
    }
   
    // if (allPiecesByColor.length === 2) {
    //   // False if one of the pieces besides the king is a knight or bishop
    //   return !(indexedPieces['n'] || indexedPieces['b']);
    // }

    // Otherwise false
    return false;
  }
  
  /**
   * This take sin account "timeouts" and the reasons why a game is completed
   *
   * @param hasTimedOut
   * @returns
   */
  // TODO: Add winner to this as well!
  isGameOver(hasTimedOut: ChessColor | undefined):
    | {
        over: true;
        reason: GameOverReason;
        isDraw: boolean;
        // TODO: Add winner to this as well!
        // winner: ShortChessColor;
      }
    | {
        over: false;
      } {
    if (hasTimedOut) {
      const opponentColor = swapColor(hasTimedOut);
      console.log('jeste Timeout',hasTimedOut)
      console.log('opponentColor',opponentColor)
      console.log('no !',this.hasSufficientMaterialToForceMate(opponentColor))
      console.log('has !',!this.hasSufficientMaterialToForceMate(opponentColor))
      if (this.hasSufficientMaterialToForceMate(opponentColor)==true) {
       

        // According to FIDE, if the player's flag fails (i.e. times out) but the opponent doesn't have sufficient material to force mate
        //  the player is awarded a draw instead of the loss due to timeout!
        // See this for more info: https://www.chess.com/forum/view/general/what-is-considered-insufficient-material#comment-31144738
        return {
          over: true,
          reason: GameOverReason['timeout'],
          isDraw: false,
        };
       
      }else{
        return {
          over: true,
          reason: GameOverReason['drawAwardedForInsufficientMaterial'],
          isDraw: true,
        };
      }

     
    }
  
    if (this.chess.isCheckmate()) {
      return {
        over: true,
        reason: GameOverReason['checkmate'],
        isDraw: this.chess.isDraw(),
      };
    }

    if (this.chess.isDraw()) {
      return {
        over: true,
        reason: GameOverReason['draw'],
        isDraw: true,
      };
    }

    if (this.chess.isInsufficientMaterial()) {
      return {
        over: true,
        reason: GameOverReason['insufficientMaterial'],
        isDraw: this.chess.isDraw(),
      };
    }

    if (this.chess.isStalemate()) {
      return {
        over: true,
        reason: GameOverReason['stalemate'],
        isDraw: this.chess.isDraw(),
      };
    }

    if (this.chess.isThreefoldRepetition()) {
      return {
        over: true,
        reason: GameOverReason['threefoldRepetition'],
        isDraw: this.chess.isDraw(),
      };
    }

    return { over: false };
  }
}
