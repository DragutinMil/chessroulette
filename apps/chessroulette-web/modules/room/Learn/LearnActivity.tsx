'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { min, noop, swapColor } from '@xmatter/util-kit';
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

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  return (
    <div
      className="flex w-full h-full align-center justify-center"
      ref={containerRef}
    >
      <PanelGroup autoSaveId="learn-activity" direction="horizontal">
        <Panel
          defaultSize={70}
          className="flex justify-end"
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
                    dispatchInputState({
                      type: 'updateChapterFen',
                      payload: { fen },
                    });
                  }}
                  onArrowsChange={(arrowsMap) => {
                    dispatchInputState({
                      type: 'updatePartialChapter',
                      payload: { arrowsMap },
                    });
                  }}
                  onCircleDraw={(payload) => {
                    dispatchInputState({
                      type: 'drawCircle',
                      payload,
                    });
                  }}
                  onClearCircles={() => {
                    dispatchInputState({ type: 'clearCircles' });
                  }}
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
                  onArrowsChange={(arrowsMap) => {
                    dispatchInputState({
                      type: 'updatePartialChapter',
                      payload: { arrowsMap },
                    });
                  }}
                  onCircleDraw={(payload) => {
                    dispatchInputState({
                      type: 'drawCircle',
                      payload,
                    });
                  }}
                  onClearCircles={() => {
                    dispatchInputState({ type: 'clearCircles' });
                  }}
                />
              )}
            </>
          ) : (
            // Learn Mode
            <LearnBoard
              sizePx={boardSize}
              {...currentChapter}
              orientation={
                // The instructor gets the opposite side as the student (so they can play together)
                settings.isInstructor
                  ? swapColor(currentChapter.orientation)
                  : currentChapter.orientation
              }
              onMove={(payload) => {
                // dispatch({ type: 'dropPiece', payload: { move } });
                dispatch({ type: 'loadedChapter:addMove', payload });

                // TODO: This can be returned from a more internal component
                return true;
              }}
              onArrowsChange={(payload) => {
                dispatch({ type: 'loadedChapter:setArrows', payload });
              }}
              onCircleDraw={(tuple) => {
                dispatch({
                  type: 'loadedChapter:drawCircle',
                  payload: tuple,
                });
              }}
              onClearCircles={() => {
                dispatch({ type: 'loadedChapter:clearCircles' });
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
            {/* // TODO: bring it back somethow  */}
            {/* {settings.canFlipBoard && (
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
            )} */}
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
                currentChapterState={currentChapter}
                chaptersMap={remoteState?.chaptersMap || {}}
                inputModeState={inputState}
                chaptersMapIndex={remoteState?.chaptersIndex || 0}
                currentLoadedChapterId={remoteState?.loadedChapterId}
                onActivateInputMode={(payload) => {
                  dispatchInputState({ type: 'activate', payload });
                }}
                onDeactivateInputMode={() => {
                  dispatchInputState({ type: 'deactivate' });
                }}
                onUpdateInputModeState={(payload) => {
                  dispatchInputState({ type: 'update', payload });
                }}
                onHistoryNotationRefocus={(payload) => {
                  dispatch({
                    type: 'loadedChapter:focusHistoryIndex',
                    payload,
                  });
                }}
                onHistoryNotationDelete={(payload) => {
                  dispatch({
                    type: 'loadedChapter:deleteHistoryMove',
                    payload,
                  });
                }}
                onImport={() => {}}
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
