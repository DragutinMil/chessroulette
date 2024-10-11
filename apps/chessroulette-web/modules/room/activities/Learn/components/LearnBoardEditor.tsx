import {
  BoardEditor,
  BoardEditorProps,
} from 'apps/chessroulette-web/components/BoardEditor';
import { ChapterBoardState } from '../movex';
import { toShortColor } from '@xmatter/util-kit';

export type LearnBoardEditorProps = {
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
export const LearnBoardEditor = ({
  state: { displayFen, orientation, arrowsMap, circlesMap },
  boardOrientation,
  boardSizePx,
  ...boardProps
}: LearnBoardEditorProps) => (
  <BoardEditor
    fen={displayFen}
    sizePx={boardSizePx}
    boardOrientation={toShortColor(boardOrientation || orientation)}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
  />
);
