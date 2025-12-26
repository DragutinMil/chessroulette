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
import { getOpenings, analyzeMovesPGN } from '../../util';

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

      // const pgn = currentChapterState.notation.history
      //   .map((pair, i) => {
      //     const white = pair[0]?.san || '';
      //     const black = pair[1]?.san || '';
      //     return `${i + 1}. ${white} ${black}`.trim();
      //   })
      //   .join(' ');
      const uciMoves = currentChapterState.notation.history
        .flat()
        .map((move) => `${move.from}${move.to}`)
        .join(' ');

      const data = await SendQuestionCoach(
        question,
        currentChapterState,
        // stockfishMovesInfo,
        // lines[1],
        // currentRatingEngine,
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
      // setPopupSubscribe(true);
      (window.location.href = 'https://app.outpostchess.com/subscribe'),
        '_self';
    };

    const setRatingEngine = async (category: number) => {
      // setRatingBotEngine(category);
      // onMessage({
      //   content: `The rating is now set to ${category}`,
      //   participantId: 'chatGPT123456',
      //   idResponse:
      //     currentChapterState.messages[currentChapterState.messages.length - 1]
      //       .idResponse,
      // });
    };

    const openings = async () => {
      const data = await getOpenings();

      // onQuickImport({ type: 'PGN', val: data.pgn });
      // const uciMoves = currentChapterState.notation.history
      // .flat()
      // .map(move => `${move.from}${move.to}`)
      // .join(' ');

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

      // const question = `introduce user about ${data.name} opening? Tell user to start with first move from ${data.pgn}`
      // const answer = await SendQuestionCoach(
      //     question,
      //     currentChapterState,
      //    // stockfishMovesInfo,
      //    // lines[1],
      //     //currentRatingEngine,
      //     uciMoves
      //   );
      //  checkAnswerGPT(answer);
    };

    const analyzeMoves = async () => {
      //kreiraj pgn UCI
      const uciMoves = currentChapterState.notation.history
        .flat()
        .map((move) => `${move.from}${move.to}`)
        .join(' ');

      //posalji na proveru
      const openingMoves = await analyzeMovesPGN(uciMoves);
      setAnalyzedPGN(openingMoves);
      console.log('data moves', openingMoves);
      const question = '';
      const answer = await SendQuestionCoach(
        question,
        currentChapterState,
        // stockfishMovesInfo,
        // lines[1],
        // currentRatingEngine,
        uciMoves
      );
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
    const playNext = async () => {};
    const engineMove = async () => {};
    const hint = async () => {};

    const handleGameEvaluation = (newScore: number) => {
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
    };
    const play = async () => {
      setFreezeButton(true);
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
        {/* {stockfish && (
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
        )} */}

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
                        {/* hidden md:flex  */}
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
                          Openings
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
                          Analyze Moves
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
                        {/* <ButtonGreen
                            onClick={() => {
                              takeBack();
                            }}
                            disabled={
                              freezeButton ||
                              currentChapterState.notation.history.length < 1  ||
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
                            } md:max-w-[100px] max-w-[100px]`}
                            style={{
                              maxWidth: smallMobile ? '75px' : '',
                            }}
                          >
                            Take Back
                          </ButtonGreen> */}
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

                    {/* {currentChapterState.aiLearn.mode == 'opening' && (
                      <div>
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
                    )} */}
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
                      ${
                        currentChapterState.aiLearn.mode === 'midgame'
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
