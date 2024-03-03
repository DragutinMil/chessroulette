import { ChapterBoardState, ChapterState } from '../movex';
import { useMemo } from 'react';
import { useLearnActivitySettings } from '../hooks/useLearnActivitySettings';
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
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { SquareMap } from 'apps/chessroulette-web/components/Chessboard/types';

type Props = Required<
  Pick<
    ChessboardContainerProps,
    'onMove' | 'onArrowsChange' | 'onCircleDraw' | 'onClearCircles' | 'sizePx'
  >
> &
  // Optionals
  Pick<ChessboardContainerProps, 'rightSideComponent' | 'rightSideClassName'> &
  ChapterBoardState & {
    notation?: ChapterState['notation'];
    onFlip: () => void;
    onClearBoard: () => void;
    onResetBoard: () => void;
    onBoardEditor: () => void;
  };

export const RIGHT_SIDE_SIZE_PX = 32;

export const LearnBoard = ({
  displayFen: fen,
  orientation,
  arrowsMap,
  circlesMap,
  sizePx,
  notation,
  rightSideComponent,
  rightSideClassName,
  onFlip,
  onResetBoard,
  onClearBoard,
  onBoardEditor,
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

  // console.log('board sizePx', sizePx);

  return (
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
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName={`flex flex-col ${rightSideClassName}`}
      rightSideComponent={
        <>
          <div className="flex-1">
            {settings.canFlipBoard && (
              <IconButton
                icon="ArrowsUpDownIcon"
                iconKind="outline"
                type="clear"
                size="sm"
                tooltip="Flip Board"
                tooltipPositon="left"
                className="mb-2"
                onClick={onFlip}
              />
            )}
            {settings.isInstructor && (
              <>
                <IconButton
                  icon="TrashIcon"
                  iconKind="outline"
                  type="clear"
                  size="sm"
                  tooltip="Clear Board"
                  tooltipPositon="left"
                  className="mb-2"
                  onClick={onClearBoard}
                />
                <IconButton
                  icon="ArrowPathIcon"
                  iconKind="outline"
                  type="clear"
                  size="sm"
                  tooltip="Start Position"
                  tooltipPositon="left"
                  className="mb-2"
                  onClick={onResetBoard}
                />
                <IconButton
                  icon="PencilSquareIcon"
                  iconKind="outline"
                  type="clear"
                  size="sm"
                  tooltip="Board Editor"
                  tooltipPositon="left"
                  className="mb-2"
                  onClick={onBoardEditor}
                />
              </>
            )}
          </div>
          {rightSideComponent}
        </>
      }
    />
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
