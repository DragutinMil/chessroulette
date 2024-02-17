import movexConfig from 'apps/chessroulette-web/movex.config';
import { ResourceIdentifier } from 'movex-core-util';
import { MovexBoundResource } from 'movex-react';
import { EditModeState } from '../types';
import { LearnBoardEditor } from '../components/LearnBoardEditor';
import { LearnBoard } from '../components/LearnBoard';
import { PreviewChessboardContainer } from 'apps/chessroulette-web/components/PreviewChessboard/PreviewChessboardContainer';

type Props = {
  rid: ResourceIdentifier<'room'>;
  editMode: {
    isActive: boolean;
    state: EditModeState;
  };
  boardSizePx: number;
  onUpdateEditModeState: (s: (prev: EditModeState) => EditModeState) => void;
};

export const MainContainer = ({
  rid,
  editMode,
  boardSizePx,
  onUpdateEditModeState,
}: Props) => {
  return (
    <MovexBoundResource
      movexDefinition={movexConfig}
      rid={rid}
      fallback={
        <div style={{ aspectRatio: 1 / 1 }} className="h-full">
          <PreviewChessboardContainer fen="empty" />
        </div>
      }
      render={({
        boundResource: {
          state: { activity },
          dispatch,
        },
      }) => {
        if (activity.activityType !== 'learn') {
          return null;
        }

        if (editMode.isActive) {
          <LearnBoardEditor
            state={editMode.state}
            onUpdate={onUpdateEditModeState}
            boardSizePx={boardSizePx}
          />;
        }

        return (
          <LearnBoard
            state={activity.activityState}
            sizePx={boardSizePx}
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
      }}
    />
  );
};
