import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

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
import { slicePgn } from './GameReview/slicePgn';
import Loader from './Loader';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
import ConversationReview from './GameReview/ConversationReview';

import { Square, Chess } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import {
  analyzePGN,
  reviewMetrics,
} from '@app/modules/ChessEngine/ChessEngineReviewMatch';
import { ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';

import { SendQuestionReview } from './GameReview/SendQuestionReview';
import { CheckPiece } from './CheckPiece';
import { ChessEngineProbabilityCalc } from '@app/modules/ChessEngine/components/ChessEngineCalculator';

import {
  reviewAnalitics,
  getReview24h,
  getCompletedGames,
  uciLineToSan,
} from '../../util';
import type { CompletedGameItem } from '../../util';
import { useIsTablet } from '@app/hooks/useIsTablet';
import { ChessFENBoard } from '@xmatter/util-kit';

// import { generateGptResponse } from '../../../../../../server.js';
type StockfishLine = { moves: string; score: number };
type StockfishLines = {
  1: StockfishLine;
  2: StockfishLine;
  3: StockfishLine;
};

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;
  onMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  onMatchReview: (payload: {
    evaluation: EvaluationMove[];
    message: Message;
  }) => void;
  resetMessages: () => void;
  playerNames: Array<string>;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onChangePosition: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  addGameEvaluation: (score: number) => void;
  historyBackToStart: () => void;
  onCanPlayChange: (canPlay: boolean) => void;
  userData: UserData;
  onLinesChange?: (lines: { san: string; score: number }[]) => void;
  onComputingChange?: (isComputing: boolean) => void;

  onSetStartPosition: () => void;
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
      onMove,
      addChessAi,
      onMessage,
      resetMessages,
      onQuickImport,
      onChangePosition,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      addGameEvaluation,
      historyBackToStart,
      userData,
      onMatchReview,
      onSetStartPosition,
      onLinesChange,
      onComputingChange,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const [isOutpostWebViewAndroid, setIsOutpostWebViewAndroid] =
      useState(false);
    const [isOutpostWebViewIos, setIsOutpostWebViewIos] = useState(false);
    useEffect(() => {
      setIsOutpostWebViewAndroid(
        navigator.userAgent?.includes('OutpostChessApp/android')
      );
      setIsOutpostWebViewIos(
        navigator.userAgent?.includes('OutpostChessApp/ios')
      );
    }, []);

    const [pulseDot, setPulseDot] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [hintCircle, setHintCircle] = useState(false);
    const [isFocusedInput, setIsFocusedInput] = useState(false);
    const [question, setQuestion] = useState('');
    const [timeoutEnginePlay, setTimeoutEnginePlay] = useState(false);
    const [takeBakeShake, setTakeBakeShake] = useState(false);
    const [progressReview, setProgressReview] = useState(0);
    const [reviewDataToNotation, setReviewDataToNotation] = useState<
      EvaluationMove[]
    >([]);

    const [scoreCP, setScoreCP] = useState(0);
    const [prevScoreCP, setprevScoreCP] = useState(0);
    const [isReviewing, setIsReviewing] = useState(false);

    const [showNames, setShowNames] = useState(true);
    const smallMobile =
      typeof window !== 'undefined' && window.innerWidth < 400;
    const { isMobile, isTablet } = useIsTablet();
    const [newRatingEngine, setRatingBotEngine] = useState(
      isMobile ? 1999 : 2099
    );
    const [currentRatingEngine, setCurrentRatingEngine] = useState<
      number | null
    >(null);
    const [stockfish, setStockfish] = useState(false);
    const [evalVisible, setEvalVisible] = useState(true);

    const [percentW, setPercentW] = useState(50);
    const [percentB, setPercentB] = useState(50);
    const [isComputingLines, setIsComputingLines] = useState(false);
    const [displayedLineSans, setDisplayedLineSans] = useState<
      { san: string; score: number }[]
    >([]);

    const [completedGames, setCompletedGames] = useState<CompletedGameItem[]>(
      []
    );
    const [isLoadingGames, setIsLoadingGames] = useState(false);
    const [showMyGames, setShowMyGames] = useState(false);

    const hasPgnInUrl =
      typeof window !== 'undefined' &&
      !!new URL(window.location.href).searchParams.get('pgn');

    const needsAutoStart =
      !hasPgnInUrl && currentChapterState.chessAiMode.mode === '';
    const autoStartPendingRef = useRef(needsAutoStart);
    // const [autoStarting, setAutoStarting] = useState(needsAutoStart);

    useEffect(() => {
      if (autoStartPendingRef.current) {
        onSetStartPosition();
      }
      autoStartPendingRef.current = false;
    }, []);

    // useEffect(() => {
    //   if (currentChapterState.chessAiMode.mode !== '') {
    //     setAutoStarting(false);
    //   }
    // }, [currentChapterState.chessAiMode.mode]);

    // useEffect(() => {
    //   if (!autoStarting) {
    //     requestAnimationFrame(() => {
    //       window.dispatchEvent(new Event('resize'));
    //     });
    //   }
    // }, [autoStarting]);

    const hasGameLoaded =
      hasPgnInUrl ||
      currentChapterState.messages.length > 1 ||
      currentChapterState.chessAiMode.mode === 'review';

    const toggleMyGames = async () => {
      if (!showMyGames && completedGames.length === 0) {
        setShowMyGames(true);
        setIsLoadingGames(true);
        const games = await getCompletedGames();
        setCompletedGames(games);
        setIsLoadingGames(false);
      } else {
        setShowMyGames((prev) => !prev);
      }
    };
    console.log('hasGameLoaded', hasGameLoaded);
    const handleImportGame = (game: CompletedGameItem) => {
      const lastGame =
        game.results?.endedGames?.[game.results.endedGames.length - 1];
      if (!lastGame?.pgn) return;
      const isChallenger = game.results?.challenger?.id === userData.user_id;
      const opponentName = isChallenger
        ? game.target_name_first || 'Opponent'
        : game.initiator_name_first || 'Opponent';
      let opponentColor: 'white' | 'black' = 'black';
      if (lastGame.players) {
        opponentColor =
          lastGame.players.w === userData.user_id ? 'black' : 'white';
      } else {
        opponentColor = isChallenger ? 'black' : 'white';
      }
      addChessAi({
        ...currentChapterState.chessAiMode,
        mode: 'review',
        fen: lastGame.pgn,
        originalPGN: lastGame.pgn,
        opponentName,
        opponentColor,
        orientationChange: false,
        responseId: '',
        message: '',
      });
    };

    const [moveSan, setMoveSan] = useState('');
    const [moveLan, setMoveLan] = useState('');

    const [stockfishMovesInfo, setStockfishMovesInfo] = useState('');
    const [lines, setLines] = useState<StockfishLines>({
      1: { moves: '', score: 0 },
      2: { moves: '', score: 0 },
      3: { moves: '', score: 0 },
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

    const checkAnswerGPT = async (data: any, predefined?: string) => {
      if (data == 'ai_daily_limit_reached') {
        setPulseDot(false);
        onMessage({
          content: `You've hit your daily limit.
          Unlock Unlimited Puzzles, Unlimited Game Reviews, and Unlimited AI Chat for just €4/Month,  and improve faster with AI-powered analysis and training.`,

          participantId: 'chatGPT123456sales',
          idResponse: '',
        });
      } else if (
        currentChapterState.messages[
          currentChapterState?.messages?.length - 1
        ]?.participantId?.includes('sales')
      ) {
        onMessage({
          content: data.answer.text,
          participantId: 'chatGPT123456sales',
          idResponse: data.id,
        });
      } else {
        if (data.answer.action !== '' && data.answer.actionType == 'bestMove') {
          const from = data.answer.action.slice(0, 2);
          const to = data.answer.action.slice(2, 4);
          const color = '#11c6d1';
          const arrowId = `${from}${to}-${color}`;
          onArrowsChange({
            [arrowId]: [from as Square, to as Square],
          });
        } else if (
          data.answer.actionType == 'toPosition' &&
          data.answer.action !== ''
        ) {
          // console.log('akcija', data.answer.action);
          const a = data.answer.action;
          const b =
            currentChapterState.chessAiMode.opponentColor == 'white' ? 1 : 0;
          const pgn = currentChapterState.chessAiMode.originalPGN;
          const slicePGN = slicePgn(pgn, a - 1, b);
          // console.log('slicePGN', slicePGN);

          onChangePosition({
            type: 'PGN',
            val: slicePGN,
            position: [Number(a) - 1, Number(b)],
          });
        }
        setSuggestions(
          Array.isArray(data.answer.suggestions) ? data.answer.suggestions : []
        );
        onMessage({
          content: data.answer.text,
          participantId: 'chatGPT123456' + predefined,
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
      setSuggestions([]);
      setTimeout(() => {
        setPulseDot(true);
      }, 500);

      const data = await SendQuestionReview(
        question,
        currentChapterState,
        moveSan,
        moveLan,
        scoreCP
      );

      if (data) {
        setPulseDot(false);
      }
      checkAnswerGPT(data);
    };

    useEffect(() => {
      if (!userData.user_id) return;

      const hasSalesMessage = currentChapterState.messages.some((m) =>
        m.participantId?.includes('sales')
      );

      if (!hasSalesMessage) return;
      const checkAndReset = async () => {
        const hasSubscription =
          !!userData.product_name && userData.ends_at !== null;

        if (hasSubscription) {
          resetMessages();
          return;
        }
        const review24hData = await getReview24h();
        if (!review24hData) {
          resetMessages();
        }
      };
      checkAndReset();
    }, [userData.user_id]);

    useEffect(() => {
      setEvalVisible(false);
    }, [currentChapterState.orientation]);

    useEffect(() => {
      if (prevScoreCP !== 0) {
        const probability = async () => {
          const ProbabilityChange = await ChessEngineProbabilityCalc(
            scoreCP,
            prevScoreCP
          );
          setEvalVisible(true);
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
      if (
        (currentChapterState.chessAiMode.mode === 'review' ||
          currentChapterState.chessAiMode.mode === 'play') &&
        !stockfish
      ) {
        setTimeout(() => setStockfish(true), 1000);
      }
    }, [currentChapterState.chessAiMode.mode]);
    useEffect(() => {
      setReviewDataToNotation(currentChapterState.chessAiMode.review);
      if (
        currentChapterState.chessAiMode.review.length == 0 &&
        currentChapterState.messages[0]?.content ==
          "Alright, let's take a look at this one."
      ) {
        setShowNames(false);
      }
    }, [currentChapterState.chessAiMode.review]);

    useEffect(() => {
      const mode = currentChapterState.chessAiMode.mode;
      if (mode !== 'play' && mode !== 'review') return;
      setIsComputingLines(true);
      onComputingChange?.(true);
      onLinesChange?.([]); // reset lines so loader shows immediately in mobile
    }, [currentChapterState.displayFen]);

    useEffect(() => {
      const mode = currentChapterState.chessAiMode.mode;
      if (mode !== 'play' && mode !== 'review') return;

      const isReview = mode === 'review';
      const colors = ['#07da63', '#07da6388', '#07da6344'];
      const newArrows: ArrowsMap = {};
      const newSans: { san: string; score: number }[] = [];
      [lines[1], lines[2], lines[3]].forEach(({ moves, score }, idx) => {
        if (!moves || moves.length < 4) return;
        const from = moves.slice(0, 2);
        const to = moves.slice(2, 4);
        if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return;
        const color = colors[idx];
        newArrows[`${from}${to}-${color}`] = [
          from as Square,
          to as Square,
          color,
        ];
        const san = uciLineToSan(moves, currentChapterState.displayFen);
        if (san) newSans.push({ san, score });
      });
      if (!isReview && progressReview === 0) {
        onArrowsChange(newArrows);
      }

      if (newSans.length > 0) {
        setDisplayedLineSans(newSans);
        onLinesChange?.(newSans);
      }
      setIsComputingLines(false);
      onComputingChange?.(false);
    }, [lines, currentChapterState.chessAiMode.mode]);

    const isMate = async () => {
      //nothing for now
    };

    const ratingEngine = (rating: number) => {
      setCurrentRatingEngine(rating);
    };
    const engineMove = (m: any, n?: boolean) => {
      //if engine dont have move, play mod is disabled
      if (m === '(none)' || m === '') {
        onCanPlayChange(false);
        setMoveSan('');
        setMoveLan('');
      } else {
        onCanPlayChange(true);
      }

      setStockfishMovesInfo(m);
      let fromChess = m.slice(0, 2);
      let toChess = m.slice(2, 4);

      if (fromChess && toChess) {
        try {
          const chess = new Chess(currentChapterState.displayFen);
          const move = chess.move({ from: fromChess, to: toChess });

          if (move) {
            setMoveSan(move.san);
            setMoveLan(move.lan);
            const reviewData = currentChapterState.chessAiMode.review;
            if (reviewData.length > 0) {
              const index =
                currentChapterState.notation.focusedIndex[0] * 2 +
                currentChapterState.notation.focusedIndex[1] -
                1;
              const whiteMove = index % 2 !== 0 ? true : false;

              if (
                (Number(reviewData[index + 1].diff) > 0.6 && !whiteMove) ||
                (Number(reviewData[index + 1].diff) < -0.6 && whiteMove)
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
    const analizeWorstMove = async () => {
      onMessage({
        content: 'My bad move?',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 500);
      const question = 'Find my worst move.';
      const data = await SendQuestionReview(question, currentChapterState);
      if (data) {
        setPulseDot(false);
      }
      checkAnswerGPT(data, 'worstMove');
    };
    const checkOpening = async () => {
      onMessage({
        content: 'How was my opening?',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 500);
      const question =
        'Analize user opening. Maybe say somethig you recognize.Pop up if there were any wrong or very good moves by the user';
      const data = await SendQuestionReview(
        question,
        currentChapterState,
        undefined,
        undefined,
        undefined,
        true
      );
      if (data) {
        setPulseDot(false);
      }
      checkAnswerGPT(data, 'gameOpening');
    };

    const buildPgnFromHistory = (
      history: ChapterState['notation']['history']
    ): string => {
      const parts: string[] = [];
      for (let i = 0; i < history.length; i++) {
        const turn = history[i];
        if (!turn) break;
        const [white, black] = turn;
        if (white && !white.isNonMove) parts.push(`${i + 1}. ${white.san}`);
        if (black && !black.isNonMove) parts.push(black.san);
      }
      return parts.join(' ');
    };

    const handleGameReviewFromPlay = async () => {
      const pgn = buildPgnFromHistory(currentChapterState.notation.history);
      if (!pgn) return;
      addChessAi({
        ...currentChapterState.chessAiMode,
        mode: 'review',
        fen: pgn,
        originalPGN: pgn,
      });
      await analizeMatch(pgn);
    };

    const analizeMatch = async (pgnOverride?: string) => {
      const hasSubscription =
        !!userData.product_name && userData.ends_at !== null;
      if (!hasSubscription) {
        const review24hData = await getReview24h();
        if (review24hData) {
          onMessage({
            content: `That's your free Game Review for today! Want more? Unlock unlimited Game Reviews, Unlimited Puzzles and AI Chat for just €4/Month. 🚀`,
            participantId: 'chatGPT123456sales',
            idResponse: '',
          });
          return;
        }
      }

      // historyBackToStart(); GUTA BRISAO
      setPulseDot(true);
      setIsReviewing(true);
      let data;
      try {
        data = await analyzePGN(
          pgnOverride ?? currentChapterState.chessAiMode.fen,
          {
            onProgress: (progress: number) => setProgressReview(progress),
          },
          isMobile
        );
      } finally {
        setIsReviewing(false);
      }
      // console.log('dats', data);

      const filtered = data.map((item) => ({
        moveNum: item.moveNum,
        move: item.move,
        moveLan: item.moveLan,
        topMove: item.topMove,
        moveCalc: item.moveCalc,
        eval: item.eval,
        diff: item.diff,
        bestMoves: item.bestMoves,
        fen: item.fen,
      }));

      if (data) {
        setPulseDot(false);
        setProgressReview(0);
      }

      const analiticsReview = reviewAnalitics(data);

      if (
        !currentChapterState.messages[1]?.content?.includes('analyzeReview') &&
        filtered.length > 0
      ) {
        console.log('1', currentChapterState.messages[1]?.content);
        console.log('2', filtered.length);
        onMatchReview({
          evaluation: filtered,
          message: {
            content: analiticsReview + '/analyzeReview',
            participantId: 'chatGPT123456',
            idResponse:
              currentChapterState.messages[
                currentChapterState.messages.length - 1
              ].idResponse,
          },
        });
        reviewMetrics();
      }
    };
    const handleGameEvaluation = (newScore: number) => {
      if (isReviewing) return;
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
      addGameEvaluation(newScore);
      if (Math.abs(newScore) >= 49999) {
        setIsComputingLines(false);
        onComputingChange?.(false);
      }
    };

    // if (autoStarting) {
    //   return <div className="flex-1" />;
    // }

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
            multiPV={3}
            fixedDepth={
              currentChapterState.chessAiMode.mode === 'play'
                ? isMobile
                  ? 11
                  : 12
                : undefined
            }
          />
        )}

        <Tabs
          containerClassName={`flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl md:mb-0 ${
            isOutpostWebViewAndroid
              ? 'mb-4'
              : isOutpostWebViewIos
              ? 'mb-0'
              : 'mb-16'
          }`}
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
                <div className="flex flex-col md:flex-1 h-[400px] md:h-auto gap-2 min-h-0 w-full overflow-hidden md:overflow-scroll no-scrollbar pb-0 max-width-[100%]">
                  {/* {isMobile && (
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
                        reviewDataToNotation={reviewDataToNotation}
                        isMobile={isMobile}
                        history={currentChapterState.notation?.history}
                        playerNames={playerNames}
                        isAichess={true}
                        focusedIndex={
                          currentChapterState.notation?.focusedIndex
                        }
                        showNames={showNames}
                        onDelete={onHistoryNotationDelete}
                        onRefocus={onHistoryNotationRefocus}
                        isFocusedInput={isFocusedInput}
                      />
                    </div>
                  )} */}
                  <div
                    className={`flex-1  justify-between flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-4 md:pb-1 rounded-lg

                  ${isMobile ? 'mb-2' : ''}
                  `}
                  >
                    {/* <div className={`${!hasGameLoaded ? 'h-auto' : currentChapterState.chessAiMode.mode=='review' ? 'h-[320px]' : 'h-[290px]'}    md:flex-1  min-h-0 `}> */}
                    <div
                      className={`${
                        currentChapterState.chessAiMode.mode == 'review'
                          ? 'h-[320px]'
                          : 'h-[290px]'
                      }    md:flex-1  min-h-0 `}
                    >
                      <ConversationReview
                        analizeMatch={analizeMatch}
                        worstMove={analizeWorstMove}
                        checkOpening={checkOpening}
                        openViewSubscription={openViewSubscription}
                        smallMobile={smallMobile}
                        progressReview={progressReview}
                        currentChapterState={currentChapterState}
                        pulseDot={pulseDot}
                        userData={userData}
                        scoreCP={scoreCP}
                        suggestions={suggestions}
                        onSuggestedQuestion={addQuestion}
                        onMoveClick={onHistoryNotationRefocus}
                        hasGameLoaded={hasGameLoaded}
                        onImportGame={handleImportGame}
                        completedGames={completedGames}
                        isLoadingGames={isLoadingGames}
                        showMyGames={showMyGames}
                        onToggleMyGames={toggleMyGames}
                        currentUserId={userData.user_id}
                      />
                    </div>
                    <div>
                      {currentChapterState.chessAiMode.mode === 'play' &&
                        currentChapterState.notation.history.length >= 9 && (
                          <ButtonGreen
                            size="sm"
                            onClick={handleGameReviewFromPlay}
                            className=" mt-2 mb-4 py-2 font-bold "
                          >
                            Game Review
                          </ButtonGreen>
                        )}
                      {(currentChapterState.chessAiMode.review?.length !== 0 ||
                        currentChapterState.chessAiMode.mode === 'play') && (
                        <div className="flex mb-0 mt-2 md:mt-2">
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
                            className="w-full text-base md:text-sm rounded-[20px] border  border-conversation-100 bg-[#111111]/40 text-white
                        placeholder-slate-500  px-4 py-2  transition-colors duration-200 focus:outline-none
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

                      {(currentChapterState.chessAiMode.mode == 'review' ||
                        currentChapterState.chessAiMode.mode === 'play') && (
                        <div className={'mt-1 mb-2'}>
                          <div className="w-full mt-1 h-5 md:flex hidden overflow-hidden rounded mt-4">
                            <div
                              className="bg-white transition-all duration-500 flex items-center justify-start pl-1"
                              style={{ width: `${percentW}%` }}
                            >
                              {scoreCP > 0 &&
                                scoreCP < 49999 &&
                                !isReviewing && (
                                  <span
                                    className="text-[10px] font-bold leading-none whitespace-nowrap relative top-[1px]"
                                    style={{ color: '#111' }}
                                  >
                                    +{(scoreCP / 100).toFixed(2)}
                                  </span>
                                )}
                            </div>
                            <div
                              className="bg-[#000000] transition-all duration-500 flex items-center justify-end pr-1"
                              style={{ width: `${percentB}%` }}
                            >
                              {scoreCP < 0 &&
                                scoreCP > -49999 &&
                                !isReviewing && (
                                  <span className="text-[10px] font-bold text-white leading-none whitespace-nowrap relative top-[2px]">
                                    {(scoreCP / 100).toFixed(2)}
                                  </span>
                                )}
                            </div>
                          </div>

                          {scoreCP !== 0 ? (
                            <div
                              className={`hidden md:flex justify-between items-center relative top-2 h-[72px] ${
                                showNames ? 'md:top-0' : 'md:top-4'
                              }`}
                            >
                              {/* {currentChapterState.chessAiMode.mode == 'play' ? ( */}
                              <div className="relative w-full mt-4 min-h-[42px]">
                                <div
                                  className={`flex flex-col gap-1 transition-opacity duration-300 ${
                                    isComputingLines
                                      ? 'opacity-25'
                                      : 'opacity-100'
                                  }`}
                                >
                                  {displayedLineSans.map(
                                    ({ san, score }, idx) => {
                                      const scoreLabel =
                                        Math.abs(score) >= 49999
                                          ? `M${score > 0 ? '' : '-'}${
                                              Math.abs(score) === 50000
                                                ? '∞'
                                                : ''
                                            }`
                                          : `${score >= 0 ? '+' : ''}${(
                                              score / 100
                                            ).toFixed(2)}`;
                                      return (
                                        <p
                                          key={idx}
                                          className={`text-xs truncate flex gap-2 ${
                                            idx === 0
                                              ? 'text-white'
                                              : idx === 1
                                              ? 'text-gray-400'
                                              : 'text-gray-500'
                                          }`}
                                        >
                                          <span className="font-mono shrink-0 w-10 text-left">
                                            {scoreLabel}
                                          </span>
                                          <span className="truncate">
                                            {san}
                                          </span>
                                        </p>
                                      );
                                    }
                                  )}
                                </div>
                                {isComputingLines && (
                                  <div className="absolute  inset-0 flex items-center justify-start opacity-80">
                                    <Loader />
                                    {/* <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> */}
                                  </div>
                                )}
                              </div>
                              {/* ) : (
                                   <div className={` flex  items-center  `}>
                                {scoreCP < 49999 &&
                                  scoreCP > -49999 &&
                                  evalVisible &&
                                  (currentChapterState.orientation == 'b' ? (
                                    <p className={'font-bold '}>
                                      {' '}
                                      {(scoreCP / 100) * -1}
                                    </p>
                                  ) : (
                                    evalVisible && (
                                      <p className={'font-bold '}>
                                        {' '}
                                        {scoreCP / 100}
                                      </p>
                                    )
                                  ))}
                                &nbsp;&nbsp;{' '}
                                {moveSan && (
                                  <p className={'text-sm  '}>
                                    {' '}
                                    Best Move: {moveSan}{' '}
                                  </p>
                                )}
                              </div>
                              )} */}

                              {!showNames ? (
                                <ButtonGreen
                                  icon="ArrowLeftIcon"
                                  onClick={() => {
                                    setShowNames(true);
                                    onQuickImport({
                                      type: 'PGN',
                                      val: currentChapterState.chessAiMode
                                        .originalPGN,
                                    });
                                  }}
                                  size="md"
                                  className="bg-green-600  text-black  font-bold  px-1 mr-2 whitespace-nowrap px-4"
                                  style={{ color: 'black' }}
                                >
                                  {currentChapterState.chessAiMode
                                    .opponentName ? (
                                    <>
                                      &nbsp;&nbsp; vs{' '}
                                      {
                                        currentChapterState.chessAiMode
                                          .opponentName
                                      }
                                    </>
                                  ) : (
                                    'Back'
                                  )}
                                </ButtonGreen>
                              ) : (
                                <div className="md:flex hidden overflow-hidden items-center gap-3 h-[55px] shrink-0 whitespace-nowrap">
                                  <label className="font-bold text-sm  text-gray-400">
                                    {/* Import */}
                                  </label>
                                  {!isTablet && (
                                    <PgnInputBox
                                      compact
                                      containerClassName="flex-1"
                                      onChange={onImport}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            !isMobile && (
                              <div style={{ height: '60px' }}>
                                <Loader />
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isMobile && !isTablet && (
                    <div
                      style={{
                        backgroundImage:
                          'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)',
                        height: isMobile ? '52px' : '260px',
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
                        reviewDataToNotation={reviewDataToNotation}
                        isMobile={isMobile}
                        history={currentChapterState.notation?.history}
                        playerNames={playerNames}
                        isAichess={true}
                        focusedIndex={
                          currentChapterState.notation?.focusedIndex
                        }
                        showNames={showNames}
                        onDelete={onHistoryNotationDelete}
                        onRefocus={onHistoryNotationRefocus}
                        isFocusedInput={isFocusedInput}
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
