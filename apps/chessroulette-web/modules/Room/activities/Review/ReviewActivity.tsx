import { useReducer, useRef, useEffect, useState } from 'react';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { ChessFENBoard, noop, swapColor } from '@xmatter/util-kit';
import { PanelResizeHandle } from 'react-resizable-panels';
import movexConfig from '@app/movex.config';
import { TabsRef } from '@app/components/Tabs';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { useReviewActivitySettings } from './hooks/useReviewActivitySettings';
import { getSubscribeInfo } from './util';
import { ReviewDialogContainer } from './DialogContainer/ReviewDialogContainer';
import { enqueueMovexUpdate } from './util';
import { IconButton } from '@app/components/Button';
import { InstructorBoard } from './components/InstructorBoard';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import {
  ReviewActivityState,
  findLoadedChapter,
  initialDefaultChapter,
  chessAiMode,
  EvaluationMove,
} from './movex';

import { getMatch, getMovexRoom } from './util';
import { WidgetPanel } from './components/WidgetPanel';
import { ReviewBoard } from './components/ReviewBoard';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import inputReducer, { initialInputState } from './reducers/inputReducer';
import socketUtil from '../../../../socketUtil';

type Props = {
  remoteState: ReviewActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const ReviewActivity = ({
  remoteState,
  dispatch: optionalDispatch,
}: Props) => {
  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  if (!moveSoundRef.current) {
    moveSoundRef.current = new Audio('/chessmove.mp3');
  }
  const dispatch = optionalDispatch || noop;
  const [newReview, setNewReview] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [playerNames, setPlayerNames] = useState(Array<string>);
  const [canFreePlay, setCanFreePlay] = useState(false);
  const [isFocusedInput, setIsFocusedInput] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [reviewDataToNotation, setReviewDataToNotation] = useState<
    EvaluationMove[]
  >([]);
  const [userData, setUserData] = useState({
    name_first: '',
    name_last: '',
    picture: '',
    is_trial: false,
    product_name: '',
    user_id: '',
    puz_rating: '',
  });
  // const [onChangePuzzleAnimation, setChangePuzzleAnimation] = useState(false);
  const settings = useReviewActivitySettings();
  const [inputState, dispatchInputState] = useReducer(
    inputReducer,
    initialInputState
  );

  const gameReview = (payload: chessAiMode) => {
    dispatch({
      type: 'loadedChapter:setReview',
      payload: payload as chessAiMode,
    });
  };
  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;

  const tabsRef = useRef<TabsRef>(null);
  useEffect(() => {
    // socketUtil.connect('reviewing');
    // localStorage.setItem('socket', 'reviewing');

    return () => {
      socketUtil.disconnect();
    };
  }, []);
  useEffect(() => {
    isMobile && setReviewDataToNotation(currentChapter.chessAiMode.review);
  }, [currentChapter.chessAiMode.review]);

  useEffect(() => {
    if (newReview === false) {
      return;
    }
    const url = new URL(window.location.href);
    const matchId = url.searchParams.get('pgn');
    const userId = url.searchParams.get('userId');

    if (matchId) {
      setIsLoading(true);
      // Shared flag — whichever path fires gameReview first sets this to true
      const reviewCalled = { current: false };

      // Fast path: movex (open API, no auth, usually instant)
      const getMovexInfo = async (): Promise<void> => {
        if (reviewCalled.current) {
          return;
        }

        const data = await getMovexRoom(matchId);
        if (!data) return;
        // Adjust this path to match the actual movex response envelope if needed
        const state = data?.state[0].activity.activityState;

        const lastGame = state.endedGames.length - 1;
        const pgn = state.endedGames[lastGame].pgn;
        console.log('pgn', pgn);
        const white = state.endedGames[lastGame].players.w == userId;
        const black = state.endedGames[lastGame].players.b == userId;

        if (!pgn || reviewCalled.current) return;
        const opponentColor = white ? 'black' : 'white';
        const changeOrientation =
          (currentChapter.orientation === 'b' && black) ||
          (currentChapter.orientation === 'w' && white);

        reviewCalled.current = true;
        gameReview({
          ...currentChapter.chessAiMode,
          orientationChange: changeOrientation,
          mode: 'review',
          fen: pgn,
          originalPGN: pgn,
          opponentName: '',
          opponentColor: opponentColor,
          responseId: '',
          message: '',
        });
        setIsLoading(false);
        setNewReview(false);
      };

      // Slow path: our backend with retries (authoritative — has player names)
      const getMatchInfo = async (): Promise<void> => {
        let data = null;

        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            data = await getMatch(matchId);
          } catch (e) {
            data = null;
          }

          if (data?.results?.endedGames) break;

          if (attempt === 1) {
            await new Promise((res) => setTimeout(res, 1000));
          } else if (attempt === 2) {
            await new Promise((res) => setTimeout(res, 3000));
          } else if (attempt === 3) {
            await new Promise((res) => setTimeout(res, 5000));
          } else if (attempt === 4) {
            await new Promise((res) => setTimeout(res, 10000));
          }
        }

        if (!data) return;

        const lastGame = data.results.endedGames.length - 1;
        const pgn = data.results.endedGames[lastGame].pgn;
        const white = data.results.endedGames[lastGame].players.w == userId;
        const black = data.results.endedGames[lastGame].players.b == userId;

        const whitePlayerName =
          data.results.endedGames[lastGame].players.w == data.initiator_id
            ? data.initiator_name_first
            : data.target_name_first;
        const blackPlayerName =
          data.results.endedGames[lastGame].players.b == data.initiator_id
            ? data.initiator_name_first
            : data.target_name_first;

        setPlayerNames([whitePlayerName, blackPlayerName]);

        // Movex already fired gameReview — just updating player names above is enough
        if (reviewCalled.current) return;

        const opponentName = white ? blackPlayerName : whitePlayerName;
        const opponentColor = white ? 'black' : 'white';
        const changeOrientation =
          (currentChapter.orientation === 'b' && black) ||
          (currentChapter.orientation === 'w' && white);

        reviewCalled.current = true;
        gameReview({
          ...currentChapter.chessAiMode,
          orientationChange: changeOrientation,
          mode: 'review',
          fen: pgn,
          originalPGN: pgn,
          opponentName: opponentName,
          opponentColor: opponentColor,
          responseId: '',
          message: '',
        });
        setIsLoading(false);
        setNewReview(false);
      };

      // Run both concurrently; hide loader when both settle (covers the case where neither has data)
      Promise.allSettled([getMovexInfo(), getMatchInfo()]).then(() => {
        setIsLoading(false);
      });
    }

    getUserData();
  }, [newReview == true]);

  const historyBackToStart = async () => {
    setNewReview(true);
  };
  const getUserData = async () => {
    const data = await getSubscribeInfo();
    setUserData({
      name_first: data?.name_first,
      name_last: data?.name_last,
      picture: data?.profile_image_url,
      is_trial: data?.is_trial,
      product_name: data?.product_name,
      user_id: data?.user_id,
      puz_rating: data?.puz_rating,
    });
  };
  const onCanPlayChange = (canPlay: boolean) => {
    setCanFreePlay(canPlay);
  };

  const onHistoryNotationRefocus = async (payload: any) => {
    await enqueueMovexUpdate(() =>
      dispatch({
        type: 'loadedChapter:focusHistoryIndex',
        payload,
      })
    );
  };
  const onHistoryNotationDelete = async (payload: any) => {
    await enqueueMovexUpdate(() =>
      dispatch({
        type: 'loadedChapter:deleteHistoryMove',
        payload,
      })
    );
  };

  return (
    <ResizableDesktopLayout
      mobileScrollable
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          {settings.isInstructor && inputState.isActive ? (
            ''
          ) : (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/70 rounded-lg">
                  <div className="w-10 h-10 border-4 border-slate-500 border-t-white rounded-full animate-spin" />
                </div>
              )}
              <ReviewDialogContainer currentChapter={currentChapter} />

              {isMobile && (
                <div
                  style={{
                    height: '50px',
                    minHeight: '50px',
                  }}
                  className="flex overflow-x-auto rounded-lg p-2"
                >
                  <FreeBoardNotation
                    reviewDataToNotation={reviewDataToNotation}
                    isMobile={isMobile}
                    history={currentChapter.notation?.history}
                    // playerNames={playerNames}
                    isAichess={true}
                    focusedIndex={currentChapter.notation?.focusedIndex}
                    onDelete={onHistoryNotationDelete}
                    onRefocus={onHistoryNotationRefocus}
                    isFocusedInput={isFocusedInput}
                  />
                </div>
              )}

              <div>
                <ReviewBoard
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
                  onMove={async (payload) => {
                    moveSoundRef.current?.play();

                    if (currentChapter.chessAiMode.mode === 'review') {
                      await enqueueMovexUpdate(() =>
                        dispatch({ type: 'loadedChapter:addMove', payload })
                      );
                    } else if (
                      (currentChapter.notation.focusedIndex[0] !==
                        currentChapter.notation.history?.length - 1 ||
                        currentChapter.notation.focusedIndex[1] !==
                          currentChapter.notation.history[
                            currentChapter.notation.history.length - 1
                          ]?.length -
                            1) &&
                      currentChapter.notation.history.length !== 0
                    ) {
                      return;
                    } else {
                      await enqueueMovexUpdate(() =>
                        dispatch({ type: 'loadedChapter:addMove', payload })
                      );
                    }

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
                            dispatch({
                              type: 'loadedChapter:setOrientation',
                              payload: {
                                color: swapColor(currentChapter.orientation),
                              },
                            });
                          }}
                        />
                      </div>

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
        <div className="flex flex-col flex-1 min-h-0 gap-4 max-h-screen">
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
            addGameEvaluation={async (payload) => {
              // console.log('evaluacija', payload);
              // await enqueueMovexUpdate(() =>
              //   dispatch({ type: 'loadedChapter:gameEvaluation', payload })
              // );
            }}
            onMove={async (payload) => {
              moveSoundRef.current?.play();
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:addMove', payload })
              );
            }}
            addChessAi={async (payload: chessAiMode) =>
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setReview',
                  payload: payload as chessAiMode,
                })
              )
            }
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
            onMatchReview={(payload) =>
              dispatch({
                type: 'loadedChapter:addReview',
                payload,
              })
            }
            resetMessages={async () =>
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:eraseMessages' })
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
            onChangePosition={async (input) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:changePosition',
                  payload: { input },
                })
              );
            }}
            onMessage={async (payload) =>
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:writeMessage', payload })
              )
            }
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
