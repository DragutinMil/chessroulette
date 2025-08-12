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
import { ChessEngineWithProvider } from '@app/modules/ChessEngine/ChesEngineWithProvider';
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

    const addQuestion = async (question: string) => {
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');
      if(userId){
      onMessage({
        content: question,
        participantId: userId,
        idResponse: '',
      });
    }
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 700);
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

      if (data.puzzle && data.puzzle.fen) {
        const changeOrientation =
          currentChapterState.orientation === data.answer.fen.split(' ')[1];
        const userRating =
          currentChapterState.chessAiMode.userPuzzleRating > 0
            ? currentChapterState.chessAiMode.userPuzzleRating
            : data.user_puzzle_rating;

        addChessAi({
          moves: data.puzzle.solution,
          movesCount: data.puzzle.solution.length / 2,
          badMoves: 0,
          goodMoves: 0,
          orientationChange: changeOrientation,
          mode: 'puzzle',
          prevEvaluation: 0,
          ratingChange: currentChapterState.chessAiMode.ratingChange,
          puzzleRatting: currentChapterState.chessAiMode.puzzleRatting,
          userPuzzleRating: userRating,
          puzzleId: data.puzzle.puzzle_id,
          prevUserPuzzleRating: userRating,
        });

        setTimeout(() => {
          if (ChessFENBoard.validateFenString(data.puzzle.fen).ok) {
            onQuickImport({ type: 'FEN', val: data.puzzle.fen });
          }
          const promote = data.puzzle.solution[0].slice(4, 5);
          const from = data.puzzle.solution[0].slice(0, 2);
          const to = data.puzzle.solution[0].slice(2, 4);
          const m = data.puzzle.solution[0]

            if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
          let promotionChess = m.slice(4, 5);
          let n = { from: from, to: to, promoteTo: promotionChess};
        
          const first_move = { from: from, to: to , toPromote:promote };
          setTimeout(() => onPuzzleMove(first_move), 800);
            }else{
           const first_move = { from: from, to: to };
          setTimeout(() => onPuzzleMove(first_move), 800);
            }
          
          
        }, 1000);

        //FIRST MOVE
      }
      onMessage({
        content: data.answer.text,
        participantId: 'chatGPT123456',
        idResponse: data.id,
      });
    };

    useEffect(() => {
      const length = currentChapterState.notation.history.length;
      if (length > 0) {
        //crni sam
        if (
          currentChapterState.orientation == 'b' &&
          // currentChapterState.orientation !==
          //   currentChapterState.displayFen.split(' ')[1]
          !isMyTurn &&
          currentChapterState.chessAiMode.movesCount > length
        ) {
          const from = currentChapterState.chessAiMode.moves[2 * length].slice(
            0,
            2
          ); // "d3"
          const to = currentChapterState.chessAiMode.moves[2 * length].slice(
            2,
            4
          );
           
        
          if (!isMyTurn) {
          
          //   const m=currentChapterState.chessAiMode.moves[2 * length]
          //    if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
              
          // let promotionChess = m.slice(4, 5);
          // let n = { from: from as Square, to: to as Square, promoteTo: promotionChess as string};
          // console.log('engine n',n)
          // setTimeout(() => onPuzzleMove(n), 800);
          //   }else{
           const n = { from: from as Square, to: to as Square};
          setTimeout(() => onPuzzleMove(n), 800);
            // }

          
          }
        } else if (
          currentChapterState.orientation == 'w' &&
          !isMyTurn &&
          currentChapterState.chessAiMode.movesCount >= length
        ) {
          const from = currentChapterState.chessAiMode.moves[
            2 * length - 2
          ].slice(0, 2); // "d3"
          const to = currentChapterState.chessAiMode.moves[
            2 * length - 2
          ].slice(2, 4);
         // const move = { from: from as Square, to: to as Square };
          if (!isMyTurn) {
           
            const m=currentChapterState.chessAiMode.moves[2 * length]
          //    if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
              
          // let promotionChess = m.slice(4, 5);
          // let n = { from: from as Square, to: to as Square, promoteTo: promotionChess as string};
          // console.log('engine n',n)
          // setTimeout(() => onPuzzleMove(n), 800);
          //   }else{
           const n = { from: from as Square, to: to as Square};
          setTimeout(() => onPuzzleMove(n), 800);
            // }

          }
        }
      }
    }, [currentChapterState.chessAiMode.goodMoves]);

    useEffect(() => {
      if (currentChapterState.chessAiMode.badMoves > 0 && isMyTurn) {
        const responses = [
          'That wasn’t the right move.',
          'Would you like a hint, or try again on your own?',
          // "No 🚫, try something else!"
        ];
        
        const randomIndex = Math.floor(Math.random() * responses.length);
        console.log()
        if(currentChapterState.messages[currentChapterState.messages.length-1].content !== "That wasn’t the right move." &&
          currentChapterState.messages[currentChapterState.messages.length-1].content !== "Would you like a hint, or try again on your own?"
        ){
onMessage({
          content: responses[randomIndex],
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
        }
        
        // setTimeout(
        //   () =>
        //     addChessAi({
        //       moves: currentChapterState.chessAiMode.moves,
        //       movesCount: currentChapterState.chessAiMode.movesCount,
        //       badMoves: 0,
        //       goodMoves:currentChapterState.chessAiMode.goodMoves,
        //       orientationChange: false,
        //       prevEvaluation: currentChapterState.chessAiMode.prevEvaluation,
        //       mode: 'puzzle',
        //       ratingChange: 0,
        //       puzzleRatting: currentChapterState.chessAiMode.puzzleRatting,
        //       userPuzzleRating:currentChapterState.chessAiMode.userPuzzleRating,
        //       puzzleId: currentChapterState.chessAiMode.puzzleId,
        //       prevUserPuzzleRating:  currentChapterState.chessAiMode.prevUserPuzzleRating,
        //     }),
        //   1000
        // );
      }
    }, [currentChapterState.chessAiMode.badMoves]);

    useEffect(() => {
      if (
        currentChapterState.chessAiMode.goodMoves ===
        currentChapterState.chessAiMode.moves.length &&
        currentChapterState.chessAiMode.goodMoves % 2 === 0 &&
        currentChapterState.chessAiMode.goodMoves > 0
      ) {
        const responses = [
          'Congratulations! You solved it 🎉',
          'You did it! On to the next one 🚀',
          'Great work! You nailed it 🧠',
        ];
        const randomIndex = Math.floor(Math.random() * responses.length);
        onMessage({
          content: responses[randomIndex],
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
        setTimeout(
          () =>
            addChessAi({
              moves: currentChapterState.chessAiMode.moves,
              movesCount: 0,
              badMoves: 0,
              goodMoves: 0,
              orientationChange: false,
              prevEvaluation: currentChapterState.chessAiMode.prevEvaluation,
              mode: 'popup',
              ratingChange: currentChapterState.chessAiMode.ratingChange,
              puzzleRatting: currentChapterState.chessAiMode.puzzleRatting,
              userPuzzleRating:currentChapterState.chessAiMode.userPuzzleRating,
              puzzleId: currentChapterState.chessAiMode.puzzleId,
              prevUserPuzzleRating:  currentChapterState.chessAiMode.prevUserPuzzleRating,
            }),
          1000
        );
      }
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

        onMessage({
          content: responses[randomIndex],
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
      }
    }, [currentChapterState.chessAiMode.goodMoves]);

    
const isMate = async () => {
  if(currentChapterState.chessAiMode.mode=='play'){
    setTimeout(
              () =>
          addChessAi({
             mode: 'checkmate',
             moves: currentChapterState.chessAiMode.moves,
              movesCount: 0,
              badMoves: 0,
              goodMoves: 0,
              orientationChange: false,
              prevEvaluation: 0,
              ratingChange: 0,
              puzzleRatting: 0,
              userPuzzleRating:currentChapterState.chessAiMode.userPuzzleRating,
              puzzleId: 0,
              prevUserPuzzleRating:  currentChapterState.chessAiMode.prevUserPuzzleRating
          }),
              1000
            );
      }
  
      
    }
    // const openings = async () => {
    //   addChessAi({
    //     moves: [],
    //     movesCount: 0,
    //     badMoves: 0,
    //     goodMoves: 0,
    //     orientationChange: false,
    //     mode: 'openings',
    //     prevEvaluation: 0,
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
      } else {
        const circle = [fieldFrom, color];
        setHintCircle(true);
        onCircleDraw(circle as CircleDrawTuple);
      }
      const piece = await CheckPiece(
        fieldFrom as Square,
        currentChapterState.displayFen
      );
      if (
        !currentChapterState.messages[
          currentChapterState.messages.length - 1
        ].content.includes('Think about using')
      ) {
        onMessage({
          content: `Think about using your ${piece}`,
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
      }
    };

    const engineMove = (m: any) => {
      
      if (!isMyTurn && currentChapterState.chessAiMode.mode=='play') {
        setStockfishMovesInfo(m);
        let fromChess = m.slice(0, 2);
        let toChess = m.slice(2, 4);
        if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
          let promotionChess = m.slice(4, 5);
          let n = { from: fromChess, to: toChess, promoteTo: promotionChess };
         
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
          prevEvaluation: 0,
          puzzleRatting: data.rating,
          userPuzzleRating: userRating,
          ratingChange: 0,
          puzzleId: data.puzzle_id,
          prevUserPuzzleRating: userRating,
        });
        onQuickImport({ type: 'FEN', val: data.fen });
        //FIRST MOVE
        const from = data.solution[0].slice(0, 2);
        const to = data.solution[0].slice(2, 4);
        const m = data.solution[0]
        // if (m.length == 5 && (m.slice(-1) == 'q' || m.slice(-1) == 'r')) {
        //   let promotionChess = m.slice(4, 5);
        //   let n = { from: from, to: to, promoteTo: promotionChess};
        // const promote = m.slice(4, 5);
        //   const first_move = { from: from, to: to , toPromote:promote };
        //   setTimeout(() => onPuzzleMove(first_move), 800);
        //     }else{
           const first_move = { from: from, to: to };
          setTimeout(() => onPuzzleMove(first_move), 1200);
            // }
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
      engineMove(lines[1].slice(0, 4));
    };
    const play = async () => {
      if(currentChapterState.chessAiMode.mode==''){
        const content="Awesome, let's play chess."
         onMessage({
          content: content,
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
      }else if(currentChapterState.chessAiMode.mode=='puzzle'){
         const content="Let's finish the game properly!"
         onMessage({
          content: content,
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
      }
      addChessAi({
        moves: [],
        movesCount: 0,
        badMoves: 0,
        goodMoves: 0,
        orientationChange: false,
        mode: 'play',
        prevEvaluation: currentChapterState.chessAiMode.prevEvaluation,
        ratingChange: 0,
        puzzleRatting: 0,
        userPuzzleRating: currentChapterState.chessAiMode.userPuzzleRating,
        puzzleId: 0,
        prevUserPuzzleRating: currentChapterState.chessAiMode.userPuzzleRating,
      });
    };
    const moveReaction = async (moveDeffinition: number) => {
      const content =
        moveDeffinition == 1 ? 'Great move! ✅' : 'Uhhhh, bad move❗';
      if (currentChapterState.chessAiMode.mode == 'play') {
        onMessage({
          content: content,
          participantId: 'chatGPT123456',
          idResponse:
            currentChapterState.messages[
              currentChapterState.messages.length - 1
            ].idResponse,
        });
      }
    };

    const importPgn = async () => {
      const fen = '7R/2r3P1/8/8/2b4p/P4k2/8/4K3 b - - 10 55';
      if (ChessFENBoard.validateFenString(fen).ok) {
        onQuickImport({ type: 'FEN', val: fen });
      } else if (isValidPgn(fen)) {
        onQuickImport({ type: 'PGN', val: fen });
      }
    };

    // Instructor
    return (
      <div className="  flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
        <StockFishEngineAI
          fen={currentChapterState.displayFen}
          prevScore={currentChapterState.chessAiMode.prevEvaluation}
          puzzleMode={puzzleMode}
          playMode={playMode}
          engineLines={engineLines}
          IsMate={isMate}
          isMyTurn={isMyTurn}
          engineMove={engineMove}
          addGameEvaluation={addGameEvaluation}
          moveReaction={moveReaction}
        />

        <Tabs
          containerClassName=" flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl"
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
                  <div
                    className="border border-conversation-100 py-2 px-2 md:px-4 md:py-4 rounded-lg "
                    style={{
                      background: `radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)`,
                    }}
                  >
                    <Conversation
                      currentChapterState={currentChapterState}
                      onSelectPuzzle={puzzles}
                      pulseDot={pulseDot}
                      takeBack={takeBack}
                      playNext={playNext}
                      hint={hint}
                    />
                    <div className="flex my-[20px] justify-around  sitems-center gap-3 hidden md:flex ">
                      <ButtonGreen
                        onClick={() => {
                          play();
                        }}
                        size="lg"
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
                        size="lg"
                        disabled={
                          currentChapterState.chessAiMode.mode !== 'puzzle'
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
                          currentChapterState.notation.history.length < 2
                        }
                        size="lg"
                      >
                        Take Back
                      </ButtonGreen>
                      <ButtonGreen
                        onClick={() => {
                          puzzles();
                        }}
                        size="lg"
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
                        className="w-full text-sm rounded-[20px] border  border-conversation-100 bg-[#111111]/40 text-white placeholder-slate-400 px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
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
                  {currentChapterState.chessAiMode.mode=='puzzle' && (
                    <div>
                    <PuzzleScore
                      chessAiMode={currentChapterState.chessAiMode}
                    />
                    {/* <p className="w-100% text-sm text-slate-500 ">
                      Line 1: {lines[1].slice(0, 20)}
                    </p> */}
                    {/* <p className="w-100% text-sm text-slate-500">
                      Line 2: {lines[2].slice(0, 20)}
                    </p>
                    <p className=" w-100% text-sm text-slate-500">
                      Line 3: {lines[3].slice(0, 20)}
                    </p> */}
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
                      height: currentChapterState.chessAiMode.mode=='puzzle'? 'calc(100% - 600px)':'calc(100% - 300px)',
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
