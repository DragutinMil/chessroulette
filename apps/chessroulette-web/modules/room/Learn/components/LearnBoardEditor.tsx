import {
  BoardEditor,
  BoardEditorProps,
} from 'apps/chessroulette-web/components/Chessboard/BoardEditor';
import { ChapterBoardState } from '../../activity/reducer';
import { swapColor } from '@xmatter/util-kit';

export type LearnBoardEditorProps = {
  boardSizePx: number;
  state: ChapterBoardState;
  boardOrientation?: BoardEditorProps['boardOrientation'];
} & Required<
  Pick<
    BoardEditorProps,
    | 'onUpdated'
    | 'onClearCircles'
    | 'onFlipBoard'
    | 'onCircleDraw'
    | 'onArrowsChange'
    | 'onCancel'
    | 'onSave'
  >
>;

export const LearnBoardEditor = ({
  state: { displayFen, orientation, arrowsMap, circlesMap },
  boardOrientation,
  boardSizePx,
  ...boardProps
}: LearnBoardEditorProps) => (
  <BoardEditor
    fen={displayFen}
    sizePx={boardSizePx}
    boardOrientation={boardOrientation || orientation}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
  />
);
