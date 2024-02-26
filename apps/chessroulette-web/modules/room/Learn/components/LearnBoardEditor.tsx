import {
  BoardEditorProps,
  BoardEditorWithSize,
} from 'apps/chessroulette-web/components/Chessboard/BoardEditor';
import { ChapterBoardState } from '../../activity/reducer';

export type LearnBoardEditorProps = {
  boardSizePx: number;
  state: ChapterBoardState;
  // onUpdate: (s: (prev: ChapterBoardState) => ChapterBoardState) => void;
  // onUpdateFen: (fen: ChessFEN) => void;
} & Required<
  Pick<
    BoardEditorProps,
    | 'onUpdated'
    | 'onClearCircles'
    | 'onFlipBoard'
    | 'onCircleDraw'
    | 'onArrowsChange'
    | 'onClose'
  >
>;

export const LearnBoardEditor = ({
  state: { displayFen, orientation, arrowsMap, circlesMap },
  boardSizePx,
  ...boardProps
}: LearnBoardEditorProps) => (
  <BoardEditorWithSize
    fen={displayFen}
    sizePx={boardSizePx}
    // onUpdated={(fen) => onUpdate((prev) => ({ ...prev, fen }))}
    // onUpdated={onUpdateFen}
    boardOrientation={orientation}
    // onArrowsChange={(arrowsMap) => onUpdate((prev) => ({ ...prev, arrowsMap }))}
    arrowsMap={arrowsMap}
    circlesMap={circlesMap}
    {...boardProps}
    // onCircleDraw={(circleTuple) => {
    //   onUpdate((prev) => {
    //     const [at] = circleTuple;
    //     const circleId = `${at}`;
    //     const { [circleId]: existent, ...restOfCirles } = prev.circlesMap || {};

    //     return {
    //       ...prev,
    //       circlesMap: {
    //         ...restOfCirles,
    //         ...(!!existent
    //           ? undefined // Set it to undefined if same
    //           : { [circleId]: circleTuple }),
    //       },
    //     };
    //   });
    // }}
    // onClearCircles={() => {
    //   onUpdate((prev) => ({
    //     ...prev,
    //     circlesMap: {},
    //   }));
    // }}
    // onFlipBoard={() => {
    //   onUpdate((prev) => ({
    //     ...prev,
    //     orientation: swapColor(prev.orientation),
    //   }));
    // }}
  />
);
