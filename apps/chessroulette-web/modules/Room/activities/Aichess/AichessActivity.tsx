import { useReducer, useRef, useEffect, useState } from 'react';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { ChessFENBoard, noop, swapColor } from '@xmatter/util-kit';
import { PanelResizeHandle } from 'react-resizable-panels';
import movexConfig from '@app/movex.config';
import { TabsRef } from '@app/components/Tabs';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { useAichessActivitySettings } from './hooks/useAichessActivitySettings';

import { AiChessDialogContainer } from './DialogContainer/AiChessDialogContainer';
import {
  AichessActivityState,
  findLoadedChapter,
  initialDefaultChapter,
  chessAiMode,
  MovePiece,
} from './movex';
import { WidgetPanel } from './components/WidgetPanel';
import { AichessBoard } from './components/AichessBoard';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import inputReducer, { initialInputState } from './reducers/inputReducer';

import { InstructorBoard } from './components/InstructorBoard';
import { Square } from 'chess.js';

type Props = {
  remoteState: AichessActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const AichessActivity = ({
  remoteState,
  dispatch: optionalDispatch,
}: Props) => {
  const moveSound = new Audio('/chessmove.mp3');
  const dispatch = optionalDispatch || noop;
  const [cameraOff, setCameraOff] = useState(false);
  const settings = useAichessActivitySettings();
  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  const tabsRef = useRef<TabsRef>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const rawPgn = url.searchParams.get('pgn');
    if (rawPgn) {
      setCameraOff(true);
    }
  }, []);
  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          {settings.isInstructor && inputState.isActive ? (
            <InstructorBoard
              fen={inputState.chapterState.displayFen}
              boardOrientation={swapColor(inputState.chapterState.orientation)}
              boardSizePx={boardSize}
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
                    orientation: swapColor(inputState.chapterState.orientation),
                  },
                });
              }}
              onUpdateFen={(fen) => {
                dispatchInputState({
                  type: 'updateChapterFen',
                  payload: { fen },
                });
              }}
              onToggleBoardEditor={() => {
                dispatchInputState({
                  type: 'update',
                  payload: { isBoardEditorShown: false },
                });
              }}
              // TODO: This was added now, bt I'm wondering how till the pieces move if it's nothing??
              onMove={noop}
            />
          ) : (
            // Learn Mode

            <div>
              <AiChessDialogContainer
              onPuzzleMove={(payload) => {
                moveSound.play();
              dispatch({ type: 'loadedChapter:addMove', payload });
              
            }}
              addChessAi={(payload: chessAiMode) =>
              dispatch({
                type: 'loadedChapter:setPuzzleMoves',
                payload: payload as chessAiMode,
              })
            }
             onQuickImport={(input) => {
              dispatch({
                type: 'loadedChapter:import',
                payload: { input },
              });
            }}
              currentChapter={currentChapter}  />

              <AichessBoard
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
                    payload: { color: swapColor(currentChapter.orientation) },
                  });
                }}
                onMove={(payload) => {
                    moveSound.play();
                  dispatch({ type: 'loadedChapter:addMove', payload });
                
                  // TODO: This can be returned from a more internal component
                  return true;
                }}
                onArrowsChange={(payload) => {
                  console.log('arrow', payload);
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
            </div>
          )}
        </>
      )}
      rightComponent={
        <div className="flex flex-col flex-1 min-h-0 gap-4max-h-screen ">
          {/* <div className="overflow-hidden  rounded-lg shadow-2xl mb-4">
            <img
              src="https://outpostchess.fra1.digitaloceanspaces.com/bfce3526-2133-4ac5-8b16-9c377529f0b6.jpg"
              alt=""
            />
          </div> */}
          {inputState.isActive && (
            <div className="flex gap-2">
              <span className="capitalize">Editing</span>
              <span className="font-bold">
                "{inputState.chapterState.name}"
              </span>
            </div>
          )}
          <WidgetPanel
            onTakeBack={(payload) => {
              dispatch({
                type: 'loadedChapter:takeBack',
                payload,
              });
            }}
            addGameEvaluation={(payload) => {
              dispatch({ type: 'loadedChapter:gameEvaluation', payload });
            }}
            onPuzzleMove={(payload) => {
               moveSound.play();
              dispatch({ type: 'loadedChapter:addMove', payload });
             
              
            }}
            addChessAi={(payload: chessAiMode) =>
              dispatch({
                type: 'loadedChapter:setPuzzleMoves',
                payload: payload as chessAiMode,
              })
            }
            onCircleDraw={(tuple) => {
              dispatch({
                type: 'loadedChapter:drawCircle',
                payload: tuple,
              });
            }}
            onArrowsChange={(payload) => {
              dispatch({ type: 'loadedChapter:setArrows', payload });
            }}
            onMessage={(payload) =>
              dispatch({
                type: 'loadedChapter:writeMessage',
                payload: payload,
              })
            }
            puzzleOrientation={() =>
              dispatch({
                type: 'loadedChapter:setOrientation',
                payload: { color: swapColor(currentChapter.orientation) },
              })
            }
            currentChapterState={currentChapter}
            chaptersMap={remoteState?.chaptersMap || {}}
            inputModeState={inputState}
            chaptersMapIndex={remoteState?.chaptersIndex || 0}
            currentLoadedChapterId={remoteState?.loadedChapterId}
            ref={tabsRef}
            isInstructor={settings.isInstructor}
            showEngine={settings.showEngine}
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
            onQuickImport={(input) => {
              dispatch({
                type: 'loadedChapter:import',
                payload: { input },
              });
            }}
          />
        </div>
      }
    />
  );
};
