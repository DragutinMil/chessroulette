import {
  BoardEditor,
  BoardEditorProps,
} from 'apps/chessroulette-web/components/Chessboard/BoardEditor';
import { ChapterBoardState } from '../../activity/reducer';

export type LearnBoardEditorProps = {
  boardSizePx: number;
  state: ChapterBoardState;
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
  boardSizePx,
  ...boardProps
}: LearnBoardEditorProps) => (
  <BoardEditor
    fen={displayFen}
    sizePx={boardSizePx}
    boardOrientation={orientation}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
  />
);
