'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { min, noop } from '@xmatter/util-kit';
import { useEffect, useReducer, useRef, useState } from 'react';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useLearnActivitySettings } from './useLearnActivitySettings';
import { useDesktopRoomLayout } from './useDesktopRoomLayout';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  LearnActivityState,
  findLoadedChapter,
  initialDefaultChapter,
} from '../activity/reducer';
import { WidgetPanel } from './components/WidgetPanel';
import { UserId } from '../../user/type';
import { CameraPanel } from './components/CameraPanel';
import { RoomState } from '../movex/reducer';
import { LearnBoardEditor } from './components/LearnBoardEditor';
import { LearnBoard } from './components/LearnBoard';
import inputReducer, { initialInputState } from '../activity/inputReducer';
import { ChapterDisplayView } from './chapters/ChapterDisplayView';

export type LearnActivityProps = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: RoomState['participants'];
  remoteState: LearnActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const LearnActivity = ({
  remoteState,
  userId,
  participants,
  roomId,
  iceServers,
  dispatch = noop,
}: LearnActivityProps) => {
  const settings = useLearnActivitySettings();
  const containerRef = useRef(null);
  const desktopLayout = useDesktopRoomLayout(containerRef, undefined, {
    sideMinWidth: 420,
  });
  const [mainPanelRealSize, setMainPanelRealSize] = useState(0);
  const [boardSize, setBoardSize] = useState(0);

  useEffect(() => {
    setBoardSize(min(desktopLayout.container.height, mainPanelRealSize));
  }, [desktopLayout.main, mainPanelRealSize]);

  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const currentChapter = findLoadedChapter(remoteState) || initialDefaultChapter;

  return (
    <div
      className="flex w-full h-full align-center justify-center"
      ref={containerRef}
    >
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
        >
          {inputState.isActive ? (
            // Preparing Mode
            <>
              {inputState.isBoardEditorShown ? (
                <LearnBoardEditor
                  state={inputState.chapterState}
                  boardSizePx={boardSize}
                  onUpdated={(fen) => {
                    // console.log('board editor on updated', s);
                    dispatchInputState({
                      type: 'updateFen',
                      payload: { fen },
                    });
                  }}
                  onArrowsChange={(arrowsMap) => {}}
                  onCircleDraw={(circleTuple) => {}}
                  onClearCircles={() => {}}
                  onFlipBoard={() => {}}
                />
              ) : (
                <LearnBoard
                  sizePx={boardSize}
                  {...inputState.chapterState}
                  onMove={(move) => {
                    dispatchInputState({ type: 'move', payload: { move } });

                    // onUpdateInputState()
                    // TODO: This can be returned from a more internal component
                    return true;
                  }}
                  onArrowsChange={(payload) => {}}
                  onCircleDraw={(tuple) => {}}
                  onClearCircles={() => {}}
                />
              )}
            </>
          ) : (
            // Learn Mode
            <LearnBoard
              sizePx={boardSize}
              {...currentChapter}
              onMove={(payload) => {
                // dispatch({ type: 'dropPiece', payload: { move } });
                dispatch({ type: 'loadedChapter:addMove', payload });

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
          )}

          {/* <MainArea
            boardSizePx={boardSize}
            isBoardEditorActive={localState.isBoardEditorShown}
            boardState={currentBoardState}
            dispatch={dispatch}
            // onUpdateBoardState={() => {
            // TODO: add this back
            // }}
          /> */}
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
        <Panel defaultSize={33} minSize={33} maxSize={40} tagName="aside">
          <div className="flex flex-col space-between w-full relative sbg-red-100 h-full">
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="overflow-hidden rounded-lg shadow-2xl">
                <CameraPanel
                  participants={participants}
                  userId={userId}
                  peerGroupId={roomId}
                  iceServers={iceServers}
                />
              </div>

              {/* {inputState.isActive ? 'active' : 'not active'} */}
              <ChapterDisplayView chapter={currentChapter} />
              <WidgetPanel
                // state={activityState}
                currentChapterState={currentChapter}
                // NOT SURE THIS IS THE NEW CHAPTER OR WHAT?
                // Should this come from the baordState? I guess?
                // fen={currentChapterState.displayFen}
                // notation={currentChapterState.notation}

                chaptersMap={remoteState?.chaptersMap || {}}
                inputModeState={inputState}
                chaptersMapIndex={remoteState?.chaptersIndex || 0}
                currentLoadedChapterId={remoteState?.loadedChapterId}
                // onToggleBoardEditor={(isBoardEditorShown) => {
                //   if (inputState.isActive) {
                //     // Only update if isActive
                //     onUpdateInputState({ ...inputState, isBoardEditorShown });
                //   }
                // }}
                onActivateInputMode={(payload) => {
                  dispatchInputState({ type: 'activate', payload });
                  // onUpdateInputState({
                  //   isActive: true,
                  //   isBoardEditorShown: !!s.isBoardEditorShown,
                  //   chapterState: s.chapterState,
                  // });
                }}
                onDeactivateInputMode={() => {
                  dispatchInputState({ type: 'deactivate' });
                  // onUpdateInputState({
                  //   isActive: false,
                  //   chapterState: undefined,
                  // });
                }}
                onUpdateInputModeState={(payload) => {
                  dispatchInputState({ type: 'update', payload });
                  // if (inputState.isActive) {
                  //   onUpdateInputState({
                  //     ...inputState,
                  //     ...next,
                  //   });
                  // }
                }}
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
                }}
                onCreateChapter={() => {
                  if (inputState.isActive) {
                    dispatch({
                      type: 'createChapter',
                      payload: inputState.chapterState,
                    });
                  }
                }}
                onUpdateChapter={(id) => {
                  if (inputState.isActive) {
                    dispatch({
                      type: 'updateChapter',
                      payload: {
                        id,
                        state: inputState.chapterState,
                      },
                    });
                  }
                }}
                onDeleteChapter={(id) => {
                  dispatch({
                    type: 'deleteChapter',
                    payload: { id },
                  });
                }}
                onLoadChapter={(id) => {
                  dispatch({
                    type: 'loadChapter',
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
