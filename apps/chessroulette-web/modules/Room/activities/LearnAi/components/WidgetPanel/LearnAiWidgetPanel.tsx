import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';

import { ChessFENBoard, FreeBoardHistory, isValidPgn } from '@xmatter/util-kit';
import { Button } from '@app/components/Button';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
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
  Message,
  UserData,
  EvaluationMove,
  aiLearn,
} from '../../movex/types';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
import { QuickConfirmButton } from '@app/components/Button/QuickConfirmButton';
import Conversation from './Conversation';

import { Square, Chess } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { SendQuestionCoach } from './SendQuestionCoach';

import { CheckPiece } from './CheckPiece';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { ChessEngineProbabilityCalc } from '@app/modules/ChessEngine/components/ChessEngineCalculator';
import { Switch } from '@app/components/Switch';
import { getOpenings, analyzeMovesPGN, getWikibooksContent } from '../../util';

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

  onMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  onMessage: (message: Message) => void;
  playerNames: Array<string>;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  historyBackToStart: () => void;
  onCanPlayChange: (canPlay: boolean) => void;
  userData: UserData;
  addLearnAi: (data: aiLearn) => void;
  onFlipBoard?: () => void;

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

export const LearnAiWidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      // engine,
      onCanPlayChange,
      addLearnAi,
      playerNames,
      showEngine,
      onImport,
      onTakeBack,
      onCircleDraw,
      onArrowsChange,
      onMove,
      onMessage,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      historyBackToStart,
      onFlipBoard, // Destrakturisanje propa
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

    const [startOpening, setStartOpening] = useState({});
    const [analyzedPGN, setAnalyzedPGN] = useState({});
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

    const [wikiContent, setWikiContent] = useState<string>('');
    const [isWikiLoading, setIsWikiLoading] = useState(false);

    // Debounced function to fetch wiki content
    const fetchWikiContent = useCallback(async (history: any[]) => {
      let title = "Chess_Opening_Theory";
      // Construct title from history
      history.forEach((pair, index) => {
        const moveNum = index + 1;
        // White move
        if (pair[0]) {
          title += `/${moveNum}._${pair[0].san}`;
        }
        // Black move
        if (pair[1]) {
          title += `/${moveNum}...${pair[1].san}`;
        }
      });

      console.log("Auto-Fetching Wiki Title:", title);
      try {
        const data = await getWikibooksContent(title);

        if (data && data.query && data.query.pages) {
          const pages = data.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].missing) {
            setWikiContent("No Wikibooks article found for this exact variation.");
          } else {
            setWikiContent(pages[pageId].extract);
          }
        } else {
          setWikiContent("No content available.");
        }
      } catch (e) {
        console.error("Wiki fetch error", e);
      }
    }, []);

    const debouncedFetchWiki = useMemo(
      () => debounce(fetchWikiContent, 500),
      [fetchWikiContent]
    );

    // Effect to follow the board (PGN/History)
    useEffect(() => {
      if (currentChapterState?.notation?.history) {
        const { history, focusedIndex } = currentChapterState.notation;
        let activeHistory: any[] = history;

        if (focusedIndex && focusedIndex.length === 2) {
          const [moveIdx, colorIdx] = focusedIndex;
          if (moveIdx === -1) {
            activeHistory = [];
          } else {
            // Slice up to the current move pair
            activeHistory = history.slice(0, moveIdx + 1).map((pair, idx) => {
              // If it's the last pair we are looking at, check if we should exclude black's move
              if (idx === moveIdx && colorIdx === 0) {
                return [pair[0], null];
              }
              return pair;
            });
          }
        }

        debouncedFetchWiki(activeHistory);
      }
    }, [currentChapterState.notation.history, currentChapterState.notation.focusedIndex, debouncedFetchWiki]);


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
      if (
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

      const uciMoves = currentChapterState.notation.history
        .flat()
        .map((move) => `${move.from}${move.to}`)
        .join(' ');

      const data = await SendQuestionCoach(
        question,
        currentChapterState,
        uciMoves
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
    };

    useEffect(() => {
      if (currentChapterState.aiLearn.mode == 'opening' && !stockfish) {
        setTimeout(() => setStockfish(true), 3000);
      }
    }, [currentChapterState.aiLearn.mode]);

    const isMate = async () => {
      setStockfishMovesInfo('no best moves,game is ended by checkmate');
    };

    const ratingEngine = (rating: number) => {
      setCurrentRatingEngine(rating);
    };

    const engineLines = (m: StockfishLines) => {
      setLines(m);
    };

    const openViewSubscription = async () => {
      (window.location.href = 'https://app.outpostchess.com/subscribe'),
        '_self';
    };

    const setRatingEngine = async (category: number) => {
      // Placeholder logic
    };

    const openings = async () => {
      const data = await getOpenings();

      const pgn = data.pgn;
      const chess = new Chess();
      chess.loadPgn(pgn);
      const uciMoves = chess
        .history({ verbose: true })
        .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`);
      addLearnAi({
        ...currentChapterState.aiLearn,
        mode: 'opening',
        name: data.name,
        moves: uciMoves,
      });
    };

    const analyzeMoves = async () => {
      const uciMoves = currentChapterState.notation.history
        .flat()
        .map((move) => `${move.from}${move.to}`)
        .join(' ');

      const openingMoves = await analyzeMovesPGN(uciMoves);
      setAnalyzedPGN(openingMoves);
      console.log('data moves', openingMoves);
      const question = '';
      const answer = await SendQuestionCoach(
        question,
        currentChapterState,
        uciMoves
      );
    };

    const manualFetchWiki = () => {
      onTabChange({ tabIndex: 1 });
    };

    const takeBack = async () => {
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
    const playNext = async () => { };
    const engineMove = async () => { };
    const hint = async () => { };

    const handleGameEvaluation = (newScore: number) => {
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
    };
    const play = async () => {
      setFreezeButton(true);
    };

    return (
      <div className="  flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
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
                <div
                  className={`cursor-pointer px-4 py-2 text-sm font-bold rounded-lg ${currentTabIndex === 0 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  onClick={() => onTabChange({ tabIndex: 0 })}
                >
                  Assistant
                </div>

              ),
              renderContent: () => (
                <div className="flex flex-col flex-1 gap-2 min-h-0 overflow-scroll no-scrollbar">
                  <div className="flex-1 justify-between flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-4 md:pb-4 rounded-lg  ">
                    <div className="mt-4 flex flex-col justify-between  h-full max-h-[340px] md:max-h-[380px] md:min-h-[300px] min-h-[200px] ">
                      <Conversation
                        currentChapterState={currentChapterState}
                        openViewSubscription={openViewSubscription}
                        onSelectRating={setRatingEngine}
                        pulseDot={pulseDot}
                        takeBack={takeBack}
                        playNext={playNext}
                        hint={hint}
                        userData={userData}
                        smallMobile={smallMobile}
                      />

                      <div
                        className={` relative  flex md:my-[20px] justify-around items-center gap-3 mt-3 my-[14px] `}
                      >
                        <ButtonGreen
                          onClick={() => {
                            play();
                          }}
                          size="sm"
                          className=" md:max-w-[100px] max-w-[100px]"
                          style={{
                            maxWidth: smallMobile ? '68px' : '',
                          }}
                        >
                          <p>Play</p>
                        </ButtonGreen>
                        <ButtonGreen
                          onClick={() => {
                            openings();
                          }}
                          size="sm"
                          className=" md:max-w-[100px] max-w-[100px]"
                          style={{
                            maxWidth: smallMobile ? '68px' : '',
                          }}
                        >
                          <p>Openings</p>
                        </ButtonGreen>
                        <ButtonGreen
                          onClick={() => {
                            analyzeMoves();
                          }}
                          size="sm"
                          className=" md:max-w-[100px] max-w-[100px]"
                          style={{
                            maxWidth: smallMobile ? '68px' : '',
                          }}
                        >
                          <p>Analyze</p>
                        </ButtonGreen>
                        <ButtonGreen
                          onClick={() => {
                            manualFetchWiki();
                          }}
                          size="sm"
                          className=" md:max-w-[100px] max-w-[100px]"
                          style={{
                            maxWidth: smallMobile ? '68px' : '',
                          }}
                        >
                          <p>Wiki</p>
                        </ButtonGreen>

                        {/* Flip Board Button - Poziva funkciju koju si definisao */}
                        <ButtonGreen
                          onClick={() => {
                            if (onFlipBoard) onFlipBoard();
                          }}
                          size="sm"
                          className="md:max-w-[100px] max-w-[100px]"
                          style={{
                            maxWidth: smallMobile ? '68px' : '',
                          }}
                        >
                          <p>Flip</p>
                        </ButtonGreen>

                        <ButtonGreen
                        onClick={() => {
                        const history = currentChapterState.notation?.history ?? [];
                        if (history.length > 0) {
                           const lastIndex = FreeBoardHistory.getLastIndexInHistory(history);
                           onHistoryNotationDelete(lastIndex);
                          }
                        }}
                        size="sm"
                        className="md:max-w-[100px] max-w-[100px]"
                        style={{
                        maxWidth: smallMobile ? '68px' : '',
                        }}
                        disabled={
                          !currentChapterState.notation?.history?.length
                        }
                        >
                       <p>Undo</p>
                       </ButtonGreen>

                        {/* Reset Button - Anulira PGN i resetuje tablu */}
                        <ButtonGreen
                          onClick={() => {
                            onQuickImport({ type: 'FEN', val: ChessFENBoard.STARTING_FEN });
                            onArrowsChange({});
                          }}
                          size="sm"
                          className="md:max-w-[100px] max-w-[100px]"
                          style={{
                            maxWidth: smallMobile ? '68px' : '',
                          }}
                        >
                          <p>Reset</p>
                        </ButtonGreen>

                      </div>
                    </div>

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

                  <div
                    style={{
                      backgroundImage:
                        'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)',
                      height: isMobile
                        ? currentChapterState.aiLearn.mode == 'opening'
                          ? 'calc(100% - 600px)'
                          : '52px'
                        : currentChapterState.aiLearn.mode === 'midgame'
                          ? 'calc(100% - 600px)'
                          : '290px',
                      minHeight: isMobile ? '52px' : '202px',
                    }}
                    className={`
                      ${currentChapterState.aiLearn.mode === 'midgame'
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
                </div>
              ),
            },
            {
              id: 'wiki',
              renderHeader: (p) => (
                <div
                  className={`cursor-pointer px-4 py-2 text-sm font-bold rounded-lg ${currentTabIndex === 1 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  onClick={() => onTabChange({ tabIndex: 1 })}
                >
                  Wiki
                </div>
              ),
              renderContent: () => (
                <div className="flex flex-col flex-1 gap-2 min-h-0 overflow-scroll no-scrollbar p-4 bg-slate-900 rounded-lg text-white">
                  <h3 className="text-xl font-bold mb-2">Wikibooks Opening Theory</h3>
                  {isWikiLoading ? (
                    <div>Loading...</div>
                  ) : (
                    <div
                      className="prose prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: wikiContent || "Select a move and click 'Wiki Info' to see opening theory." }}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      </div>
    );
  }
);