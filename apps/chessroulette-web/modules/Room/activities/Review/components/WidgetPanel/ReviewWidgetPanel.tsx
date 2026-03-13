import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { ChessFENBoard, isValidPgn } from '@xmatter/util-kit';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { Tabs, TabsRef } from '@app/components/Tabs';
import type {
  Chapter,
  ChapterState,
  MovePiece,
  chessAiMode,
  Message,
  UserData,
  EvaluationMove,
} from '../../movex/types';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
import ConversationReview from './GameReview/ConversationReview';

import { Square, Chess } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { analyzePGN } from '@app/modules/ChessEngine/ChessEngineReviewMatch';
import { ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';

import { SendQuestionReview } from './GameReview/SendQuestionReview';
import { CheckPiece } from './CheckPiece';
import { ChessEngineProbabilityCalc } from '@app/modules/ChessEngine/components/ChessEngineCalculator';

import { reviewAnalitics } from '../../util';

// import { generateGptResponse } from '../../../../../../server.js';
type StockfishLines = {
  1: string;
  2: string;
  3: string;
};

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;
  onPuzzleMove: (move: MovePiece) => void;
  onMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  playerNames: Array<string>;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  addGameEvaluation: (score: number) => void;
  historyBackToStart: () => void;
  onCanPlayChange: (canPlay: boolean) => void;
  userData: UserData;

  // Engine
  showEngine?: boolean;
  // engine?: EngineData;
} & Pick<
  ChaptersTabProps,
  | 'onLoadChapter'
  | 'onCreateChapter'
  | 'onDeleteChapter'
  | 'onUpdateChapter'
  | 'onUpdateInputModeState'
  | 'inputModeState'
  | 'onActivateInputMode'
  | 'onDeactivateInputMode'
  | 'currentLoadedChapterId'
>;

