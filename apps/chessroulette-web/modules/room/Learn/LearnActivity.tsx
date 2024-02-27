'use client';

import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { ChessFENBoard, noop, swapColor } from '@xmatter/util-kit';
import { useEffect, useReducer, useRef, useState } from 'react';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useLearnActivitySettings } from './useLearnActivitySettings';
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
import { LearnBoard, RIGHT_SIDE_SIZE_PX } from './components/LearnBoard';
import inputReducer, { initialInputState } from '../activity/inputReducer';
import { ChapterDisplayView } from './chapters/ChapterDisplayView';
import { useContainerDimensions } from 'apps/chessroulette-web/components/ContainerWithDimensions';
import { Freeboard } from 'apps/chessroulette-web/components/Chessboard/Freeboard';
import { IconButton } from 'apps/chessroulette-web/components/Button';

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
  dispatch: optionalDispatch,
}: LearnActivityProps) => {
  const dispatch = optionalDispatch || noop;

  const settings = useLearnActivitySettings();
  const containerRef = useRef(null);
  const [mainPanelPercentageSize, setMainPanelPercentageSize] = useState(0);
  const [boardSize, setBoardSize] = useState(0);

  const containerDimensions = useContainerDimensions(containerRef);

  useEffect(() => {
    if (!containerDimensions.updated) {
      return;
    }

    const mainPanelWidthPx =
      (mainPanelPercentageSize / 100) * containerDimensions.width;

    if (containerDimensions.height < mainPanelWidthPx) {
      // If the height is smaller than the main panel's width, use that
      setBoardSize(containerDimensions.height);
    } else {
      // otherwise use the totality of the main panel - the side (32px)
      // TODO: Refactor the usage of RIGHT_SIDE_SIZE_PX
      setBoardSize(mainPanelWidthPx - RIGHT_SIDE_SIZE_PX);
    }
  }, [containerDimensions, mainPanelPercentageSize]);

  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  return (
    <div
      id="learn-activity-container"
      className="flex w-full h-full align-center justify-center sbg-red-100"
      ref={containerRef}
    >
      <PanelGroup
        autoSaveId="learn-activity"
        direction="horizontal"
        className="sbg-green-500"
      >
        <Panel
          defaultSize={70}
          className="flex sjustify-end justify-center"
          onResize={setMainPanelPercentageSize}
          tagName="main"
          style={{
            // refactor this to not have to use RIGHT_SIDE_SIZE_PX in so many places
            paddingRight: RIGHT_SIDE_SIZE_PX,
          }}
        >
          {settings.isInstructor && inputState.isActive ? (
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
                  onFlipBoard={() => {
                    // TODO: Fix this
                    dispatchInputState({
                      type: 'updatePartialChapter',
                      payload: {
                        orientation: swapColor(
                          inputState.chapterState.orientation
                        ),
                      },
                    });
                  }}
                  onClose={() => {
                    dispatchInputState({
                      type: 'update',
                      payload: { isBoardEditorShown: false },
                    });
                  }}
                />
              ) : (
                <Freeboard
                  sizePx={boardSize}
                  {...inputState.chapterState}
                  fen={inputState.chapterState.displayFen}
                  boardOrientation={inputState.chapterState.orientation}
                  onMove={(move) => {
                    dispatchInputState({ type: 'move', payload: { move } });

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
                  rightSideSizePx={32} // TODO: This should come from the same place as the one for LearnBoard
                  rightSideClassName="flex flex-col"
                  rightSideComponent={
                    <>
                      <div className="flex-1">
                        <IconButton
                          icon="ArrowsUpDownIcon"
                          iconKind="outline"
                          type="clear"
                          size="sm"
                          tooltip="Flip Board"
                          tooltipPositon="left"
                          className="mb-2"
                          onClick={() => {
                            dispatchInputState({
                              type: 'updatePartialChapter',
                              payload: {
                                orientation: swapColor(
                                  inputState.chapterState.orientation
                                ),
                              },
                            });
                          }}
                        />
                        <IconButton
                          icon="TrashIcon"
                          iconKind="outline"
                          type="clear"
                          size="sm"
                          tooltip="Clear Board"
                          tooltipPositon="left"
                          className="mb-2"
                          onClick={() => {
                            dispatchInputState({
                              type: 'updateChapterFen',
                              payload: { fen: ChessFENBoard.ONLY_KINGS_FEN },
                            });
                          }}
                        />
                        <IconButton
                          icon="ArrowPathIcon"
                          iconKind="outline"
                          type="clear"
                          size="sm"
                          tooltip="Start Position"
                          tooltipPositon="left"
                          className="mb-2"
                          onClick={() => {
                            dispatchInputState({
                              type: 'updateChapterFen',
                              payload: { fen: ChessFENBoard.STARTING_FEN },
                            });
                          }}
                        />

                        <IconButton
                          icon="PencilSquareIcon"
                          iconKind="outline"
                          type="clear"
                          size="sm"
                          tooltip="Board Editor"
                          tooltipPositon="left"
                          className="mb-2"
                          onClick={() => {
                            dispatchInputState({
                              type: 'update',
                              payload: { isBoardEditorShown: true },
                            });
                          }}
                        />
                      </div>

                      <div className="relative flex flex-col items-center justify-center">
                        <PanelResizeHandle
                          className="w-1 h-20 rounded-lg bg-slate-600"
                          title="Resize"
                        />
                      </div>
                      <div className="flex-1" />
                    </>
                  }
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
              onFlip={() => {
                dispatch({
                  type: 'loadedChapter:setOrientation',
                  payload: swapColor(currentChapter.orientation),
                });
              }}
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
              onClearBoard={() => {
                dispatch({
                  type: 'loadedChapter:updateFen',
                  payload: ChessFENBoard.ONLY_KINGS_FEN,
                });
              }}
              onResetBoard={() => {
                dispatch({
                  type: 'loadedChapter:updateFen',
                  payload: ChessFENBoard.STARTING_FEN,
                });
              }}
              rightSideClassName="flex-1"
              rightSideComponent={
                <>
                <div className="relative flex flex-1 flex-col items-center justify-center">
                  <PanelResizeHandle
                    className="w-1 h-20 rounded-lg bg-slate-600"
                    title="Resize"
                  />
                </div>
                <div className='flex-1' />
                </>
              }
            />
          )}
        </Panel>
        <Panel
          defaultSize={33}
          minSize={33}
          maxSize={40}
          tagName="aside"
          className="flex flex-col space-between w-full relative h-full"
        >
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="overflow-hidden rounded-lg shadow-2xl">
              <CameraPanel
                participants={participants}
                userId={userId}
                peerGroupId={roomId}
                iceServers={iceServers}
                aspectRatio={16 / 9}
              />
            </div>

            {/* {inputState.isActive ? 'active' : 'not active'} */}
            {inputState.isActive ? (
              <div className="flex gap-2">
                <span className="capitalize">Editing</span>
                <span className="font-bold">
                  "{inputState.chapterState.name}"
                </span>
              </div>
            ) : (
              <ChapterDisplayView chapter={currentChapter} />
            )}
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
        </Panel>
      </PanelGroup>
    </div>
  );
};
