import { BoardEditor, BoardEditorProps } from '@app/components/BoardEditor';
import { ChapterBoardState } from '../movex';

export type AichessBoardEditorProps = {
  boardSizePx: number;
  state: ChapterBoardState;
  boardOrientation?: BoardEditorProps['boardOrientation'];
} & Required<
  Pick<
    BoardEditorProps,
    | 'onUpdateFen'
    | 'onClearCircles'
    | 'onFlipBoard'
    | 'onCircleDraw'
    | 'onArrowsChange'
    | 'showSaveButtons'
    | 'onCancel'
    | 'onSave'
  >
>;

// @deprecate a not used anymore in favor of InstructorBoard direct usage
export const AichessBoardEditor = ({
  state: { displayFen, orientation, arrowsMap, circlesMap },
  boardOrientation,
  boardSizePx,
  ...boardProps
}: AichessBoardEditorProps) => (
  <BoardEditor
    fen={displayFen}
    sizePx={boardSizePx}
    boardOrientation={boardOrientation || orientation}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
  />
);