export const ReviewWidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      // engine,
      onCanPlayChange,
      playerNames,
      showEngine,
      onImport,
      onTakeBack,
      onCircleDraw,
      onArrowsChange,
      onPuzzleMove,
      onMove,
      addChessAi,
      onMessage,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      addGameEvaluation,
      historyBackToStart,
      userData,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const [pulseDot, setPulseDot] = useState(false);
    const [hintCircle, setHintCircle] = useState(false);
    const [isFocusedInput, setIsFocusedInput] = useState(false);
    const [question, setQuestion] = useState('');
    const [timeoutEnginePlay, setTimeoutEnginePlay] = useState(false);
    const [takeBakeShake, setTakeBakeShake] = useState(false);
    const [progressReview, setProgressReview] = useState(0);
    const [reviewData, setReviewData] = useState<EvaluationMove[]>([]);
    const [scoreCP, setScoreCP] = useState(0);
    const [prevScoreCP, setprevScoreCP] = useState(0);

    const smallMobile =
      typeof window !== 'undefined' && window.innerWidth < 400;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const [newRatingEngine, setRatingBotEngine] = useState(
      isMobile ? 1999 : 2099
    );
    const [currentRatingEngine, setCurrentRatingEngine] = useState<
      number | null
    >(null);
    const [stockfish, setStockfish] = useState(false);

    const [percentW, setPercentW] = useState(50);
    const [percentB, setPercentB] = useState(50);

    const [moveSan, setMoveSan] = useState('');
    const [stockfishMovesInfo, setStockfishMovesInfo] = useState('');
    const [lines, setLines] = useState<StockfishLines>({
      1: '',
      2: '',
      3: '',
    });

    const currentTabIndex = useMemo(
      () => widgetPanelTabsNav.getCurrentTabIndex(),
      [widgetPanelTabsNav.getCurrentTabIndex]
    );

    const onTabChange = useCallback(
      (p: { tabIndex: number }) => {
        widgetPanelTabsNav.setTabIndex(p.tabIndex);
      },
      [widgetPanelTabsNav.setTabIndex]
    );
    const isMyTurn =
      currentChapterState.displayFen.split(' ')[1] ===
      currentChapterState.orientation;

    const checkAnswerGPT = async (data: any) => {
      if (data == 'ai_daily_limit_reached') {
        setPulseDot(false);
        onMessage({
          content: `You’ve hit your daily limit.
Unlock Unlimited Puzzles, Unlimited Game Reviews, and Unlimited AI Chat for just €4,  and improve faster with AI-powered analysis and training.`,

          participantId: 'chatGPT123456sales',
          idResponse: '',
        });
      } else if (
        currentChapterState.messages[
          currentChapterState?.messages?.length - 1
        ]?.participantId.includes('sales')
      ) {
        onMessage({
          content: data.answer.text,
          participantId: 'chatGPT123456sales',
          idResponse: data.id,
        });
      } else {
        onMessage({
          content: data.answer.text,
          participantId: 'chatGPT123456',
          idResponse: data.id,
        });
      }
    };

    const addQuestion = async (question: string) => {
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');
      const lastIdResponse =
        currentChapterState.messages.length > 0
          ? currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse || ''
          : '';
      if (userId) {
        onMessage({
          content: question,
          participantId: userId,
          idResponse: lastIdResponse,
        });
      }
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 500);

      const data = await SendQuestionReview(
        question,
        currentChapterState,
        reviewData,
        moveSan
      );

      if (data) {
        setPulseDot(false);
      }
      checkAnswerGPT(data);
    };

    useEffect(() => {
      setReviewData([]);
    }, [currentChapterState.chessAiMode.fen]);

    useEffect(() => {
      if (prevScoreCP !== 0) {
        const probability = async () => {
          const ProbabilityChange = await ChessEngineProbabilityCalc(
            scoreCP,
            prevScoreCP
          );
          if (currentChapterState.orientation == 'w') {
            setPercentW(ProbabilityChange.newPercentage);
            setPercentB(100 - ProbabilityChange.newPercentage);
          } else {
            setPercentB(ProbabilityChange.newPercentage);
            setPercentW(100 - ProbabilityChange.newPercentage);
          }
        };
        probability();
      }
    }, [scoreCP]);

    useEffect(() => {
      if (currentChapterState.chessAiMode.mode == 'review' && !stockfish) {
        setTimeout(() => setStockfish(true), 1000);
      }
    }, [currentChapterState.chessAiMode.mode]);

    const isMate = async () => {
      setStockfishMovesInfo('no best moves,game is ended by checkmate');
      if (currentChapterState.chessAiMode.mode == 'play') {
        setTimeout(
          () =>
            addChessAi({
              mode: 'checkmate',
              moves: currentChapterState.chessAiMode.moves,
              movesCount: 0,
              badMoves: 0,
              goodMoves: 0,
              orientationChange: false,
              puzzleRatting: 0,
              userPuzzleRating:
                currentChapterState.chessAiMode.userPuzzleRating,
              ratingChange: 0,
              puzzleId: 0,
              prevUserPuzzleRating:
                currentChapterState.chessAiMode.prevUserPuzzleRating,
              fen: currentChapterState.displayFen,
              responseId: '',
              message: '',
            }),
          1000
        );
      }
    };

    const ratingEngine = (rating: number) => {
      setCurrentRatingEngine(rating);
    };
    const engineMove = (m: any, n?: boolean) => {
      //if engine dont have move, play mod is disabled
      if (m === '(none)') {
        onCanPlayChange(false);
      } else {
        onCanPlayChange(true);
      }

      setStockfishMovesInfo(m);
      let fromChess = m.slice(0, 2);
      let toChess = m.slice(2, 4);

      if (
        fromChess &&
        toChess &&
        currentChapterState.chessAiMode.mode === 'review'
      ) {
        try {
          const chess = new Chess(currentChapterState.displayFen);
          const move = chess.move({ from: fromChess, to: toChess });

          if (move) {
            setMoveSan(move.san);
            if (reviewData.length > 0) {
              const index =
                currentChapterState.notation.focusedIndex[0] * 2 +
                currentChapterState.notation.focusedIndex[1] -
                1;
              const whiteMove = index % 2 !== 0 ? true : false;

              if (
                (Number(reviewData[index + 1].diff) > 0.7 && !whiteMove) ||
                (Number(reviewData[index + 1].diff) < -0.7 && whiteMove)
              ) {
                const color = '#07da63';
                const colorBlunder = '#f2358d';

                const from = reviewData[index].topMove[0];
                const to = reviewData[index].topMove[1];
                const fromBlunder = reviewData[index + 1].moveLan[0];
                const toBlunder = reviewData[index + 1].moveLan[1];
                const arrowId = `${from}${to}-${color}`;
                const arrowIdBlunder = `${fromBlunder}${toBlunder}-${colorBlunder}`;
                onArrowsChange({
                  [arrowId]: [from as Square, to as Square],
                  [arrowIdBlunder]: [
                    fromBlunder as Square,
                    toBlunder as Square,
                  ],
                });
              } else if (currentChapterState.arrowsMap) {
                onArrowsChange({});
              }
            }
          }
        } catch (e) {
          // Potez nije validan, ne radi ništa
          //  console.warn('Invalid move, ignoring', { fromChess, toChess });
        }
      }

      if (currentChapterState.notation.history.length > 0) {
        if (
          currentChapterState.notation.focusedIndex[0] !==
            currentChapterState.notation.history?.length - 1 ||
          currentChapterState.notation.focusedIndex[1] !==
            currentChapterState.notation.history[
              currentChapterState.notation.history.length - 1
            ]?.length -
              1
        ) {
          return;
        }
      }
      if (m.length == 0 || currentChapterState.chessAiMode.mode == 'review') {
        return;
      }
    };
    const engineLines = (m: StockfishLines) => {
      setLines(m);
    };

    const openViewSubscription = async () => {
      // setPopupSubscribe(true);
      (window.location.href = 'https://app.outpostchess.com/subscribe'),
        '_self';
    };

    const analizeMatch = async () => {
      historyBackToStart();
      setPulseDot(true);
      const data = await analyzePGN(
        currentChapterState.chessAiMode.fen,
        {
          onProgress: (progress: number) => setProgressReview(progress),
        },
        isMobile
      );
      // console.log('dats', data);

      setReviewData(data);
      if (data) {
        setPulseDot(false);
        setProgressReview(0);
      }

      const analiticsReview = reviewAnalitics(data);

      if (!currentChapterState.messages[1]?.content.includes('analyzeReview')) {
        onMessage({
          content: analiticsReview + '/analyzeReview',
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
      }
    };
    const handleGameEvaluation = (newScore: number) => {
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
    };

    return (
      <div className="  flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
        {stockfish && (
          <StockFishEngineAI
            ratingEngine={ratingEngine}
            newRatingEngine={newRatingEngine}
            fen={currentChapterState.displayFen}
            orientation={currentChapterState.orientation}
            engineLines={engineLines}
            IsMate={isMate}
            isMobile={isMobile}
            isMyTurn={isMyTurn}
            engineMove={engineMove}
            addGameEvaluation={handleGameEvaluation}
          />
        )}

        <Tabs
          containerClassName=" flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl "
          headerContainerClassName="flex gap-3"
          contentClassName="flex-1 flex min-h-0"
          currentIndex={currentTabIndex}
          onTabChange={onTabChange}
          ref={tabsRef}
          tabs={[
            {
              id: 'notation',
              renderHeader: (p) => (
                <div></div>
                // <Button
                //   onClick={() => {
                //     p.focus();
                //     chaptersTabProps.onDeactivateInputMode();
                //   }}
                //   size="sm"
                //   className={` font-bold bg-slate-900`}
                // >
                //   {/* Notation */}
                // </Button>
              ),
              renderContent: () => (
                <div className="flex flex-col flex-1 gap-2 min-h-0 overflow-scroll no-scrollbar pb-16 md:pb-0">
                  {isMobile && (
                    <div
                      style={{
                        backgroundImage:
                          'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)',
                        height: isMobile ? '52px' : '290px',
                        minHeight: isMobile ? '52px' : '202px',
                      }}
                      className={`
                      ${
                        currentChapterState.chessAiMode.mode === 'review'
                          ? 'block'
                          : 'hidden'
                      }  
                      
                     overflow-x-auto md:overflow-x-hidden  md:flex rounded-lg md:mb-0  border border-conversation-100 md:p-4 p-2 
                    `}
                    >
                      <FreeBoardNotation
                        reviewData={reviewData}
                        isMobile={isMobile}
                        history={currentChapterState.notation?.history}
                        playerNames={playerNames}
                        isAichess={true}
                        focusedIndex={
                          currentChapterState.notation?.focusedIndex
                        }
                        onDelete={onHistoryNotationDelete}
                        onRefocus={onHistoryNotationRefocus}
                        isFocusedInput={isFocusedInput}
                      />
                    </div>
                  )}
                  <div
                    className={`flex-1 justify-between flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-4 md:pb-4 rounded-lg 
                     
                  ${isMobile ? 'mb-2' : ''}  
                  `}
                  >
                    <div>
                      <ConversationReview
                        analizeMatch={analizeMatch}
                        openViewSubscription={openViewSubscription}
                        smallMobile={smallMobile}
                        progressReview={progressReview}
                        currentChapterState={currentChapterState}
                        pulseDot={pulseDot}
                        userData={userData}
                      />

                      <div className="mt-auto flex md:my-[20px]  items-center gap-3 mt-3 my-[14px]">
                        {currentChapterState.chessAiMode.fen !== '' &&
                          reviewData.length == 0 &&
                          currentChapterState.messages.length > 1 && (
                            <ButtonGreen
                              onClick={() => {
                                analizeMatch();
                              }}
                              disabled={pulseDot || progressReview > 0}
                              size="sm"
                              className="bg-green-600 text-black"
                              style={{ color: 'black' }}
                            >
                              <p>Game Review</p>
                            </ButtonGreen>
                          )}
                      </div>
                    </div>

                    {(currentChapterState.chessAiMode.mode !== 'review' ||
                      reviewData?.length !== 0 ||
                      currentChapterState.chessAiMode.fen == '') && (
                      //  &&
                      // (!currentChapterState.messages[
                      //   currentChapterState.messages.length - 1
                      // ]?.participantId.includes('sales') ||
                      //   (currentChapterState.messages[
                      //     currentChapterState.messages.length - 1
                      //   ]?.participantId.includes('sales') &&
                      //     currentChapterState.chessAiMode.mode ==
                      //       'review'))
                      <div className="flex mb-2 mt-2 md:mt-0">
                        <input
                          id="title"
                          type="text"
                          name="tags"
                          placeholder="Start chessiness..."
                          value={question}
                          style={{
                            boxShadow: '0px 0px 10px 0px #07DA6380',
                          }}
                          // className="w-full my-2 text-sm rounded-md border-slate-500 focus:border-slate-400 border border-transparent block bg-slate-600 text-white block py-1 px-2"
                          className="w-full text-sm rounded-[20px] border  border-conversation-100 bg-[#111111]/40 text-white 
                        placeholder-slate-400 px-4 py-2  transition-colors duration-200 focus:outline-none 
                        focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
                          onChange={(e) => {
                            setQuestion(e.target.value);
                          }}
                          onFocus={() => setIsFocusedInput(true)}
                          onBlur={() => setIsFocusedInput(false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              //e.preventDefault(); // sprečava novi red ako koristiš textarea
                              addQuestion(question);
                            }
                          }}
                        />
                        <ButtonGreen
                          size="md"
                          onClick={() => {
                            if (question.trim() !== '') {
                              addQuestion(question);
                            }
                          }}
                          disabled={question.trim() == ''}
                          icon="PaperAirplaneIcon"
                          className="ml-2 px-4 py-2 
                          duration-200"
                        ></ButtonGreen>
                      </div>
                    )}

                    {currentChapterState.chessAiMode.mode == 'review' && (
                      <div className="md:h-16 h-8">
                        <div className="w-full mt-1 h-4 md:flex hidden overflow-hidden rounded mt-4 ">
                          <div
                            className={`bg-white transition-all duration-500`}
                            style={{ width: `${percentW}%` }}
                          ></div>
                          <div
                            className={`bg-[#000000] transition-all duration-500`}
                            style={{ width: `${percentB}%` }}
                          ></div>
                        </div>

                        {scoreCP !== 0 && (
                          <div className={` flex  items-center mt-2 `}>
                            {scoreCP < 49999 &&
                              scoreCP > -49999 &&
                              (currentChapterState.orientation == 'b' ? (
                                <p className={'font-bold '}>
                                  {' '}
                                  {(scoreCP / 100) * -1}
                                </p>
                              ) : (
                                <p className={'font-bold '}> {scoreCP / 100}</p>
                              ))}
                            &nbsp;&nbsp;{' '}
                            <p className={'text-sm  '}>
                              {' '}
                              Best Move: {moveSan}{' '}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isMobile && (
                    <div
                      style={{
                        backgroundImage:
                          'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)',
                        height: isMobile ? '52px' : '290px',
                        minHeight: isMobile ? '52px' : '202px',
                      }}
                      className={`
                      ${
                        currentChapterState.chessAiMode.mode === 'review'
                          ? 'block'
                          : 'hidden'
                      }  
                      
                     overflow-x-auto md:overflow-x-hidden  md:flex rounded-lg md:mb-0 mb-4 border border-conversation-100 md:p-4 p-2 overflow-scroll no-scrollbar 
                    `}
                    >
                      <FreeBoardNotation
                        reviewData={reviewData}
                        isMobile={isMobile}
                        history={currentChapterState.notation?.history}
                        playerNames={playerNames}
                        isAichess={true}
                        focusedIndex={
                          currentChapterState.notation?.focusedIndex
                        }
                        onDelete={onHistoryNotationDelete}
                        onRefocus={onHistoryNotationRefocus}
                        isFocusedInput={isFocusedInput}
                      />
                    </div>
                  )}
                  {currentChapterState.chessAiMode.mode == 'review' && (
                    <div className="md:flex hidden items-center overflow-x-hidden gap-3 h-[55px] ">
                      <label className="font-bold text-sm  text-gray-400">
                        Import
                      </label>
                      <PgnInputBox
                        compact
                        containerClassName="flex-1"
                        onChange={onImport}
                      />
                    </div>
                  )}

                  {/* <FenPreview fen={currentChapterState.displayFen} /> */}
                </div>
              ),
            },
          ]}
        />
      </div>
    );
  }
);
