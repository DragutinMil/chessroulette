import {
  ChapterBoardState,
  ChapterState,
  SquareMap,
} from '../../activity/reducer';
import { useMemo } from 'react';
import { useLearnActivitySettings } from '../useLearnActivitySettings';
import { Freeboard } from 'apps/chessroulette-web/components/Chessboard/Freeboard';
import { Playboard } from 'apps/chessroulette-web/components/Chessboard/Playboard';
import {
  ChessFEN,
  ChessFENBoard,
  FreeBoardHistory,
  getNewChessGame,
  toDictIndexedBy,
} from '@xmatter/util-kit';
import { Square } from 'chess.js';
import { ChessboardContainerProps } from 'apps/chessroulette-web/components/Chessboard/ChessboardContainer';

type Props = Required<
  Pick<
    ChessboardContainerProps,
    'onMove' | 'onArrowsChange' | 'onCircleDraw' | 'onClearCircles' | 'sizePx'
  >
> &
  ChapterBoardState & {
    notation?: ChapterState['notation'];
  };

export const LearnBoard = ({
  startingFen: fen,
  orientation,
  arrowsMap,
  circlesMap,
  sizePx,
  notation,
  ...chessBoardProps
}: Props) => {
  const settings = useLearnActivitySettings();
  const lm =
    notation &&
    FreeBoardHistory.findMoveAtIndex(notation.history, notation.focusedIndex);
  const lastMove = lm?.isNonMove ? undefined : lm;

  // Don't leave this here as it's not optimal
  // TODO: Move this lower level
  const inCheckSquaresMap = useMemo(() => getInCheckSquareMap(fen), [fen]);

  const Board = settings.canMakeInvalidMoves ? Freeboard : Playboard;

  return (
    <>
      <Board
        containerClassName="shadow-2xl"
        boardOrientation={orientation}
        playingColor={orientation}
        sizePx={sizePx}
        fen={fen}
        lastMove={lastMove}
        inCheckSquares={inCheckSquaresMap}
        arrowsMap={arrowsMap}
        circlesMap={circlesMap}
        {...chessBoardProps}
      />
      {/* <div className="flex flex-col pt-0 pb-0">
                        {settings.canFlipBoard && (
                          <IconButton
                            icon="ArrowsUpDownIcon"
                            iconKind="outline"
                            type="clear"
                            size="sm"
                            tooltip="Flip Board"
                            tooltipPositon="right"
                            className="mb-2"
                            onClick={() => {
                              dispatch({
                                type: 'changeBoardOrientation',
                                payload:
                                  activityState.boardOrientation === 'black'
                                    ? 'white'
                                    : 'black',
                              });
                            }}
                          />
                        )}
                      </div> */}
    </>
  );
};

// TODO: This can be doner at the history level
const getInCheckSquareMap = (fen: ChessFEN): SquareMap => {
  let result: Square[] = [];

  const fenBoardInstance = new ChessFENBoard(fen);

  fenBoardInstance.setFenNotation({
    fromState: { turn: 'w', enPassant: undefined },
  });

  const fenAsWhiteTurn = fenBoardInstance.fen;

  fenBoardInstance.setFenNotation({
    fromState: { turn: 'b', enPassant: undefined },
  });

  const fenAsBlackTurn = fenBoardInstance.fen;

  const chessInstanceAsWhite = getNewChessGame({
    fen: fenAsWhiteTurn,
  });

  if (chessInstanceAsWhite.isCheck()) {
    const whiteKingSquare = fenBoardInstance.getKingSquare('w');

    if (whiteKingSquare) {
      result = [whiteKingSquare];
    }
  }

  const chessInstanceAsBlack = getNewChessGame({
    fen: fenAsBlackTurn,
  });

  if (chessInstanceAsBlack.isCheck()) {
    const blackKingSquare = fenBoardInstance.getKingSquare('b');

    if (blackKingSquare) {
      result = [...result, blackKingSquare];
    }
  }

  return toDictIndexedBy(
    result,
    (sq) => sq,
    () => undefined
  ) as SquareMap;
};
