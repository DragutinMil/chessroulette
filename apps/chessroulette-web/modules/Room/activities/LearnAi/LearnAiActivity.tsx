import { useReducer, useRef, useEffect, useState } from 'react';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { ChessFENBoard, noop, swapColor } from '@xmatter/util-kit';
import { PanelResizeHandle } from 'react-resizable-panels';
import movexConfig from '@app/movex.config';
import { TabsRef } from '@app/components/Tabs';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { useLearnAiActivitySettings } from './hooks/useLearnAiActivitySettings';
import { getSubscribeInfo } from './util';
import { AiCouchDialogContainer } from './DialogContainer/AiCouchDialogContainer';
import { enqueueMovexUpdate } from './util';
import {
  LearnAiActivityState,
  findLoadedChapter,
  initialDefaultChapter,
  //chessAiMode,
  MovePiece,
  aiLearn,
} from './movex';
import { WidgetPanel } from './components/WidgetPanel';
import { LearnAiBoard } from './components/LearnAiBoard';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import inputReducer, { initialInputState } from './reducers/inputReducer';
import socketUtil from '../../../../socketUtil';

// import { InstructorBoard } from './components/InstructorBoard';
import { Square } from 'chess.js';
import { boolean } from 'zod';

type Props = {
  remoteState: LearnAiActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const LearnAiActivity = ({
  remoteState,
  dispatch: optionalDispatch,
}: Props) => {
  const moveSound = new Audio('/chessmove.mp3');
  const dispatch = optionalDispatch || noop;
  const [cameraOff, setCameraOff] = useState(false);
  const [newReview, setNewReview] = useState(true);
  const [playerNames, setPlayerNames] = useState(Array<string>);
  const [canFreePlay, setCanFreePlay] = useState(false);
  const [puzzleCounter, setPuzzleCounter] = useState(0);

  const [userData, setUserData] = useState({
    name_first: '',
    name_last: '',
    picture: '',
    is_trial: false,
    product_name: '',
    user_id: '',
  });
  // const [onChangePuzzleAnimation, setChangePuzzleAnimation] = useState(false);
  const settings = useLearnAiActivitySettings();
  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  const tabsRef = useRef<TabsRef>(null);
  useEffect(() => {
    socketUtil.connect('reviewing');
    localStorage.setItem('socket', 'reviewing');

    return () => {
      socketUtil.disconnect();
    };
  }, []);

  const historyBackToStart = async () => {
    setNewReview(true);
  };
  const getUserData = async () => {
    const data = await getSubscribeInfo();
    setUserData({
      name_first: data.name_first,
      name_last: data.name_last,
      picture: data.profile_image_url,
      is_trial: data.is_trial,
      product_name: data.product_name,
      user_id: data.user_id,
    });
  };
  const onCanPlayChange = (canPlay: boolean) => {
    setCanFreePlay(canPlay);
  };
  const handlePuzzleRequest = () => {
    setPuzzleCounter(puzzleCounter + 1);
  };

  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          {settings.isInstructor && inputState.isActive ? (
            ''
          ) : (
            // <InstructorBoard
            //   fen={inputState.chapterState.displayFen}
            //   boardOrientation={swapColor(inputState.chapterState.orientation)}
            //   boardSizePx={boardSize}
            //   onArrowsChange={(arrowsMap) => {
            //     dispatchInputState({
            //       type: 'updatePartialChapter',
            //       payload: { arrowsMap },
            //     });
            //   }}
            //   onCircleDraw={(payload) => {
            //     dispatchInputState({
            //       type: 'drawCircle',
            //       payload,
            //     });
            //   }}
            //   onClearCircles={() => {
            //     dispatchInputState({ type: 'clearCircles' });
            //   }}
            //   onFlipBoard={() => {
            //     dispatchInputState({
            //       type: 'updatePartialChapter',
            //       payload: {
            //         orientation: swapColor(inputState.chapterState.orientation),
            //       },
            //     });
            //   }}
            //   onUpdateFen={(fen) => {
            //     dispatchInputState({
            //       type: 'updateChapterFen',
            //       payload: { fen },
            //     });
            //   }}
            //   onToggleBoardEditor={() => {
            //     dispatchInputState({
            //       type: 'update',
            //       payload: { isBoardEditorShown: false },
            //     });
            //   }}
            //   onMove={noop}
            // />
            //  Learn Mode */}
            <div>
              <AiCouchDialogContainer
                onMessage={async (payload) =>
                  await enqueueMovexUpdate(() =>
                    dispatch({
                      type: 'loadedChapter:writeMessage',
                      payload: payload,
                    })
                  )
                }
                onPuzzleMove={async (payload) => {
                  moveSound.play();
                  await enqueueMovexUpdate(() =>
                    dispatch({ type: 'loadedChapter:addPuzzleMove', payload })
                  );
                }}
                // addChessAi={async (payload: chessAiMode) =>
                //   await enqueueMovexUpdate(() =>
                //     dispatch({
                //       type: 'loadedChapter:setPuzzleMoves',
                //       payload: payload as chessAiMode,
                //     })
                //   )
                // }
                newPuzzleRequest={handlePuzzleRequest}
                canFreePlay={canFreePlay}
                currentChapter={currentChapter}
              />
              <div>
                <LearnAiBoard
                  sizePx={boardSize}
                  // onChangePuzzleAnimation={onChangePuzzleAnimation}
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
                  onMove={async (payload) => {
                    moveSound.play();
                    await enqueueMovexUpdate(() =>
                      dispatch({ type: 'loadedChapter:addMove', payload })
                    );

                    // if (currentChapter.chessAiMode.mode === 'puzzle') {
                    //   await enqueueMovexUpdate(() =>
                    //     dispatch({
                    //       type: 'loadedChapter:addPuzzleMove',
                    //       payload,
                    //     })
                    //   );
                    // } else if (currentChapter.chessAiMode.mode === 'review') {
                    //   await enqueueMovexUpdate(() =>
                    //     dispatch({ type: 'loadedChapter:addMove', payload })
                    //   );
                    // } else if (
                    //   (currentChapter.notation.focusedIndex[0] !==
                    //     currentChapter.notation.history?.length - 1 ||
                    //     currentChapter.notation.focusedIndex[1] !==
                    //       currentChapter.notation.history[
                    //         currentChapter.notation.history.length - 1
                    //       ]?.length -
                    //         1) &&
                    //   currentChapter.notation.history.length !== 0
                    // ) {
                    //   return;
                    // } else {
                    //   await enqueueMovexUpdate(() =>
                    //     dispatch({ type: 'loadedChapter:addMove', payload })
                    //   );
                    // }

                    // TODO: This can be returned from a more internal component
                    return true;
                  }}
                  onArrowsChange={(payload) => {
                    // console.log('arrow karioka');
                    // dispatch({ type: 'loadedChapter:setArrows', payload });
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
            onTakeBack={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:takeBack',
                  payload,
                })
              );
            }}
            onMove={async (payload) => {
              moveSound.play();
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:addMove', payload })
              );
            }}
            // addChessAi={async (payload: chessAiMode) =>
            //   await enqueueMovexUpdate(() =>
            //     dispatch({
            //       type: 'loadedChapter:setPuzzleMoves',
            //       payload: payload as chessAiMode,
            //     })
            //   )
            // }
            onCircleDraw={async (tuple) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:drawCircle',
                  payload: tuple,
                })
              );
            }}
            onArrowsChange={async (payload) => {
              // console.log('payload arr', payload);
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:setArrows', payload })
              );
            }}
            onMessage={async (payload) =>
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:writeMessage', payload })
              )
            }
            onCanPlayChange={(payload) => onCanPlayChange(payload)}
            historyBackToStart={historyBackToStart}
            userData={userData}
            playerNames={playerNames}
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
            onHistoryNotationRefocus={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:focusHistoryIndex',
                  payload,
                })
              );
            }}
            onHistoryNotationDelete={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:deleteHistoryMove',
                  payload,
                })
              );
            }}
            addLearnAi={async (payload: aiLearn) =>
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setLearnAi',
                  payload: payload as aiLearn,
                })
              )
            }
            onImport={async (payload) => {
              // TODO: This is retarded - having to check and then send the exact same thing :)
              if (payload.type === 'FEN') {
                await enqueueMovexUpdate(() =>
                  dispatchInputState({ type: 'import', payload })
                );
              } else {
                await enqueueMovexUpdate(() =>
                  dispatchInputState({ type: 'import', payload })
                );
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
