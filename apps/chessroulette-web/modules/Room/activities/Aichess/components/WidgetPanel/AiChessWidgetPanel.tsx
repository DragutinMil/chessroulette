import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import { Button } from '@app/components/Button';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { ChessFENBoard, isValidPgn } from '@xmatter/util-kit';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import debounce from 'debounce';
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
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import Conversation from './Conversation';
import ConversationReview from './GameReview/ConversationReview';

import PuzzleScore from './PuzzleScore';
import { Square, Chess } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { analyzePGN } from '@app/modules/ChessEngine/ChessEngineReviewMatch';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { SendQuestionPuzzle } from './SendQuestionPuzzle';
import { SendQuestionReview } from './GameReview/SendQuestionReview';
import { CheckPiece } from './CheckPiece';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { ChessEngineProbabilityCalc } from '@app/modules/ChessEngine/components/ChessEngineCalculator';
import { Switch } from '@app/components/Switch';
import { getOpenings, getPuzzle, reviewAnalitics } from '../../util';

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
  puzzleCounter: number;

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

export const AiChessWidgetPanel = React.forwardRef<TabsRef, Props>(
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
      puzzleCounter,
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
    // const settings = useAichessActivitySettings();
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const updateableSearchParams = useUpdateableSearchParams();
    const [pulseDot, setPulseDot] = useState(false);
    const [hintCircle, setHintCircle] = useState(false);
    const [isFocusedInput, setIsFocusedInput] = useState(false);
    const [question, setQuestion] = useState('');
    const [timeoutEnginePlay, setTimeoutEnginePlay] = useState(false);
    const [takeBakeShake, setTakeBakeShake] = useState(false);
    const [progressReview, setProgressReview] = useState(0);
    const [reviewData, setReviewData] = useState<EvaluationMove[]>([]);
    const [freezeButton, setFreezeButton] = useState(false);
    const [scoreCP, setScoreCP] = useState(0);
    const [prevScoreCP, setprevScoreCP] = useState(0);
    const [categortyPrefered, setCategortyPrefered] = useState('');

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
   
    const lastClick = useRef(0);
    const [percentW, setPercentW] = useState(50);
    const [percentB, setPercentB] = useState(50);
    const [preferedCategory, setPreferedCategory] = useState('');

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
    const playMode = currentChapterState.chessAiMode.mode === 'play';
    const puzzleMode = currentChapterState.chessAiMode.mode === 'puzzle';
   

    const checkAnswerGPT = async (data: any) => {
      if (
        data.puzzle &&
        data.puzzle.fen &&
        ChessFENBoard.validateFenString(data.puzzle.fen).ok
      ) {
        const changeOrientation =
          currentChapterState.orientation === data.puzzle.fen.split(' ')[1];
        const userRating =
          currentChapterState.chessAiMode.userPuzzleRating > 0
            ? currentChapterState.chessAiMode.userPuzzleRating
            : data.puzzle.user_puzzle_rating;

        addChessAi({
          mode: 'puzzle',
          moves: data.puzzle.solution,
          movesCount: data.puzzle.solution.length / 2,
          badMoves: 0,
          goodMoves: 0,
          orientationChange: changeOrientation,
          puzzleRatting: currentChapterState.chessAiMode.puzzleRatting,
          userPuzzleRating: userRating,
          ratingChange: currentChapterState.chessAiMode.ratingChange,
          puzzleId: data.puzzle.puzzle_id,
          prevUserPuzzleRating: userRating,
          fen: data.puzzle.fen,
          responseId: '',
          message: '',
        });
        setTimeout(() => {
          const from = data.puzzle.solution[0].slice(0, 2);
          const to = data.puzzle.solution[0].slice(2, 4);
          const m = data.puzzle.solution[0];

          const chess = new Chess(data.puzzle.fen);
          const piece = chess.get(from);
          if (piece.type === 'p' && piece.color === 'w' && to[1] === '8') {
            const first_move = { from: from, to: to, promoteTo: 'Q' };
            setTimeout(() => onPuzzleMove(first_move as MovePiece), 1200);
          } else if (
            piece.type === 'p' &&
            piece.color === 'b' &&
            to[1] === '1'
          ) {
            const first_move = { from: from, to: to, promoteTo: 'q' };
            setTimeout(() => onPuzzleMove(first_move as MovePiece), 1200);
          } else {
            const first_move = { from: from, to: to };
            setTimeout(() => onPuzzleMove(first_move), 800);
          }
        }, 1000);

        //FIRST MOVE
      } else if (
        data.answer?.fen &&
        data.answer?.messageType == 'setTablePlay' &&
        ChessFENBoard.validateFenString(data.answer.fen).ok
      ) {
        const changeOrientation =
          currentChapterState.orientation === data.answer.fen.split(' ')[1];
        addChessAi({
          ...currentChapterState.chessAiMode,
          mode: 'play',
          moves: [],
          movesCount: 0,
          badMoves: 0,
          goodMoves: 0,
          orientationChange: changeOrientation,
          fen: data.answer.fen,
          responseId: data.id,
          message: data.answer.text,
        });
      } else {
        if (data?.puzzle?.error == 'Daily limit reached!') {
          onMessage({
            content: data.answer.text,
            participantId: 'chatGPT123456sales',
            idResponse: data.id,
          });
        } else if (data == 'ai_daily_limit_reached') {
          setPulseDot(false);
          onMessage({
            content: `You’ve reached today’s puzzle limit! ♟️
But your next great move is just one click away — start your 7-day free trial today (cancel anytime).

With Starter, you’ll unlock Game Review, unlimited AI puzzles, free play, and an interactive chat with your personal chess trainer.

Exactly what you need to level up your strategy and sharpen your game every day.

Your opening move to mastering chess begins now — make it count! 🚀`,
            participantId: 'chatGPT123456sales',
            idResponse: '',
          });
        } else if(currentChapterState.messages[
            currentChapterState?.messages?.length - 1
          ]?.participantId.includes('sales')) {
          onMessage({
            content: data.answer.text,
            participantId: 'chatGPT123456sales',
            idResponse: data.id,
          });
        } else  {
          onMessage({
            content: data.answer.text,
            participantId: 'chatGPT123456',
            idResponse: data.id,
          });
        }
      }
    };

    const addQuestion = async (question: string) => {
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');
      const lastIdResponse =
      currentChapterState.messages.length > 0
      ? currentChapterState.messages[currentChapterState.messages.length - 1].idResponse || ''
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

      if (currentChapterState.chessAiMode.mode !== 'review') {
        const pgn = currentChapterState.notation.history
          .map((pair, i) => {
            const white = pair[0]?.san || '';
            const black = pair[1]?.san || '';
            return `${i + 1}. ${white} ${black}`.trim();
          })
          .join(' ');

        const data = await SendQuestionPuzzle(
          question,
          scoreCP,
          currentChapterState,
          stockfishMovesInfo,
          lines[1],
          currentRatingEngine,
          pgn
        );
        if (data) {
          setPulseDot(false);
        }
        if (data.answer?.messageType == 'ratingChange') {
          const number = data.answer.text.match(/\d+/);
          const newRating = parseInt(number[0], 10);

          setRatingBotEngine(newRating);
        }
        checkAnswerGPT(data);
      } else {
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

        // onMessage({
        //   content: data.answer.text,
        //   participantId: 'chatGPT123456',
        //   idResponse: data.id,
        // });
      }
    };

    useEffect(() => {
      if (puzzleCounter !== 0) {
        puzzles();
      }
    }, [puzzleCounter]);

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

          if (!isMyTurn) {
            if (ProbabilityChange.diff < -8 && ProbabilityChange.diff > -11) {
              moveReaction(0);
            } else if (ProbabilityChange.diff < -11.01) {
              moveReaction(-1);
            }

            if (ProbabilityChange.diff > 3) {
              if (ProbabilityChange.diff > 7) {
                moveReaction(2);
              } else moveReaction(1);
            }
          }
        };
        probability();
      }
    }, [scoreCP]);

    useEffect(() => {
      const length = currentChapterState.notation.history.length;

      // IF END OF PUZZLE RETURN
      if (
        currentChapterState.chessAiMode.goodMoves ===
          currentChapterState.chessAiMode.moves?.length &&
        currentChapterState.chessAiMode.goodMoves % 2 === 0 &&
        currentChapterState.chessAiMode.goodMoves > 0
      ) {
        return;
      }
      // PUZZLE MOVE
      if (length > 0) {
        //crni sam
        if (
          currentChapterState.orientation == 'b' &&
          !isMyTurn &&
          currentChapterState.chessAiMode.movesCount > length
        ) {
          setHintCircle(false);
          const from = currentChapterState.chessAiMode.moves[2 * length].slice(
            0,
            2
          ); // "d3"
          const to = currentChapterState.chessAiMode.moves[2 * length].slice(
            2,
            4
          );
          // const m = currentChapterState.chessAiMode.moves[2 * length];

          const chess = new Chess(currentChapterState.displayFen);
          const piece = chess.get(from as Square);
          if (piece.type === 'p' && piece.color === 'w' && to[1] === '8') {
            const n = { from: from, to: to, promoteTo: 'Q' };
            setTimeout(() => onPuzzleMove(n as MovePiece), 1200);
          } else if (
            piece.type === 'p' &&
            piece.color === 'b' &&
            to[1] === '1'
          ) {
            const n = { from: from, to: to, promoteTo: 'q' };
            setTimeout(() => onPuzzleMove(n as MovePiece), 1200);
          } else {
            const n = { from: from as Square, to: to as Square };
            setTimeout(() => onPuzzleMove(n), 800);
          }
        } else if (
          currentChapterState.orientation == 'w' &&
          !isMyTurn &&
          currentChapterState.chessAiMode.movesCount >= length
        ) {
          setHintCircle(false);
          const from = currentChapterState.chessAiMode.moves[
            2 * length - 2
          ].slice(0, 2); // "d3"
          const to = currentChapterState.chessAiMode.moves[
            2 * length - 2
          ].slice(2, 4);
          // const move = { from: from as Square, to: to as Square };
          if (!isMyTurn) {
            //const m = currentChapterState.chessAiMode.moves[2 * length - 2];
            const chess = new Chess(currentChapterState.displayFen);
            const piece = chess.get(from as Square);
            if (piece.type === 'p' && piece.color === 'w' && to[1] === '8') {
              const n = { from: from, to: to, promoteTo: 'Q' };
              setTimeout(() => onPuzzleMove(n as MovePiece), 1200);
            } else if (
              piece.type === 'p' &&
              piece.color === 'b' &&
              to[1] === '1'
            ) {
              const n = { from: from, to: to, promoteTo: 'q' };
              setTimeout(() => onPuzzleMove(n as MovePiece), 1200);
            } else {
              const n = { from: from as Square, to: to as Square };
              setTimeout(() => onPuzzleMove(n), 800);
            }
          }
        }
      }
    }, [currentChapterState.chessAiMode.goodMoves]);
