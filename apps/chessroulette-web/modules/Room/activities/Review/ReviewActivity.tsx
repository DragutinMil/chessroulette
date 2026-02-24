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

import {
  ReviewActivityState,
  findLoadedChapter,
  initialDefaultChapter,
  chessAiMode,
  MovePiece,
} from './movex';

import { getMatch } from './util';
import { WidgetPanel } from './components/WidgetPanel';
import { ReviewBoard } from './components/ReviewBoard';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';
import inputReducer, { initialInputState } from './reducers/inputReducer';
import socketUtil from '../../../../socketUtil';

import { InstructorBoard } from './components/InstructorBoard';
import { Square } from 'chess.js';
import { boolean, number } from 'zod';

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
  const moveSound = new Audio('/chessmove.mp3');
  const dispatch = optionalDispatch || noop;
  const [cameraOff, setCameraOff] = useState(false);
  const [newReview, setNewReview] = useState(true);
  const [playerNames, setPlayerNames] = useState(Array<string>);
  const [canFreePlay, setCanFreePlay] = useState(false);
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
    socketUtil.connect('reviewing');
    localStorage.setItem('socket', 'reviewing');

    return () => {
      socketUtil.disconnect();
    };
  }, []);
  useEffect(() => {
    // console.log('currentChapter', currentChapter);

    if (newReview === false && currentChapter.chessAiMode.mode == 'review') {
      return;
    }
    const hasBranches = JSON.stringify(
      currentChapter.notation.history
    ).includes('branchedHistories');
    const hasIlegalMoves = JSON.stringify(
      currentChapter.notation.history
    ).includes('isNonMove');
    if (
      !hasBranches &&
      !hasIlegalMoves &&
      currentChapter.displayFen !==
        'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    ) {
      return;
    }
    //console.log('setNewReview2',newReview)
    const url = new URL(window.location.href);
    const rawPgn = url.searchParams.get('pgn');
    const userId = url.searchParams.get('userId');

    if (rawPgn) {
      const getMatchInfo = async () => {
        const data = await getMatch(rawPgn);

        const lastGame = data.results.endedGames.length - 1;
        if (data) {
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
          const changeOrientation =
            (currentChapter.orientation === 'b' && black) ||
            (currentChapter.orientation === 'w' && white);

          gameReview({
            moves: [],
            movesCount: 0,
            badMoves: 0,
            goodMoves: 0,
            orientationChange: changeOrientation,
            mode: 'review',
            ratingChange: 0,
            puzzleRatting: 0,
            userPuzzleRating: 0,
            puzzleId: 0,
            prevUserPuzzleRating: 0,
            fen: pgn,
            responseId: '',
            message: '',
          });
          setNewReview(false);
        }
      };
      getMatchInfo();
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

  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <>
          {settings.isInstructor && inputState.isActive ? (
            ''
          ) : (
            <div>
              <ReviewDialogContainer currentChapter={currentChapter} />
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
                    moveSound.play();

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
            addGameEvaluation={async (payload) => {
              // console.log('evaluacija', payload);
              // await enqueueMovexUpdate(() =>
              //   dispatch({ type: 'loadedChapter:gameEvaluation', payload })
              // );
            }}
            onMove={async (payload) => {
              moveSound.play();
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:addMove', payload })
              );
            }}
            onPuzzleMove={async (payload) => {
              moveSound.play();
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:addPuzzleMove', payload })
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
