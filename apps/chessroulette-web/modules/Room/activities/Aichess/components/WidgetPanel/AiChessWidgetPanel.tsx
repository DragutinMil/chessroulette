import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Button } from '@app/components/Button';
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
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import Conversation from './Conversation';
import { Square } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { SendQuestion } from './SendQuestion';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { ChessEngineWithProvider } from '@app/modules/ChessEngine/ChesEngineWithProvider';
import { Switch } from '@app/components/Switch';
import { getOpenings, getPuzzle } from '../../util';
// import { generateGptResponse } from '../../../../../../server.js';
type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;
  onPuzzleMove: (move: MovePiece) => void;
  onTakeBack: () => void;
  puzzleOrientation: () => void;
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];

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
      onPuzzleMove,
      puzzleOrientation,
      addChessAi,
      onMessage,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    // const settings = useAichessActivitySettings();
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const updateableSearchParams = useUpdateableSearchParams();
    const [pulseDot, setPulseDot] = useState(false);

    const [answer, setAnswer] = useState(null);
    const [question, setQuestion] = useState('');
    const [stockfishMovesInfo, setStockfishMovesInfo] = useState('');

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
    // const playMode = currentChapterState.chessAiMode.mode === 'play';
    // const puzzleMode = currentChapterState.chessAiMode.mode === 'puzzle';

    const addQuestion = async (question: string) => {
      onMessage({
        content: question,
        participantId: '8UWCweKl1Gvoi',
        idResponse: '',
      });
      setQuestion('');
      setTimeout(() => {
        setPulseDot(true);
      }, 700);
      const data = await SendQuestion(
        question,
        currentChapterState,
        stockfishMovesInfo
      );
      if (data) {
        setPulseDot(false);
      }
      setAnswer(data.answer.text);

      if (data.puzzle && data.puzzle.fen) {
        const changeOrientation =
          currentChapterState.orientation === data.answer.fen.split(' ')[1];
        addChessAi({
          moves: data.puzzle.solution,
          movesCount: data.puzzle.solution.length / 2,
          badMoves: 0,
          goodMoves: 0,
          orientationChange: changeOrientation,
          mode: 'puzzle',
        });
        onQuickImport({ type: 'FEN', val: data.fen });
        //FIRST MOVE
        const from = data.puzzle.solution[0].slice(0, 2);
        const to = data.puzzle.solution[0].slice(2, 4);
        const first_move = { from: from, to: to };
        setTimeout(() => onPuzzleMove(first_move), 1200);
      }
      onMessage({
        content: data.answer.text,
        participantId: 'chatGPT123456',
        idResponse: data.id,
      });

      //   // if (data.answer.fen) {
      //   //   if (ChessFENBoard.validateFenString(data.answer.fen).ok) {
      //   //     onQuickImport({ type: 'FEN', val: data.answer.fen });
      //   //   } else if (isValidPgn(data.answer.fen)) {
      //   //     onQuickImport({ type: 'PGN', val: data.answer.fen });
      //   //   }
      //   // }
    };
    // useEffect(() => {
    //   const length = currentChapterState.notation.history.length;
    //   if (length > 0) {
    //     //crni sam
    //     if (
    //       currentChapterState.orientation == 'b' &&
    //       // currentChapterState.orientation !==
    //       //   currentChapterState.displayFen.split(' ')[1]
    //       !isMyTurn &&
    //       currentChapterState.chessAiMode.movesCount > length
    //     ) {
    //       const from = currentChapterState.chessAiMode.moves[2 * length].slice(
    //         0,
    //         2
    //       ); // "d3"
    //       const to = currentChapterState.chessAiMode.moves[2 * length].slice(
    //         2,
    //         4
    //       );
    //       const move = { from: from as Square, to: to as Square };
    //       if (!isMyTurn) {
    //         setTimeout(() => onPuzzleMove(move), 1000);
    //       }
    //     } else if (
    //       currentChapterState.orientation == 'w' &&
    //       !isMyTurn &&
    //       currentChapterState.chessAiMode.movesCount >= length
    //     ) {
    //       const from = currentChapterState.chessAiMode.moves[
    //         2 * length - 2
    //       ].slice(0, 2); // "d3"
    //       const to = currentChapterState.chessAiMode.moves[
    //         2 * length - 2
    //       ].slice(2, 4);
    //       const move = { from: from as Square, to: to as Square };
    //       if (!isMyTurn) {
    //         setTimeout(() => onPuzzleMove(move), 1000);
    //       }
    //     }
    //   }
    // }, [currentChapterState.chessAiMode.goodMoves]);

    // useEffect(() => {
    //   if (currentChapterState.chessAiMode.badMoves > 0 && isMyTurn) {
    //     onMessage({
    //       content: 'No :), try something else',
    //       participantId: 'chatGPT123456',
    //       idResponse:
    //         currentChapterState.messages[
    //           currentChapterState.messages.length - 1
    //         ].idResponse,
    //     });
    //     //Resetpovati bad moves na nulu !!!
    //   }
    // }, [currentChapterState.chessAiMode.badMoves]);

    // useEffect(() => {
    //   if (
    //     currentChapterState.chessAiMode.goodMoves ==
    //       currentChapterState.chessAiMode.moves.length &&
    //     currentChapterState.chessAiMode.goodMoves % 2 === 0 &&
    //     currentChapterState.chessAiMode.goodMoves > 0
    //   ) {
    //     onMessage({
    //       content: 'Congrats! You made it!!! ',
    //       participantId: 'chatGPT123456',
    //       idResponse:
    //         currentChapterState.messages[
    //           currentChapterState.messages.length - 1
    //         ].idResponse,
    //     });
    //     setTimeout(
    //       () =>
    //         addChessAi({
    //           moves: currentChapterState.chessAiMode.moves,
    //           movesCount: 0,
    //           badMoves: 0,
    //           goodMoves: 0,
    //           orientationChange: false,
    //           mode: 'popup',
    //         }),
    //       1000
    //     );
    //   }
    //   if (
    //     currentChapterState.chessAiMode.goodMoves > 0 &&
    //     currentChapterState.chessAiMode.goodMoves % 2 === 0 &&
    //     currentChapterState.chessAiMode.goodMoves <
    //       currentChapterState.chessAiMode.moves.length
    //   ) {
    //     onMessage({
    //       content: 'Nice move! ✅',
    //       participantId: 'chatGPT123456',
    //       idResponse:
    //         currentChapterState.messages[
    //           currentChapterState.messages.length - 1
    //         ].idResponse,
    //     });
    //   }
    // }, [currentChapterState.chessAiMode.goodMoves]);

    const openings = async () => {
      addChessAi({
        moves: [],
        movesCount: 0,
        badMoves: 0,
        goodMoves: 0,
        orientationChange: false,
        mode: 'openings',
      });
      setAnswer(null);
      const data = await getOpenings();
      const fullQuestion =
        data.name +
        ' ' +
        data.pgn +
        '. Analyze opening, give me short explanation of advantages';

      onQuickImport({ type: 'PGN', val: data.pgn });
      addQuestion(fullQuestion);
    };
    const engineMove = (m: any) => {
      let fromChess = m.slice(0, 2);
      let toChess = m.slice(2, 4);
      if (m.length == 5 && m.slice(-1) == 'q') {
        let promotionChess = m.slice(4, 5);
        let n = { from: fromChess, to: toChess, promoteTo: promotionChess };
        setTimeout(() => onPuzzleMove(n), 1000);
      } else {
        let n = { from: fromChess, to: toChess };
        setTimeout(() => onPuzzleMove(n), 1000);
      }
    };
    const stockfishInfo = (m: any) => {
      setStockfishMovesInfo(m);
    };

    const puzzles = async () => {
      const data = await getPuzzle();
      if (ChessFENBoard.validateFenString(data.fen).ok) {
        const changeOrientation =
          currentChapterState.orientation === data.fen.split(' ')[1];
        addChessAi({
          moves: data.movez,
          movesCount: data.move_count,
          badMoves: 0,
          goodMoves: 0,
          orientationChange: changeOrientation,
          mode: 'puzzle',
        });
        onQuickImport({ type: 'FEN', val: data.fen });
        //FIRST MOVE
        const from = data.movez[0].slice(0, 2);
        const to = data.movez[0].slice(2, 4);
        const first_move = { from: from, to: to };
        setTimeout(() => onPuzzleMove(first_move), 1200);
      }
    };

    const takeBack = async () => {
      onTakeBack();
    };
    const play = async () => {
      addChessAi({
        moves: [],
        movesCount: 0,
        badMoves: 0,
        goodMoves: 0,
        orientationChange: false,
        mode: 'play',
      });
      const fen = currentChapterState.displayFen;
      //const datar= '1. e4 e5 (1. e3 e6) 2. Nf3 Nc6 $3 $17 3. Bc4 Nf6 4. Nc3 Bc5 5. d3 a6 6. a3 b5 7. Ba2 Qe7 8. Bg5 h6 9. Bh4 g5 10. Nxg5 hxg5 11. Bxg5 Rg8 12. h4 Nd4 13. Nd5 Qd6 14. Nxf6+ Kf8 15. Nxg8 Kxg8 16. Qh5 Nxc2+ 17. Kd2 Nxa1 18. Qxf7+ Kh8 19. Qg8#'
      // const datar= '1... Qxf3 2. Nxf3 Rxh3+ 3. Kg1 Rxf3 4. Nc4'
      if (ChessFENBoard.validateFenString(fen).ok) {
        onQuickImport({ type: 'FEN', val: fen });
      } else if (isValidPgn(fen)) {
        onQuickImport({ type: 'PGN', val: fen });
      }
    };
    //        const importPgn= async () => {
    //         const fen = 'r1bqkb1r/ppp2ppp/2n2n2/3pp3/4P3/2NP1NP1/PPP2P1P/R1BQKB1R b KQkq - 0 5'
    //  if (ChessFENBoard.validateFenString(fen).ok) {
    //               onQuickImport({ type: 'FEN', val: fen });
    //             } else if (isValidPgn(fen)) {
    //               onQuickImport({ type: 'PGN', val: fen });
    //             }
    //         }

    // Instructor
    return (
      <div className="  flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
        {/* <StockFishEngineAI
          fen={currentChapterState.displayFen}
          puzzleMode={puzzleMode}
          playMode={playMode}
          stockfishInfo={stockfishInfo}
          isMyTurn={isMyTurn}
          engineMove={engineMove}
        /> */}

        <Tabs
          containerClassName="  p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl"
          headerContainerClassName="flex gap-3 pb-3"
          contentClassName="flex-1 flex min-h-0"
          currentIndex={currentTabIndex}
          onTabChange={onTabChange}
          ref={tabsRef}
          tabs={[
            {
              id: 'notation',
              renderHeader: (p) => (
                <Button
                  onClick={() => {
                    p.focus();
                    chaptersTabProps.onDeactivateInputMode();
                  }}
                  size="sm"
                  className={` font-bold bg-slate-900`}
                >
                  {/* Notation */}
                </Button>
              ),
              renderContent: () => (
                <div className="flex flex-col flex-1 gap-2 min-h-0">
                  <Conversation
                    currentChapterState={currentChapterState}
                    pulseDot={pulseDot}
                  />

                  <div className="flex mb-2">
                    <input
                      id="title"
                      type="text"
                      name="tags"
                      placeholder="Enter message"
                      value={question}
                      // className="w-full my-2 text-sm rounded-md border-slate-500 focus:border-slate-400 border border-transparent block bg-slate-600 text-white block py-1 px-2"
                      className="w-full text-sm rounded-md border border-slate-600 bg-slate-700 text-white placeholder-slate-400 px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-500 hover:border-slate-500"
                      onChange={(e) => {
                        setQuestion(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          //e.preventDefault(); // sprečava novi red ako koristiš textarea
                          addQuestion(question);
                        }
                      }}
                    />
                    <Button
                      bgColor={'yellow'}
                      onClick={() => {
                        if (question.trim() !== '') {
                          addQuestion(question);
                        }
                      }}
                      disabled={question.trim() == ''}
                      icon="PaperAirplaneIcon"
                      size="sm"
                      className="ml-2 px-4 py-2 text-sm font-semibold text-white  rounded-md 
                        active:bg-slate-700 transition-colors 
                        duration-200"

                      //  className={`border bg-slate-600 font-bold border-transparent hover:bg-slate-800  my-2 ml-2 `}
                    ></Button>
                  </div>
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
                  <FreeBoardNotation
                    history={currentChapterState.notation?.history}
                    focusedIndex={currentChapterState.notation?.focusedIndex}
                    onDelete={onHistoryNotationDelete}
                    onRefocus={onHistoryNotationRefocus}
                  />
                  {/* <FenPreview fen={currentChapterState.displayFen} /> */}
                  <div className="flex  sitems-center gap-3 hidden md:flex ">
                    <label className="font-bold text-sm text-gray-400">
                      {/* Quick Import */}
                    </label>
                    {/* <Button
                      onClick={() => {
                        play();
                      }}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800  `}
                    >
                      {(currentChapterState.chessAiMode.mode == 'puzzle' ||
                        currentChapterState.chessAiMode.mode == 'openings') &&
                      currentChapterState.notation.history.length > 1 ? (
                        <p>Continue free play</p>
                      ) : (
                        <p>Play</p>
                      )}
                    </Button> */}
                    <Button
                      onClick={() => {
                        openings();
                      }}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                    >
                      Openings
                    </Button>
                    {/* <Button
                      onClick={() => {
                        importPgn();
                      }}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                    >
                      Import PGN
                    </Button> */}
                    <Button
                      onClick={() => {
                        takeBack();
                      }}
                      // disabled={isMyTurn}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                    >
                      Take Back
                    </Button>
                    <Button
                      onClick={() => {
                        puzzles();
                      }}
                      size="sm"
                      className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                    >
                      Puzzle
                    </Button>
                  </div>
                </div>
              ),
            },
            // {
            //   id: 'chapters',
            //   renderHeader: (p) => (
            //     <Button
            //       onClick={() => {
            //         p.focus();
            //         chaptersTabProps.onDeactivateInputMode();
            //       }}
            //       size="sm"
            //       className={`bg-slate-600 font-bold hover:bg-slate-800 ${
            //         p.isFocused && 'bg-slate-800'
            //       }`}
            //     >
            //       Chapters ({Object.keys(chaptersMap).length})
            //     </Button>
            //   ),
            //   renderContent: (p) => (
            //     <ChaptersTab
            //       chaptersMap={chaptersMap}
            //       chaptersMapIndex={chaptersMapIndex}
            //       currentLoadedChapterId={currentLoadedChapterId}
            //       className="min-h-0"
            //       tabsNav={p.nav}
            //       onImportInput={onImport}
            //       {...chaptersTabProps}
            //     />
            //   ),
            // },
          ]}
        />
      </div>
    );
  }
);