useEffect(() => {
       
       setTimeout(() => setStockfish(true), 1500);
    }, []);
    useEffect(() => {
      if (currentChapterState.chessAiMode.mode == 'review') {
      }
      if (currentChapterState.chessAiMode.mode == 'play') {
        setTimeoutEnginePlay(true);
      }
    }, [currentChapterState.chessAiMode.mode]);
    // useEffect(() => {
    //   if (
    //     currentChapterState.chessAiMode.puzzleId == -1 &&
    //     !currentChapterState.messages[
    //       currentChapterState.messages.length - 1
    //     ].participantId.includes('sales')
    //   ) {
    //     setPulseDot(true);

    //     const limitQuestion = async () => {
    //       const question =
    //         'Daily limit reached. Explane what to do to continue play puzzle';
    //       const data = await SendQuestionPuzzle(
    //         question,
    //         scoreCP,
    //         currentChapterState,
    //         stockfishMovesInfo,
    //         lines[1],
    //         currentRatingEngine
    //       );
    //       if (data) {
    //         setPulseDot(false);
    //       }
    //       onMessage({
    //         content: data.answer.text,
    //         participantId: 'chatGPT123456sales',
    //         idResponse: data.id,
    //       });
    //     };
    //     limitQuestion();
    //   }
    // }, [currentChapterState.chessAiMode.puzzleId]);

    useEffect(() => {
      if (
        currentChapterState.chessAiMode.goodMoves > 0 &&
        currentChapterState.chessAiMode.goodMoves % 2 === 0 &&
        currentChapterState.chessAiMode.goodMoves <
          currentChapterState.chessAiMode.moves.length
      ) {
        const responses = [
          'Nice move! ✅',
          'Well played! ♟️',
          'Sharp! ⚡',
          'Brilliant! ✨',
          'Smart move! 🧠',
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);

        setTimeout(
          () =>
            onMessage({
              content: responses[randomIndex],
              participantId: 'chatGPT123456',
              idResponse:
                currentChapterState.messages[
                  currentChapterState.messages.length - 1
                ].idResponse,
            }),
          600
        );
      }
    }, [currentChapterState.chessAiMode.goodMoves]);

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

    const hint = async () => {
      if (currentChapterState.chessAiMode.mode == 'puzzle') {
        const fieldFrom = currentChapterState.chessAiMode.moves[
          currentChapterState.chessAiMode.goodMoves
        ].slice(0, 2);
        const fieldTo = currentChapterState.chessAiMode.moves[
          currentChapterState.chessAiMode.goodMoves
        ].slice(2, 4);
        const color = '#11c6d1';
        if (hintCircle) {
          
          const arrowId = `${fieldFrom}${fieldTo}-${color}`;
          onArrowsChange({
            [arrowId]: [fieldFrom as Square, fieldTo as Square, color],
          });
          setHintCircle(false);
        } else {
      
          const piece = await CheckPiece(
            fieldFrom as Square,
            currentChapterState.displayFen
          );
          const circle = [fieldFrom, color, piece];
        //  console.log('ide circle',circle)
          setHintCircle(true);
          onCircleDraw(circle as CircleDrawTuple);
        }
      } else if (stockfishMovesInfo) {
        if (isMyTurn) {
          const m = stockfishMovesInfo;
          let from = m.slice(0, 2);
          let to = m.slice(2, 4);

          const color = '#07da63';
          if (hintCircle) {
            const arrowId = `${from}${to}-${color}`;
            onArrowsChange({
              [arrowId]: [from as Square, to as Square, color],
            });
            setHintCircle(false);
          } else {
            const piece = await CheckPiece(
              from as Square,
              currentChapterState.displayFen
            );
            const circle = [from, color, piece];
            setHintCircle(true);
            onCircleDraw(circle as CircleDrawTuple);
          }
        }
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

      if (!isMyTurn && currentChapterState.chessAiMode.mode == 'play') {
        setHintCircle(false);

        if (
          m.length == 5 &&
          (m.slice(4, 5) == 'q' ||
            m.slice(4, 5) == 'b' ||
            m.slice(4, 5) == 'r' ||
            m.slice(4, 5) == 'k')
        ) {
          const n =
            currentChapterState.orientation == 'w'
              ? { from: fromChess, to: toChess, promoteTo: 'q' }
              : { from: fromChess, to: toChess, promoteTo: 'Q' };
          setTimeout(() => onMove(n), 1500);
        } else {
          let n = { from: fromChess, to: toChess };
          if (currentChapterState.notation.history.length == 0) {
            setTimeout(() => {
              if (!isMyTurn) {
                onMove(n);
              }
            }, 1500);
          } else {
            if (timeoutEnginePlay) {
              setTimeout(
                () => {
                  if (!isMyTurn) {
                    onMove(n);
                  }
                },

                2000
              );
              setTimeoutEnginePlay(false);
            } else {
              setTimeout(
                () => {
                  if (!isMyTurn) {
                    onMove(n);
                  }
                },

                700
              );
            }
          }
        }
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

    const setRatingEngine = async (category: number) => {
      setRatingBotEngine(category);
      onMessage({
        content: `The rating is now set to ${category}`,
        participantId: 'chatGPT123456',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            .idResponse,
      });
    };
    const puzzles = async (category?: string) => {
      setFreezeButton(true);
      const now = Date.now();
      if (category) {
        setCategortyPrefered(category);
      } else if (categortyPrefered !== '') {
        category = categortyPrefered;
      }

      if (now - lastClick.current < 500) return; // ignoriši dvoklik unutar 0.5s
      lastClick.current = now;

      const data = await getPuzzle(category);
      if (data && !data.fen && data.message == 'puzzle_daily_limit_reached') {
        if (
          !currentChapterState.messages[
            currentChapterState.messages.length - 1
          ].participantId.includes('sales')
        ) {
          addChessAi({
            ...currentChapterState.chessAiMode,
            mode: 'puzzle',
            puzzleId: -1,
          });

          setTimeout(() => {
            setPulseDot(true);
          }, 500);
          const question =
            'Daily limit reached. Explane what to do to continue play puzzle';
          const data = await SendQuestionPuzzle(
            question,
            scoreCP,
            currentChapterState,
            stockfishMovesInfo,
            lines[1],
            currentRatingEngine
          );
          if (data) {
            setPulseDot(false);
          }

          if (data == 'ai_daily_limit_reached') {
            onMessage({
              content: `You’ve reached today’s puzzle limit! ♟️
But your next great move is just one click away — start your 7-day free trial today (cancel anytime).

With Starter, you’ll unlock Game Review, unlimited AI puzzles, free play, and an interactive chat with your personal chess trainer.

Exactly what you need to level up your strategy and sharpen your game every day.

Your opening move to mastering chess begins now — make it count! 🚀`,
              participantId: 'chatGPT123456sales',
              idResponse: '',
            });
          } else if (data?.answer?.text) {
            onMessage({
              content: data.answer.text,
              participantId: 'chatGPT123456sales',
              idResponse: data.id,
            });
          }
        }
        setTimeout(() => setFreezeButton(false), 2000);
      }
      ///OVDE SLUCAJ DA JE PRESAO IGRICU
      if (data && !data.fen && data.message == 'puzzle_daily_limit_reached') {
      }

      if (data.fen && ChessFENBoard.validateFenString(data.fen).ok) {
        // onQuickImport({ type: 'FEN', val: data.fen });
        const changeOrientation =
          currentChapterState.orientation === data.fen.split(' ')[1];
        const userRating =
          currentChapterState.chessAiMode.userPuzzleRating > 0
            ? currentChapterState.chessAiMode.userPuzzleRating
            : data.user_puzzle_rating;

        addChessAi({
          mode: 'puzzle',
          moves: data.solution,
          movesCount: data.solution.length / 2,
          badMoves: 0,
          goodMoves: 0,
          orientationChange: changeOrientation,
          puzzleRatting: data.rating,
          userPuzzleRating: userRating,
          ratingChange: 0,
          puzzleId: data.puzzle_id,
          prevUserPuzzleRating: userRating,
          fen: data.fen,
          responseId: '',
          message: '',
        });
        // addChessAi({
        //   mode: 'puzzle',
        //   moves: ["d7d8q", "g7g6"],
        //   movesCount:  2,
        //   badMoves: 0,
        //   goodMoves: 0,
        //   orientationChange: false,
        //   puzzleRatting: data.rating,
        //   userPuzzleRating: userRating,
        //   ratingChange: 0,
        //   puzzleId: data.puzzle_id,
        //   prevUserPuzzleRating: userRating,
        //   fen:  "8/p2P1kp1/1pB2p2/4pKp1/7r/5R1P/PP6/8 w - - 1 44",
        //   responseId: '',
        //   message: '',
        // });

        setHintCircle(false);
        //FIRST MOVE
        const from = data.solution[0].slice(0, 2);
        const to = data.solution[0].slice(2, 4);
        // const m = data.solution[0];
        setTimeout(() => setFreezeButton(false), 2000);
        const chess = new Chess(data.fen);
        const piece = chess.get(from);
        if (piece.type === 'p' && piece.color === 'w' && to[1] === '8') {
          const first_move = { from: from, to: to, promoteTo: 'Q' };
          setTimeout(() => onPuzzleMove(first_move as MovePiece), 1200);
        } else if (piece.type === 'p' && piece.color === 'b' && to[1] === '1') {
          const first_move = { from: from, to: to, promoteTo: 'q' };
          setTimeout(() => onPuzzleMove(first_move as MovePiece), 1200);
        } else {
          const first_move = { from: from, to: to };
          setTimeout(() => onPuzzleMove(first_move as MovePiece), 1500);
        }
      }
    };

    const takeBack = async () => {
      // setTimeoutEnginePlay(true);
      if (currentChapterState.notation.focusedIndex[0] !== -1) {
        if (currentChapterState.notation.focusedIndex[0] == 0) {
          onTakeBack([0, 0]);
        } else if (currentChapterState.notation.focusedIndex[1] == 0) {
          onTakeBack([currentChapterState.notation.focusedIndex[0] - 1, 0]);
        } else {
          onTakeBack([currentChapterState.notation.focusedIndex[0] - 1, 1]);
        }
      }
    };
    const playNext = async () => {
      // onMessage({
      //   content: 'Fair play, touch-move it is.',
      //   participantId: 'chatGPT123456',
      //   idResponse:
      //     currentChapterState.messages[currentChapterState.messages.length - 1]
      //       .idResponse,
      // });
      // setTimeout(() => {
      //   engineMove(lines[1].slice(0, 4), true);
      // }, 1000);
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
    const play = async () => {
      setFreezeButton(true);
      addChessAi({
        moves: [],
        movesCount: 0,
        badMoves: 0,
        goodMoves: 0,
        orientationChange: false,
        mode: 'play',
        ratingChange: 0,
        puzzleRatting: 0,
        userPuzzleRating: currentChapterState.chessAiMode.userPuzzleRating,
        puzzleId: 0,
        prevUserPuzzleRating: currentChapterState.chessAiMode.userPuzzleRating,
        fen: currentChapterState.displayFen,
        responseId: '',
        message: '',
      });
      setTimeout(() => setFreezeButton(false), 3000);
    };
    const moveReaction = async (probabilityDiff: number) => {
      const content =
        probabilityDiff == -1
          ? 'Uh-oh, blunder alert 🚨 Take it back?'
          : probabilityDiff === 0
          ? 'Oops! This gives your opponent a strong chance.'
          : probabilityDiff === 1
          ? 'Nice! You’re gaining a slight edge.'
          : probabilityDiff === 2 &&
            'Excellent move! You’re taking control. ✅';
      const isAtLastMove =
        currentChapterState.notation.focusedIndex[0] ===
          currentChapterState.notation.history.length - 1 &&
        currentChapterState.notation.focusedIndex[1] ===
          (currentChapterState.notation.history.at(-1)?.length ?? 0) - 1;

      if (
        probabilityDiff === -1 &&
        currentChapterState.chessAiMode.mode === 'play' &&
        isAtLastMove
      ) {
        setTakeBakeShake(true);
        setTimeout(() => {
          setTakeBakeShake(false);
        }, 3000);
      }

      if (currentChapterState.chessAiMode.mode == 'play' && isAtLastMove) {
        setTimeout(() => {
          onMessage({
            content: content.toString(),
            participantId: 'chatGPT123456',
            idResponse:
              currentChapterState.messages[
                currentChapterState.messages.length - 1
              ].idResponse,
          });
        }, 400);
      }
    };

    // const importPgn = async () => {
    //   const fen = '7R/2r3P1/8/8/2b4p/P4k2/8/4K3 b - - 10 55';
    //   if (ChessFENBoard.validateFenString(fen).ok) {
    //     onQuickImport({ type: 'FEN', val: fen });
    //   } else if (isValidPgn(fen)) {
    //     onQuickImport({ type: 'PGN', val: fen });
    //   }
    // };

    // Instructor
    return (
      <div className="  flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
       {stockfish && currentChapterState.chessAiMode.mode !==''  && (
         <StockFishEngineAI
          ratingEngine={ratingEngine}
          newRatingEngine={newRatingEngine}
          fen={currentChapterState.displayFen}
          orientation={currentChapterState.orientation}
          puzzleMode={puzzleMode}
          playMode={playMode}
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
                <div className="flex flex-col flex-1 gap-2 min-h-0 overflow-scroll no-scrollbar">
                  {(currentChapterState.chessAiMode.mode === 'puzzle' ||
                    currentChapterState.chessAiMode.mode == 'popup') && (
                    <div className="block md:hidden">
                      <PuzzleScore
                        chessAiMode={currentChapterState.chessAiMode}
                      />
                    </div>
                  )}
                  <div className="flex-1 justify-between flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-4 md:pb-4 rounded-lg  ">
                    {currentChapterState.chessAiMode.mode !== 'review' ? (
                      <div className="mt-4 flex flex-col justify-between  h-full max-h-[340px] md:max-h-[380px] md:min-h-[300px] min-h-[200px] ">
                        <Conversation
                          currentChapterState={currentChapterState}
                          openViewSubscription={openViewSubscription}
                          onSelectPuzzle={puzzles}
                          onSelectRating={setRatingEngine}
                          pulseDot={pulseDot}
                          takeBack={takeBack}
                          playNext={playNext}
                          hint={hint}
                          userData={userData}
                          smallMobile={smallMobile}
                        />

                        <div
                          className={` relative  flex md:my-[20px] justify-around items-center gap-3 mt-3 my-[14px] ${
                            currentChapterState.chessAiMode.mode === 'top'
                              ? '10px'
                              : ''
                          }`}
                        >
                          {/* hidden md:flex  */}
                          <ButtonGreen
                            onClick={() => {
                              play();
                            }}
                            size="sm"
                            className=" md:max-w-[85px] max-w-[80px]"
                            style={{
                              maxWidth: smallMobile ? '68px' : '',
                            }}
                            disabled={
                              freezeButton ||
                              currentChapterState.messages[
                                currentChapterState.messages.length - 1
                              ]?.participantId.includes('sales') ||
                              currentChapterState.chessAiMode.mode == 'play'
                            }
                          >
                            <p>Play</p>
                          </ButtonGreen>
                          {/* <Button
                      onClick={() => {
                        openings();
                      }}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                    >
                      Openings
                    </Button> */}

                          <ButtonGreen
                            onClick={() => {
                              hint();
                            }}
                            size="sm"
                            className="md:max-w-[85px] max-w-[80px] "
                            style={{
                              maxWidth: smallMobile ? '70px' : '',
                            }}
                            disabled={
                              freezeButton ||
                              currentChapterState.messages[
                                currentChapterState.messages.length - 1
                              ]?.participantId.includes('sales') ||
                              Object.keys(currentChapterState.arrowsMap)
                                .length !== 0 ||
                              (currentChapterState.chessAiMode.mode !==
                                'puzzle' &&
                                currentChapterState.chessAiMode.mode !==
                                  'play') ||
                              stockfishMovesInfo ===
                                'no best moves,game is ended by checkmate'
                            }
                          >
                            {/* 🔍 */}
                            Hint
                          </ButtonGreen>

                          {/* <Button
                      onClick={() => {
                        importPgn();
                      }}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                    >
                      Import PGN
                    </Button> */}
                          <ButtonGreen
                            onClick={() => {
                              takeBack();
                            }}
                            disabled={
                              freezeButton ||
                              currentChapterState.notation.history.length < 1 ||
                              currentChapterState.chessAiMode.mode ==
                                'puzzle' ||
                              currentChapterState.notation.history.length -
                                1 !==
                                currentChapterState.notation.focusedIndex[0] ||
                              (currentChapterState.notation.history.length -
                                1 ==
                                currentChapterState.notation.focusedIndex[0] &&
                                currentChapterState.notation.history[
                                  currentChapterState.notation.history.length -
                                    1
                                ].length -
                                  1 !==
                                  currentChapterState.notation.focusedIndex[1])
                            }
                            size="sm"
                            className={`${
                              takeBakeShake ? 'animate-shake' : ''
                            } md:max-w-[92px] max-w-[80px]`}
                            style={{
                              maxWidth: smallMobile ? '75px' : '',
                            }}
                          >
                            Take Back
                          </ButtonGreen>

                          <ButtonGreen
                            onClick={() => {
                              puzzles();
                            }}
                            size="sm"
                            className=" md:max-w-[92px] max-w-[80px]"
                            disabled={
                              freezeButton ||
                              currentChapterState.messages[
                                currentChapterState.messages.length - 1
                              ]?.participantId.includes('sales')
                            }
                          >
                            New Puzzle
                          </ButtonGreen>
                        </div>
                      </div>
                    ) : (
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
                          {reviewData.length == 0 &&
                            currentChapterState.messages.length > 1 && (
                              <ButtonGreen
                                onClick={() => {
                                  analizeMatch();
                                }}
                                disabled={pulseDot || progressReview > 0}
                                size="sm"
                                className="bg-green-600 text-black"
                                 style={{color:'black'}}
                              >
                                <p>Game Review</p>
                              </ButtonGreen>
                            )}
                        </div>
                      </div>
                    )}
                    {(currentChapterState.chessAiMode.mode !== 'review' ||
                      reviewData?.length !== 0) && (
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
                      <div>
                        <div className="w-full mt-1 h-4 md:flex hidden overflow-hidden rounded mt-4 ">
                          <div
                            className={`bg-white transition-all duration-500`}
                            style={{ width: `${percentW}%` }}
                          ></div>
                          <div
                            className={`bg-black transition-all duration-500`}
                            style={{ width: `${percentB}%` }}
                          ></div>
                        </div>

                        {scoreCP !== 0 && (
                          <div className={` flex  items-center mt-2`}>
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

                  {(currentChapterState.chessAiMode.mode === 'puzzle' ||
                    currentChapterState.chessAiMode.mode === 'popup') && (
                    <div className="hidden md:block">
                      <PuzzleScore
                        chessAiMode={currentChapterState.chessAiMode}
                      />
                    </div>
                  )}

                  {/* {showEngine && (
                    <ChessEngineWithProvider
                      gameId={currentLoadedChapterId}
                      fen={currentChapterState.displayFen}
                      canAnalyze
                      onToggle={(s) =>
                        updateableSearchParams.set({ engine: Number(s) })
                      }
                    />
                  )} */}
                  <div
                    style={{
                      backgroundImage:
                        'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)',
                      height: isMobile
                        ? currentChapterState.chessAiMode.mode == 'puzzle'
                          ? 'calc(100% - 600px)'
                          : '52px'
                        : currentChapterState.chessAiMode.mode === 'puzzle'
                        ? 'calc(100% - 600px)'
                        : '290px',
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
                      focusedIndex={currentChapterState.notation?.focusedIndex}
                      onDelete={onHistoryNotationDelete}
                      onRefocus={onHistoryNotationRefocus}
                      isFocusedInput={isFocusedInput}
                    />
                  </div>
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
