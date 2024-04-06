import { ChapterBoardState, ChapterState } from '../movex';
import { useLearnActivitySettings } from '../hooks/useLearnActivitySettings';
import { Freeboard, Playboard } from 'apps/chessroulette-web/components/Boards';
import { FreeBoardHistory } from '@xmatter/util-kit';
import {
  BoardEditorIconButton,
  ClearBoardIconButton,
  FlipBoardIconButton,
  StartPositionIconButton,
  ChessboardContainerProps,
} from 'apps/chessroulette-web/components/Chessboard';

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

  const Board = settings.canMakeInvalidMoves ? Freeboard : Playboard;

  return (
    <Board
      containerClassName="shadow-2xl"
      boardOrientation={orientation}
      sizePx={sizePx}
      fen={fen}
      lastMove={lastMove}
      arrowsMap={arrowsMap}
      circlesMap={circlesMap}
      {...chessBoardProps}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName={`flex flex-col ${rightSideClassName}`}
      rightSideComponent={
        <>
          <div className="flex-1">
            {settings.canFlipBoard && (
              <FlipBoardIconButton className="mb-2" onClick={onFlip} />
            )}
            {settings.isInstructor && (
              <>
                <StartPositionIconButton
                  className="mb-2"
                  onClick={onResetBoard}
                />
                <ClearBoardIconButton className="mb-2" onClick={onClearBoard} />
                <BoardEditorIconButton
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
