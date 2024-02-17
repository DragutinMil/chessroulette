import { ResourceIdentifier } from 'movex-core-util';
import Streaming from '../../Streaming';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { EditModeState } from '../types';
import { EditChaptersWidget } from '../chapters/EditChaptersWidget';
import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResource } from 'movex-react';
import { usePathname, useRouter } from 'next/navigation';
import { LearnBoardPanel } from '../components/LearnBoardPanel';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { ChessFENBoard } from '@xmatter/util-kit';

type Props = {
  rid: ResourceIdentifier<'room'>;
  iceServers: IceServerRecord[];
  editMode: {
    isActive: boolean;
    state: EditModeState;
  };
  onUpdateEditModeState: (s: (prev: EditModeState) => EditModeState) => void;
};

export const SideContainer = ({
  rid,
  iceServers,
  editMode,
  onUpdateEditModeState,
}: Props) => {
  const router = useRouter();
  const currentPathName = usePathname();
  const updatedableSearchParams = useUpdateableSearchParams();

  return (
    <div className="flex flex-col space-between w-full relative sbg-red-100 h-full">
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        <div className="overflow-hidden rounded-lg shadow-2xl">
          <Streaming rid={rid} iceServers={iceServers} aspectRatio={16 / 9} />
        </div>

        <MovexBoundResource
          movexDefinition={movexConfig}
          rid={rid}
          render={({
            boundResource: {
              state: { activity },
              dispatch,
            },
          }) => {
            if (activity.activityType !== 'learn') {
              return null;
            }

            const { activityState } = activity;

            if (editMode.isActive) {
              return (
                <EditChaptersWidget
                  boardState={editMode.state}
                  chaptersMap={activityState.chaptersMap}
                  onCreate={(s) => {
                    dispatch({
                      type: 'createChapter',
                      payload: {
                        name: s.name,
                        fen: s.fen,
                        arrowsMap: editMode.state.arrowsMap,
                        circlesMap: editMode.state.circlesMap,
                      },
                    });
                  }}
                  onDeleteChapter={(id) => {
                    dispatch({
                      type: 'deleteChapter',
                      payload: { id },
                    });
                  }}
                  onUpdateChapter={(id, state) => {
                    dispatch({
                      type: 'updateChapter',
                      payload: { id, state },
                    });
                  }}
                  onUpdateFen={(fen) => {
                    onUpdateEditModeState((prev) => ({
                      ...prev,
                      fen,
                    }));
                  }}
                  onExitEditMode={() => {
                    router.push(
                      `${currentPathName}?${updatedableSearchParams.set(
                        (prev) => ({
                          ...prev,
                          edit: undefined,
                        })
                      )}`
                    );
                  }}
                  onUseChapter={(id) => {
                    const nextChapter = activityState.chaptersMap[id];

                    onUpdateEditModeState((prev) => ({
                      ...prev,
                      fen: nextChapter.fen,
                      arrowsMap: nextChapter.arrowsMap,
                      circlesMap: nextChapter.circlesMap,
                    }));
                  }}
                  onUseCurrentBoard={() => {
                    dispatch({
                      type: 'importFen',
                      payload: editMode.state.fen,
                    });

                    router.push(
                      `${currentPathName}?${updatedableSearchParams.set(
                        (prev) => ({
                          ...prev,
                          edit: undefined,
                        })
                      )}`
                    );
                  }}
                  onClearArrowsAndCircles={() => {
                    onUpdateEditModeState((prev) => ({
                      ...prev,
                      arrowsMap: undefined,
                      circlesMap: undefined,
                    }));
                  }}
                />
              );
            }

            return (
              <LearnBoardPanel
                state={activityState}
                onHistoryNotationRefocus={(index) => {
                  dispatch({
                    type: 'focusHistoryIndex',
                    payload: { index },
                  });
                }}
                onHistoryNotationDelete={(atIndex) => {
                  dispatch({
                    type: 'deleteHistoryMove',
                    payload: { atIndex },
                  });
                }}
                onImport={(inputType, nextInput) => {
                  dispatch({
                    type: inputType === 'FEN' ? 'importFen' : 'importPgn',
                    payload: nextInput,
                  });

                  onUpdateEditModeState((prev) => ({
                    ...prev,
                    fen: ChessFENBoard.STARTING_FEN,
                  }));
                }}
              />
            );
          }}
        />
      </div>
    </div>
  );
};
