import { ChapterBoardState, ChapterState, aiLearn } from '../movex';
import { useLearnAiActivitySettings } from '../hooks/useLearnAiActivitySettings';
import { Freeboard, Playboard } from '@app/components/Boards';
import { type ChessboardOptions } from 'react-chessboard';
import { FreeBoardHistory } from '@xmatter/util-kit';
import {
  BoardEditorIconButton,
  ClearBoardIconButton,
  FlipBoardIconButton,
  StartPositionIconButton,
  ChessboardContainerProps,
} from '@app/components/Chessboard';
import { RIGHT_SIDE_SIZE_PX } from '@app/modules/Room/constants';

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
    aiLearn: aiLearn;
    onClearBoard: () => void;
    onResetBoard: () => void;
    onBoardEditor: () => void;
    squareRenderer?: ChessboardOptions['squareRenderer'];
  };

export const LearnAiBoard = ({
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
  aiLearn,
  ...chessBoardProps
}: Props) => {
  const settings = useLearnAiActivitySettings();
  const lm =
    notation &&
    FreeBoardHistory.findMoveAtIndex(notation.history, notation.focusedIndex);
  const lastMove = lm?.isNonMove ? undefined : lm;

  const Board = settings.canMakeInvalidMoves ? Freeboard : Playboard;
  const turn = orientation;
  return (
    <Board
      isLearnAi={true}
      containerClassName={`shadow-2xl`}
      boardOrientation={orientation}
      playingColor={orientation}
      sizePx={sizePx}
      fen={fen}
      lastMove={lastMove}
      arrowsMap={arrowsMap}
      circlesMap={circlesMap}
      {...chessBoardProps}
      turn={turn}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      canPlay
      rightSideClassName={`flex flex-col ${rightSideClassName}`}
      rightSideComponent={
        <>
          <div className="flex-1">
            {/* {settings.canFlipBoard && (
              <FlipBoardIconButton className="mb-2" onClick={onFlip} />
            )} */}
            {settings.isInstructor && (
              <>
                {/* <StartPositionIconButton
                  className="mb-2"
                  onClick={onResetBoard}
                /> */}
                {/* <ClearBoardIconButton className="mb-2" onClick={onClearBoard} />
                <BoardEditorIconButton
                  className="mb-2"
                  onClick={onBoardEditor}
                /> */}
              </>
            )}
          </div>
          {rightSideComponent}
        </>
      }
    />
  );
};
