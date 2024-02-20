import { LearnBoardEditor } from '../components/LearnBoardEditor';
import { LearnBoard } from '../components/LearnBoard';
import { ChapterBoardState, ChapterState } from '../../activity/reducer';
import { swapColor } from '@xmatter/util-kit';
import { MovexBoundResourceFromConfig } from 'movex-react';
import movexConfig from 'apps/chessroulette-web/movex.config';

type Props = {
  boardSizePx: number;
  isBoardEditorActive: boolean;
  boardState: ChapterState;
  onUpdateBoardState: (
    s: (prev: ChapterBoardState) => ChapterBoardState
  ) => void;

  // TODO: remove once refacctotred in facor of specific props
  dispatch: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const MainArea = ({
  boardSizePx,
  boardState,
  onUpdateBoardState,
  dispatch,
  ...props
}: Props) => {
  if (props.isBoardEditorActive) {
    return (
      <LearnBoardEditor
        state={boardState}
        // onUpdate={props.onUpdateBoardState}
        boardSizePx={boardSizePx}
        onUpdated={(fen) => onUpdateBoardState((prev) => ({ ...prev, fen }))}
        onArrowsChange={(arrowsMap) =>
          onUpdateBoardState((prev) => ({ ...prev, arrowsMap }))
        }
        onCircleDraw={(circleTuple) => {
          onUpdateBoardState((prev) => {
            const [at] = circleTuple;
            const circleId = `${at}`;
            const { [circleId]: existent, ...restOfCirles } =
              prev.circlesMap || {};

            return {
              ...prev,
              circlesMap: {
                ...restOfCirles,
                ...(!!existent
                  ? undefined // Set it to undefined if same
                  : { [circleId]: circleTuple }),
              },
            };
          });
        }}
        onClearCircles={() => {
          onUpdateBoardState((prev) => ({
            ...prev,
            circlesMap: {},
          }));
        }}
        onFlipBoard={() => {
          onUpdateBoardState((prev) => ({
            ...prev,
            orientation: swapColor(prev.orientation),
          }));
        }}
      />
    );
  }

  return (
    // <div>learn board</div>
    <LearnBoard
      sizePx={boardSizePx}
      {...boardState}
      onMove={(payload) => {
        dispatch({ type: 'dropPiece', payload });

        // TODO: This can be returned from a more internal component
        return true;
      }}
      onArrowsChange={(payload) => {
        dispatch({ type: 'arrowChange', payload });
      }}
      onCircleDraw={(tuple) => {
        dispatch({
          type: 'drawCircle',
          payload: tuple,
        });
      }}
      onClearCircles={() => {
        dispatch({ type: 'clearCircles' });
      }}
    />
  );
};
