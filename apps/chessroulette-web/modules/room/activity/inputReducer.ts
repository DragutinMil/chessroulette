import { Action } from 'movex-core-util';
import { ChapterState } from './reducer';
import {
  ChessFEN,
  ChessFENBoard,
  ChessMove,
  FenBoardPromotionalPieceSymbol,
  pieceSanToFenBoardPieceSymbol,
} from '@xmatter/util-kit';

export type InputState =
  | {
      // this means the instructor creates or edits chapters atm
      isActive: true;
      isBoardEditorShown: boolean;
      chapterState: ChapterState; // Create or Update Chapter but it will come here!
    }
  | {
      isActive: false;
      isBoardEditorShown?: false;
      chapterState: undefined;
    };

type InputAction =
  | Action<
      'activate',
      {
        isBoardEditorShown?: boolean;
        chapterState: ChapterState; // Create or Update Chapter but it will come here!
      }
    >
  | Action<'deactivate'>
  | Action<'move', { move: ChessMove }>
  | Action<'updateFen', { fen: ChessFEN }>
  // TODO This maybe is too generericzx
  | Action<
      'update',
      Partial<{
        chapterState: ChapterState;
        isBoardEditorShown?: boolean;
      }>
    >;

export const initialInputState: InputState = {
  isActive: false,
  chapterState: undefined,
  isBoardEditorShown: false,
};

export default (
  prev: InputState = initialInputState,
  action: InputAction
): InputState => {
  if (action.type === 'activate') {
    return {
      isActive: true,
      isBoardEditorShown: !!action.payload.isBoardEditorShown,
      chapterState: action.payload.chapterState,
    };
  }

  if (action.type === 'deactivate') {
    return {
      isActive: false,
      chapterState: undefined,
    };
  }

  if (action.type === 'move') {
    if (!prev.isActive) {
      return prev;
    }

    const { move } = action.payload;

    const instance = new ChessFENBoard(prev.chapterState.displayFen);
    const fenPiece = instance.piece(move.from);
    if (!fenPiece) {
      console.error('Err', instance.board);
      throw new Error(`No Piece at ${move.from}`);
    }

    const promoteToFenBoardPiecesymbol:
      | FenBoardPromotionalPieceSymbol
      | undefined = move.promoteTo
      ? (pieceSanToFenBoardPieceSymbol(
          move.promoteTo
        ) as FenBoardPromotionalPieceSymbol)
      : undefined;

    instance.move(move.from, move.to, promoteToFenBoardPiecesymbol);

    const nextFen = instance.fen;

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      displayFen: nextFen,
      notation: {
        ...prev.chapterState.notation,
        startingFen: nextFen,
      },
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }

  if (action.type === 'updateFen') {
    if (!prev.isActive) {
      return prev;
    }

    const nextFen = action.payload.fen;

    const nextChapterState: ChapterState = {
      ...prev.chapterState,
      displayFen: nextFen,
      notation: {
        ...prev.chapterState.notation,
        startingFen: nextFen,
      },
    };

    return {
      ...prev,
      chapterState: nextChapterState,
    };
  }

  if (action.type === 'update') {
    // TODO: Maybe this is too generic but it's ok for now
    if (!prev.isActive) {
      return prev;
    }

    return {
      ...prev,
      ...action.payload,
    };
  }

  return prev;
};
