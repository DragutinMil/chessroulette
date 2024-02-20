'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { min, noop } from '@xmatter/util-kit';
import { useEffect, useRef, useState } from 'react';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useLearnActivitySettings } from './useLearnActivitySettings';
import { useDesktopRoomLayout } from './useDesktopRoomLayout';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChapterState, LearnActivityState } from '../activity/reducer';
import { WidgetPanel } from './components/WidgetPanel';
import { UserId } from '../../user/type';
import { CameraPanel } from './components/CameraPanel';
import { RoomState } from '../movex/reducer';
import { MainArea } from './components/MainArea';

type LocalState = {
  newChapter: ChapterState;
};

export type LearnActivityProps = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: RoomState['participants'];
  localState: LocalState;
  remoteState?: LearnActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const LearnActivity = ({
  localState,
  remoteState,
  userId,
  participants,
  roomId,
  iceServers,
  dispatch = noop,
}: LearnActivityProps) => {
  // const userId = useUserId();
  const settings = useLearnActivitySettings();
  // const searchParams = useSearchParams();

  // Deprecate in favor of uncommitedChapterState
  // const isEditParamsSet = searchParams.get('edit') === '1';
  // const [editMode, setEditMode] = useState<{
  //   isActive: boolean;
  //   state: EditModeState;
  // }>({
  //   isActive: isEditParamsSet,
  //   state: {
  //     fen: ChessFENBoard.STARTING_FEN,
  //     orientation: 'white',
  //   },
  // });

  // const [uncommitedChapterState, setUncommitedChapterState] =
  //   useState<ChapterState>(initialChapterState);

  // useEffect(() => {
  //   setEditMode((prev) => ({
  //     ...prev,
  //     isActive: isEditParamsSet,
  //   }));
  // }, [isEditParamsSet]);

  const containerRef = useRef(null);
  const desktopLayout = useDesktopRoomLayout(containerRef, undefined, {
    sideMinWidth: 420,
  });

  const [mainPanelRealSize, setMainPanelRealSize] = useState(0);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    setBoardSize(min(desktopLayout.container.height, mainPanelRealSize));
  }, [desktopLayout.main, mainPanelRealSize]);

  return (
    <div
      className="flex w-full h-full align-center justify-center"
      ref={containerRef}
    >
      {/* <MovexBoundResource
        movexDefinition={movexConfig}
        rid={props.rid}
        onReady={({ boundResource }) => {
          boundResource.dispatch({
            type: 'join',
            payload: { userId },
          });
        }}
        onComponentWillUnmount={(s) => {
          if (s.init) {
            s.boundResource.dispatch({
              type: 'leave',
              payload: { userId },
            });
          }
        }}
        render={() => null}
      /> */}
      <PanelGroup autoSaveId="learn-activity" direction="horizontal">
        <Panel
          defaultSize={70}
          className="sbg-green-100 flex justify-end"
          onResize={(nextPct) => {
            if (!desktopLayout.updated) {
              return;
            }

            setMainPanelRealSize(
              (nextPct / 100) * desktopLayout.container.width
            );
          }}
          tagName="main"
          // defaultSize={
          //   51
          //   // desktopLayout.updated
          //   //   ? (desktopLayout.side.width.val /
          //   //       desktopLayout.main.width.val) *
          //   //     100
          //   //   : 51
          // }
        >
          {/* <MainContainer
            rid={props.rid}
            boardSizePx={boardSize}
            editMode={editMode}
            onUpdateEditModeState={(next) => {
              setEditMode((prev) => ({
                ...prev,
                state: next(prev.state),
              }));
            }}
          /> */}
          <MainArea
            boardSizePx={boardSize}
            isBoardEditorActive={false}
            boardState={localState.newChapter}
            dispatch={dispatch}
            onUpdateBoardState={() => {
              // TODO: add this back
            }}
          />
        </Panel>
        <div className="w-8 sbg-blue-100 relative flex flex-col items-center justify-center">
          <div className="flex-1">
            {settings.canFlipBoard && (
              <IconButton
                icon="ArrowsUpDownIcon"
                iconKind="outline"
                type="clear"
                size="sm"
                tooltip="Flip Board"
                tooltipPositon="right"
                className="mb-2"
                onClick={() => {
                  // dispatch({
                  //   type: 'changeBoardOrientation',
                  //   payload:
                  //     activityState.boardOrientation === 'black'
                  //       ? 'white'
                  //       : 'black',
                  // });
                }}
              />
            )}
          </div>

          <PanelResizeHandle
            className="w-1 h-20 rounded-lg bg-slate-600"
            title="Resize"
          />
          <div className="flex-1" />
        </div>
        <Panel minSize={25} maxSize={40} tagName="aside">
          {/* <SideContainer
            editMode={editMode}
            iceServers={iceServers}
            rid={props.rid}
            onUpdateEditModeState={(next) =>
              setEditMode((prev) => ({
                ...prev,
                state: next(prev.state),
              }))
            }
          /> */}
          <div className="flex flex-col space-between w-full relative sbg-red-100 h-full">
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="overflow-hidden rounded-lg shadow-2xl">
                {/* <Streaming
                  rid={props.rid}
                  iceServers={iceServers}
                  aspectRatio={16 / 9}
                /> */}
                <CameraPanel
                  participants={participants}
                  userId={userId}
                  peerGroupId={roomId}
                  iceServers={iceServers}
                />
              </div>

              <WidgetPanel
                // state={activityState}
                fen={localState.newChapter.startingFen} // NOT SURE THIS IS THE NEW CHAPTER OR WHAT?
                notation={localState.newChapter.notation}
                chaptersMap={remoteState?.chaptersMap || {}}
                chaptersMapIndex={remoteState?.chaptersIndex || 0}
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

                  // onUpdateEditModeState((prev) => ({
                  //   ...prev,
                  //   fen: ChessFENBoard.STARTING_FEN,
                  // }));
                }}
                onCreateChapter={(s) => {
                  dispatch({
                    type: 'createChapter',
                    payload: {
                      ...s,
                      // name: s.name,
                      // startingFen: s.startingFen,
                      // arrowsMap: editMode.state.arrowsMap,
                      // circlesMap: editMode.state.circlesMap,
                    },
                  });
                }}
                onDeleteChapter={(id) => {
                  dispatch({
                    type: 'deleteChapter',
                    payload: { id },
                  });
                }}
                onUseChapter={(id) => {
                  dispatch({
                    type: 'playChapter',
                    payload: { id },
                  });
                }}
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};
