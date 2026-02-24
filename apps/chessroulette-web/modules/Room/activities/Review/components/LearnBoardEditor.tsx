import { BoardEditor, BoardEditorProps } from '@app/components/BoardEditor';
import { ChapterBoardState } from '../movex';

export type ReviewBoardEditorProps = {
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
export const ReviewBoardEditor = ({
  state: { displayFen, orientation, arrowsMap, circlesMap },
  boardOrientation,
  boardSizePx,
  ...boardProps
}: ReviewBoardEditorProps) => (
  <BoardEditor
    fen={displayFen}
    sizePx={boardSizePx}
    boardOrientation={boardOrientation || orientation}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
  />
);
