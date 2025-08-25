import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
} from '../../movex/types';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import Conversation from './Conversation';
import PuzzleScore from './PuzzleScore';
import { Square } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { SendQuestion } from './SendQuestion';
import { CheckPiece } from './CheckPiece';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { ChessEngineProbabilityCalc } from '@app/modules/ChessEngine/components/ChessEngineCalculator';
import { Switch } from '@app/components/Switch';
import { getOpenings, getPuzzle } from '../../util';

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
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  puzzleOrientation: () => void;
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  addGameEvaluation: (score: number) => void;
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

export const AiChessWidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      // engine,
      showEngine,
      onImport,
      onTakeBack,
      onCircleDraw,
      onArrowsChange,
      onPuzzleMove,
      puzzleOrientation,
      addChessAi,
      onMessage,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      addGameEvaluation,
      userData,

      ...chaptersTabProps
    },
    tabsRef
  ) => {
    // const settings = useAichessActivitySettings();
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const updateableSearchParams = useUpdateableSearchParams();
    const [pulseDot, setPulseDot] = useState(false);
    const [answer, setAnswer] = useState(null);
    const [hintCircle, setHintCircle] = useState(false);
    const [isFocusedInput, setIsFocusedInput] = useState(false);
    const [question, setQuestion] = useState('');
    const [takeBakeShake, setTakeBakeShake] = useState(false);

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
    //console.log('currentChapterState',currentChapterState)
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
    //console.log('Object.keys(currentChapterState.arrowsMap).length == 0',Object.keys(currentChapterState.arrowsMap).length)

    const addQuestion = async (question: string) => {
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');
      if (userId) {
        onMessage({
          content: question,
          participantId: userId,
          idResponse: '',
        });
      }
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 500);
      const data = await SendQuestion(
        question,
        currentChapterState,
        stockfishMovesInfo,
        lines[1]
      );
      if (data) {
        setPulseDot(false);
      }
      setAnswer(data.answer.text);

      console.log('fen ai', data.answer.fen);
      if (
        data.puzzle &&
        data.puzzle.fen &&
        ChessFENBoard.validateFenString(data.puzzle.fen).ok
      ) {
        console.log('fen ai 2', data.fen);
        const changeOrientation =
          currentChapterState.orientation === data.puzzle.fen.split(' ')[1];
        const userRating =
          currentChapterState.chessAiMode.userPuzzleRating > 0
            ? currentChapterState.chessAiMode.userPuzzleRating
            : data.user_puzzle_rating;

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

          if (
            (m.length == 5 &&
              (m.slice(-1) == 'q' ||
                m.slice(-1) == 'r' ||
                m.slice(-1) == 'k')) ||
            m.slice(-1) == 'b'
          ) {
            let n =
              currentChapterState.orientation == 'w'
                ? { from: from, to: to, promoteTo: 'q' }
                : { from: from, to: to, promoteTo: 'Q' };
            setTimeout(() => onPuzzleMove(n), 800);
          } else {
            const first_move = { from: from, to: to };
            setTimeout(() => onPuzzleMove(first_move), 800);
          }
        }, 1000);

        //FIRST MOVE
      } else if (
        data.answer.fen &&
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
        onMessage({
          content: data.answer.text,
          participantId: 'chatGPT123456',
          idResponse: data.id,
        });
      }
    };
    useEffect(() => {
      if (currentChapterState.evaluation.prevCp !== 0) {
        if (!isMyTurn) {
          const probability = async () => {
            const ProbabilityChange = await ChessEngineProbabilityCalc(
              currentChapterState.evaluation.newCp,
              currentChapterState.evaluation.prevCp
            );
            if (ProbabilityChange.diff < -10) {
              moveReaction(0);
            }
            console.log('probabilities', ProbabilityChange);
            if (ProbabilityChange.diff > 3) {
              console.log('probabilities', ProbabilityChange);
              if (ProbabilityChange.diff > 7) {
                moveReaction(2);
              } else moveReaction(1);
            }
          };
          probability();
        }
      }
    }, [currentChapterState.evaluation.newCp]);

    useEffect(() => {
      const length = currentChapterState.notation.history.length;

      // IF END OF PUZZLE RETURN
      if (
        currentChapterState.chessAiMode.goodMoves ===
          currentChapterState.chessAiMode.moves.length &&
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
          const m = currentChapterState.chessAiMode.moves[2 * length];
          if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
            let n = { from: from as Square, to: to as Square, promoteTo: 'Q' };
            console.log('engine n', n);
            setTimeout(() => onPuzzleMove(n), 800);
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
            const m = currentChapterState.chessAiMode.moves[2 * length - 2];
            if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
              let n = {
                from: from as Square,
                to: to as Square,
                promoteTo: 'q',
              };
              console.log('engine nk', n);
              setTimeout(() => onPuzzleMove(n), 800);
            } else {
              const n = { from: from as Square, to: to as Square };
              setTimeout(() => onPuzzleMove(n), 800);
            }
          }
        }
      }
    }, [currentChapterState.chessAiMode.goodMoves]);

    // useEffect(() => {
    // if (currentChapterState.chessAiMode.badMoves > 0 && isMyTurn) {
    //   const responses = [
    //     'That wasn’t the right move.',
    //     'Would you like a hint, or try again on your own?',
    //     // "No 🚫, try something else!"
    //   ];

    //   const prompt = responses[Math.floor(Math.random() * responses.length)];
    //   const idResponse =
    //     currentChapterState.messages[currentChapterState.messages.length - 1]
    //       .idResponse;
    //   if (
    //     currentChapterState.messages[currentChapterState.messages.length - 1]
    //       .content !== 'That wasn’t the right move.' &&
    //     currentChapterState.messages[currentChapterState.messages.length - 1]
    //       .content !== 'Would you like a hint, or try again on your own?'
    //   ) {

    //   }

    // setTimeout(
    //   () =>
    //     addChessAi({
    //       moves: currentChapterState.chessAiMode.moves,
    //       movesCount: currentChapterState.chessAiMode.movesCount,
    //       badMoves: 0,
    //       goodMoves:currentChapterState.chessAiMode.goodMoves,
    //       orientationChange: false,
    //       mode: 'puzzle',
    //       ratingChange: 0,
    //       puzzleRatting: currentChapterState.chessAiMode.puzzleRatting,
    //       userPuzzleRating:currentChapterState.chessAiMode.userPuzzleRating,
    //       puzzleId: currentChapterState.chessAiMode.puzzleId,
    //       prevUserPuzzleRating:  currentChapterState.chessAiMode.prevUserPuzzleRating,
    //     }),
    //   1000
    // );
    // }
    // }, [currentChapterState.chessAiMode.badMoves]);

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
      } else if (
        currentChapterState.chessAiMode.goodMoves ===
          currentChapterState.chessAiMode.moves.length &&
        currentChapterState.chessAiMode.goodMoves % 2 === 0 &&
        currentChapterState.chessAiMode.goodMoves > 0
      ) {
        setTimeout(
          () =>
            addChessAi({
              ...currentChapterState.chessAiMode,
              mode: 'popup',
              moves: [],
              movesCount: 0,
              badMoves: 0,
              goodMoves: 0,
              orientationChange: false,
              fen: currentChapterState.displayFen,
            }),
          1000
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
    // const openings = async () => {
    //   addChessAi({
    //     moves: [],
    //     movesCount: 0,
    //     badMoves: 0,
    //     goodMoves: 0,
    //     orientationChange: false,
    //     mode: 'openings',
    //     ratingChange: 0,
    //     puzzleRatting: 0,
    //     userPuzzleRating: currentChapterState.chessAiMode.userPuzzleRating,
    //     puzzleId: 0,
    //     prevUserPuzzleRating: 0,
    //   });
    //   setAnswer(null);
    //   const data = await getOpenings();
    //   const fullQuestion =
    //     data.name +
    //     ' ' +
    //     data.pgn +
    //     '. Analyze opening, give me short explanation of advantages';

    //   onQuickImport({ type: 'PGN', val: data.pgn });
    //   addQuestion(fullQuestion);
    // };
    const hint = async () => {
      // console.log('stockfishMovesInfo', stockfishMovesInfo);
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

      // if (
      //   !currentChapterState.messages[
      //     currentChapterState.messages.length - 1
      //   ].content.includes('Think about using')
      // ) {
      //   onMessage({
      //     content: `Think about using your ${piece}`,
      //     participantId: 'chatGPT123456',
      //     idResponse:
      //       currentChapterState.messages[
      //         currentChapterState.messages.length - 1
      //       ].idResponse,
      //   });
      // }
    };

    const engineMove = (m: any, n?: boolean) => {
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
      if (m.length == 0) {
        return;
      }

      if (
        !isMyTurn &&
        currentChapterState.chessAiMode.mode == 'play'
        // && (!currentChapterState.messages[
        //   currentChapterState.messages.length - 1
        // ].content.includes('Ouch,') ||
        //   n)
      ) {
        setHintCircle(false);
        let fromChess = m.slice(0, 2);
        let toChess = m.slice(2, 4);
        setStockfishMovesInfo(m);

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
          setTimeout(() => onPuzzleMove(n), 1000);
        } else {
          let n = { from: fromChess, to: toChess };
          setTimeout(() => onPuzzleMove(n), 1000);
        }
      } else {
        setStockfishMovesInfo(m);
      }
    };
    const engineLines = (m: StockfishLines) => {
      setLines(m);
    };

    const puzzles = async (category?: string) => {
      const data = await getPuzzle(category);

      if (ChessFENBoard.validateFenString(data.fen).ok) {
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
        setHintCircle(false);
        //FIRST MOVE
        const from = data.solution[0].slice(0, 2);
        const to = data.solution[0].slice(2, 4);
        const m = data.solution[0];
        if (
          m.length == 5 &&
          (m.slice(-1) == 'q' ||
            m.slice(-1) == 'r' ||
            m.slice(-1) == 'b' ||
            m.slice(-1) == 'k')
        ) {
          const first_move =
            currentChapterState.orientation == 'w'
              ? { from: from, to: to, promoteTo: 'q' }
              : { from: from, to: to, promoteTo: 'Q' };
          setTimeout(() => onPuzzleMove(first_move), 800);
        } else {
          const first_move = { from: from, to: to };
          setTimeout(() => onPuzzleMove(first_move), 1000);
        }
      }
    };

    const takeBack = async () => {
      if (currentChapterState.notation.focusedIndex[0] !== -1) {
        if (currentChapterState.notation.focusedIndex[1] == 0) {
          onTakeBack([currentChapterState.notation.focusedIndex[0] - 1, 1]);
        } else {
          onTakeBack([currentChapterState.notation.focusedIndex[0], 0]);
        }
      }
    };
    const playNext = async () => {
      onMessage({
        content: 'Fair play, touch-move it is.',
        participantId: 'chatGPT123456',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            .idResponse,
      });

      setTimeout(() => {
        engineMove(lines[1].slice(0, 4), true);
      }, 1000);
    };
    const play = async () => {
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
    };

    const moveReaction = async (probabilityDiff: number) => {
      const blunderText = [
        'That move hit a wall 😬 Shall we undo?',
        'Uh-oh, blunder alert 🚨 Take it back?',
      ];

      const prompt =
        blunderText[Math.floor(Math.random() * blunderText.length)];
      const content =
        probabilityDiff === 0
          ? prompt
          : probabilityDiff === 1
          ? 'Nice move'
          : probabilityDiff === 2 && 'Great move! ✅';
      if (
        probabilityDiff === 0 &&
        currentChapterState.chessAiMode.mode === 'play'
      ) {
        setTakeBakeShake(true);
        setTimeout(() => {
          setTakeBakeShake(false);
        }, 3000);
      }
      if (currentChapterState.chessAiMode.mode == 'play') {
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
        <StockFishEngineAI
          fen={currentChapterState.displayFen}
          prevScore={currentChapterState.evaluation.prevCp}
          puzzleMode={puzzleMode}
          playMode={playMode}
          engineLines={engineLines}
          IsMate={isMate}
          isMyTurn={isMyTurn}
          engineMove={engineMove}
          addGameEvaluation={addGameEvaluation}
          // moveReaction={moveReaction}
        />

        <Tabs
          containerClassName="overflow-scroll flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl no-scrollbar"
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
                <div className="flex flex-col flex-1 gap-2 min-h-0">
                  {(currentChapterState.chessAiMode.mode == 'puzzle' ||
                    currentChapterState.chessAiMode.mode == 'popup') && (
                    <div className="block md:hidden">
                      <PuzzleScore
                        chessAiMode={currentChapterState.chessAiMode}
                      />
                    </div>
                  )}
                  <div className="border bg-op-widget border-conversation-100 py-2 px-2 md:px-4 md:py-4 rounded-lg ">
                    <Conversation
                      currentChapterState={currentChapterState}
                      onSelectPuzzle={puzzles}
                      pulseDot={pulseDot}
                      takeBack={takeBack}
                      playNext={playNext}
                      hint={hint}
                      userData={userData}
                    />
                    <div className="flex md:my-[20px] justify-around  sitems-center gap-3 my-[14px]">
                      {/* hidden md:flex  */}
                      <ButtonGreen
                        onClick={() => {
                          play();
                        }}
                        size="sm"
                        disabled={
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
                        disabled={
                          Object.keys(currentChapterState.arrowsMap).length !==
                            0 ||
                          (currentChapterState.chessAiMode.mode !== 'puzzle' &&
                            currentChapterState.chessAiMode.mode !== 'play') ||
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
                          currentChapterState.notation.history.length < 1 ||
                          currentChapterState.chessAiMode.mode == 'puzzle'
                        }
                        size="sm"
                        className={takeBakeShake ? 'animate-shake' : ''}
                      >
                        Take Back
                      </ButtonGreen>
                      <ButtonGreen
                        onClick={() => {
                          puzzles();
                        }}
                        size="sm"
                      >
                        New Puzzle
                      </ButtonGreen>
                    </div>

                    <div className="flex mb-2 mt-2 md:mt-0">
                      <input
                        id="title"
                        type="text"
                        name="tags"
                        placeholder="Start cheesiness..."
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
                  </div>
                  {(currentChapterState.chessAiMode.mode == 'puzzle' ||
                    currentChapterState.chessAiMode.mode == 'popup') && (
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
                      height:
                        currentChapterState.chessAiMode.mode == 'puzzle'
                          ? 'calc(100% - 600px)'
                          : 'calc(100% - 300px)',
                    }}
                    className="hidden md:block rounded-lg border border-conversation-100 p-4 overflow-scroll"
                  >
                    <FreeBoardNotation
                      history={currentChapterState.notation?.history}
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
