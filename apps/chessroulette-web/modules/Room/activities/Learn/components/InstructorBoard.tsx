import { Freeboard } from '@app/components/Boards';
import {
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  noop,
  swapColor,
  toShortColor,
} from '@xmatter/util-kit';
import { RIGHT_SIDE_SIZE_PX } from '../../../constants';
import { IconButton } from '@app/components/Button';
import { PanelResizeHandle } from 'react-resizable-panels';
import { BoardEditor } from '@app/components/BoardEditor';
import { ChessboardContainerProps } from '@app/components/Chessboard';
import { ChapterState } from '../movex';

type CommonBoardProps = Pick<
  ChessboardContainerProps,
  'onArrowsChange' | 'onCircleDraw' | 'onClearCircles' | 'onMove'
> & {
  onFlipBoard: () => void;
  onToggleBoardEditor?: () => void;
  showBoardEditorSaveButtons?: boolean;
};

type Props = {
  fen: ChessFEN;
  boardOrientation?: ChessColor;
  // dispatch: Dispatch<InputAction>;
  showBoardEditor?: boolean;
  boardSizePx: number;
} & CommonBoardProps & {
    onUpdateFen: (nextFen: ChessFEN) => void;
  };

export const InstructorBoard = ({
  boardSizePx,
  showBoardEditor = false,
  // dispatch,
  onToggleBoardEditor = noop,
  boardOrientation,
  ...chessBoardProps
}: Props) => {
  if (showBoardEditor) {
    return (
      <BoardEditor
        sizePx={boardSizePx}
        // boardOrientation={swapColor(state.orientation)}
        boardOrientation={boardOrientation ? toShortColor(boardOrientation) : undefined}
        {...chessBoardProps}
        // onArrowsChange={(arrowsMap) => {
        //   dispatch({
        //     type: 'updatePartialChapter',
        //     payload: { arrowsMap },
        //   });
        // }}
        // onCircleDraw={(payload) => {
        //   dispatch({
        //     type: 'drawCircle',
        //     payload,
        //   });
        // }}
        // onClearCircles={() => {
        //   dispatch({ type: 'clearCircles' });
        // }}
        // onFlipBoard={() => {
        //   // TODO: Fix this
        //   dispatch({
        //     type: 'updatePartialChapter',
        //     payload: {
        //       orientation: swapColor(state.chapterState.orientation),
        //     },
        //   });
        // }}
        // onUpdated={(fen) => {

        //   dispatch({
        //     type: 'updateChapterFen',
        //     payload: { fen },
        //   });
        // }}
        showSaveButtons={chessBoardProps.showBoardEditorSaveButtons}
        onCancel={onToggleBoardEditor}
        onSave={onToggleBoardEditor}
        // onCancel={() => {

        //   // dispatch({
        //   //   type: 'update',
        //   //   payload: { isBoardEditorShown: false },
        //   // });
        // }}
        // onSave={() => {
        //   dispatch({
        //     type: 'update',
        //     payload: { isBoardEditorShown: false },
        //   });
        // }}
      />
    );
  }

  return (
    <Freeboard
      sizePx={boardSizePx}
      // {...state}
      // fen={state.displayFen}
      // boardOrientation={swapColor(state.orientation)}
      // onMove={(move) => {
      //   dispatch({ type: 'move', payload: { move } });

      //   // TODO: This can be returned from a more internal component
      //   return true;
      // }}
      // onArrowsChange={(arrowsMap) => {
      //   dispatch({
      //     type: 'updatePartialChapter',
      //     payload: { arrowsMap },
      //   });
      // }}
      // onCircleDraw={(payload) => {
      //   dispatch({
      //     type: 'drawCircle',
      //     payload,
      //   });
      // }}
      // onClearCircles={() => {
      //   dispatch({ type: 'clearCircles' });
      // }}
      {...chessBoardProps}
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName="flex flex-col"
      rightSideComponent={
        <>
          <div className="flex-1">
            <IconButton
              icon="ArrowsUpDownIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Flip Board"
              tooltipPositon="left"
              className="mb-2"
              onClick={chessBoardProps.onFlipBoard}
              // onClick={() => {
              //   // ();
              //   // dispatch({
              //   //   type: 'updatePartialChapter',
              //   //   payload: {
              //   //     orientation: swapColor(state.chapterState.orientation),
              //   //   },
              //   // });
              // }}
            />
            <IconButton
              icon="TrashIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Clear Board"
              tooltipPositon="left"
              className="mb-2"
              onClick={() => {
                chessBoardProps.onUpdateFen(ChessFENBoard.ONLY_KINGS_FEN);
                // dispatch({
                //   type: 'updateChapterFen',
                //   payload: { fen: ChessFENBoard.ONLY_KINGS_FEN },
                // });
              }}
            />
            <IconButton
              icon="ArrowPathIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Start Position"
              tooltipPositon="left"
              className="mb-2"
              onClick={() => {
                chessBoardProps.onUpdateFen(ChessFENBoard.STARTING_FEN);
                // dispatch({
                //   type: 'updateChapterFen',
                //   payload: { fen: ChessFENBoard.STARTING_FEN },
                // });
              }}
            />

            <IconButton
              icon="PencilSquareIcon"
              iconKind="outline"
              type="clear"
              size="sm"
              tooltip="Board Editor"
              tooltipPositon="left"
              className="mb-2"
              onClick={onToggleBoardEditor}
              // onClick={() => {
              //   // dispatch({
              //   //   type: 'update',
              //   //   payload: { isBoardEditorShown: true },
              //   // });
              //   onToggleBoardEditor();
              // }}
            />
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <PanelResizeHandle
              className="w-1 h-20 rounded-lg bg-slate-600"
              title="Resize"
            />
          </div>
          <div className="flex-1" />
        </>
      }
    />
  );
};
