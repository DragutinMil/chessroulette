import movexConfig from 'apps/chessroulette-web/movex.config';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { ChessFENBoard, noop, swapColor } from '@xmatter/util-kit';
import { useReducer, useRef } from 'react';
import { IceServerRecord } from 'apps/chessroulette-web/providers/PeerToPeerProvider/type';
import { useLearnActivitySettings } from './hooks/useLearnActivitySettings';
import { PanelResizeHandle } from 'react-resizable-panels';
import {
  LearnActivityState,
  findLoadedChapter,
  initialDefaultChapter,
} from './movex';
import { WidgetPanel } from './components/WidgetPanel';
import { CameraPanel } from '../../components/CameraPanel';
import { LearnBoardEditor } from './components/LearnBoardEditor';
import { LearnBoard, RIGHT_SIDE_SIZE_PX } from './components/LearnBoard';
import inputReducer, { initialInputState } from './reducers/inputReducer';
import { ChapterDisplayView } from './chapters/ChapterDisplayView';
import { Freeboard } from 'apps/chessroulette-web/components/Boards';
import { IconButton } from 'apps/chessroulette-web/components/Button';
import { TabsRef } from 'apps/chessroulette-web/components/Tabs';
import { UserId, UsersMap } from 'apps/chessroulette-web/modules/user/type';
import { DesktopRoomLayout } from '../../components/DesktopRoomLayout';

type Props = {
  roomId: string;
  userId: UserId;
  iceServers: IceServerRecord[];
  participants: UsersMap;
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
}: Props) => {
  const dispatch = optionalDispatch || noop;

  const settings = useLearnActivitySettings();
  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  const tabsRef = useRef<TabsRef>(null);

  return (
    <DesktopRoomLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          {settings.isInstructor && inputState.isActive ? (
            // Preparing Mode
            <>
              {inputState.isBoardEditorShown ? (
                <LearnBoardEditor
                  state={inputState.chapterState}
                  boardSizePx={boardSize}
                  boardOrientation={swapColor(
                    inputState.chapterState.orientation
                  )}
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
                  onCancel={() => {
                    dispatchInputState({
                      type: 'update',
                      payload: { isBoardEditorShown: false },
                    });
                  }}
                  onSave={() => {
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
                  boardOrientation={swapColor(
                    inputState.chapterState.orientation
                  )}
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
                  rightSideSizePx={RIGHT_SIDE_SIZE_PX}
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
              onBoardEditor={() => {
                dispatchInputState({
                  type: 'activate',
                  payload: {
                    isBoardEditorShown: true,
                    chapterState: currentChapter,
                  },
                });

                // 2 is the update stack - this should be done much more explicit in the future!
                tabsRef.current?.focusByTabId('chapters', 2);
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
                  <div className="flex-1" />
                </>
              }
            />
          )}
        </>
      )}
      rightComponent={
        <div className="flex flex-col flex-1 min-h-0 gap-4">
          {participants && participants[userId] && (
            <div className="overflow-hidden rounded-lg shadow-2xl">
              {/* // This needs to show only when the user is a participants //
                  otherwise it's too soon and won't connect to the Peers */}
              <CameraPanel
                participants={participants}
                userId={userId}
                peerGroupId={roomId}
                iceServers={iceServers}
                aspectRatio={16 / 9}
              />
            </div>
          )}

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
            ref={tabsRef}
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
            onImport={(payload) => {
              // TODO: This is retarded - having to check and then send the exact same thing :)
              if (payload.type === 'FEN') {
                dispatchInputState({ type: 'import', payload });
              } else {
                dispatchInputState({ type: 'import', payload });
              }
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
            onQuickImport={(payload) => {
              dispatch({
                type: 'loadedChapter:import',
                payload,
              });
            }}
          />
        </div>
      }
    />
  );
};
