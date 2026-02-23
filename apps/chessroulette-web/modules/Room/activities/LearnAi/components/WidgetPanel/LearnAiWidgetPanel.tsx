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
import { getLichessTopMoves } from '../../util'; 
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
import { getOpenings, analyzeMovesPGN, 
  getWikibooksContent, getLichessBestMove, 
  getOpeningIdeas, getOpeningCommentFromAi,
  buildPgnFromMessageContent, getOpeningByUserInput, 
  getOpeningFromAiByName, extractOpeningNameFromPhrase } from '../../util';

function buildArrowsFromUciMoves(
  uciMoves: string[],
  hexColor: string = '#f2358d'
): ArrowsMap {
  const map: ArrowsMap = {} as ArrowsMap;
  uciMoves.slice(0, 1).forEach((uci) => {
    if (uci.length >= 4) {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const id = `${from}${to}` as keyof ArrowsMap;
      map[id] = [from, to, hexColor];
    }
  });
  return map;
}

function buildArrowsFromFen(fen: string, count: number = 3): ArrowsMap {
  const map: ArrowsMap = {} as ArrowsMap;
  try {
    const chess = new Chess(fen);
    if (chess.isGameOver()) return map;
    const moves = chess.moves({ verbose: true }).slice(0, count);
    moves.forEach((m: { from: string; to: string }) => {
      const from = m.from as Square;
      const to = m.to as Square;
      const id = `${from}${to}` as keyof ArrowsMap;
      map[id] = [from, to, '#07DA6380'];
    });
  } catch {
    // invalid FEN
  }
  return map;
}

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
  onSetOrientation?: (color: 'w' | 'b') => void;


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
      onSetOrientation,
      userData,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    // const settings = useAichessActivitySettings();
    const [pendingOpening, setPendingOpening] = useState<{
      name: string;
      pgn: string;
      content: string;
      uciMoves: string[];
    } | null>(null);
    
    const [suggestedMoves, setSuggestedMoves] = useState<Array<{ uci: string; san: string }> | null>(null);
    const [suggestedMainMoveUci, setSuggestedMainMoveUci] = useState<string | null>(null);
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
    const [showColorChoice, setShowColorChoice] = useState(false);
    const [lastOpeningIntroContent, setLastOpeningIntroContent] = useState<string>('');
    const [waitingForCustomOpeningName, setWaitingForCustomOpeningName] = useState(false);
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
    const [suggestedOpenings, setSuggestedOpenings] = useState<Array<{ name: string; pgn: string }> | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<{ stop: () => void } | null>(null);
    
    const startVoiceInput = useCallback(() => {
      if (typeof window === 'undefined') return;
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        console.warn('Speech recognition not supported');
        return;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setIsListening(false);
        return;
      }
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
     //recognition.lang = 'en-US';
      recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript?: string }}}}) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim() || '';
        if (transcript) addQuestion(transcript);
      };
      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
      };
      recognition.onerror = () => {
        recognitionRef.current = null;
        setIsListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }, [currentChapterState.messages, currentChapterState.notation.history]);


    const fetchOpeningSuggestions = async (count: number = 4): Promise<Array<{ name: string; pgn: string }>> => {
      const results = await Promise.all(
        Array.from({ length: count }, () => getOpenings())
      );
      const byName = new Map<string, { name: string; pgn: string }>();
      results.forEach((data) => {
        if (data?.name && data?.pgn) byName.set(data.name, { name: data.name, pgn: data.pgn });
      });
      return Array.from(byName.values()).slice(0, count);
    };

    const handleSelectOpening = async (
      opening: { name: string; pgn: string },
      precomputedIdeas?: string
    ) => {
      const intro = `Let's play the ${opening.name}. We'll start from here. If you'd like to learn a different opening at any time, just tell me.`;
      let ideas = precomputedIdeas ?? getOpeningIdeas(opening.name);
      if (!ideas && opening.pgn?.trim()) {
        const lastId = currentChapterState.messages[currentChapterState.messages.length - 1]?.idResponse ?? '';
        const aiComment = await getOpeningCommentFromAi(opening.pgn, lastId);
        if (aiComment) ideas = aiComment;
      }
      const content = ideas
      ? `${intro}\n\nBasic ideas:\n${formatOpeningTextForDisplay(ideas)}`
      : intro;
      setLastOpeningIntroContent(content);
    
      let pgnToImport = opening.pgn;
      if (ideas) {
        const pgnFromText = buildPgnFromMessageContent(ideas);
        if (pgnFromText) {
          try {
            const testChess = new Chess();
            testChess.loadPgn(pgnFromText);
            if (testChess.history().length > 0) {
              pgnToImport = pgnFromText;
            }
          } catch {
            // ostavi opening.pgn
          }
        }
      }

      onQuickImport({ type: 'PGN', val: pgnToImport });
    
      const chess = new Chess();
      chess.loadPgn(pgnToImport);
      const uciMoves = chess
        .history({ verbose: true })
        .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`);
      addLearnAi({
        ...currentChapterState.aiLearn,
        mode: 'opening',
        name: opening.name,
        moves: uciMoves,
      });
      onMessage({
        content: content,
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      setSuggestedOpenings(null);

      onMessage({
        content: "Would you like to play as White or Black?",
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      setShowColorChoice(true);
    };

    const handleSomethingElse = () => {
      setSuggestedOpenings(null);
      setWaitingForCustomOpeningName(true);
      onMessage({
        content: "Please type the name of the opening you'd like to play (e.g. Italian Game, Sicilian Defense, Caro-Kann).",
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    };

    const formatOpeningTextForDisplay = (text: string): string => {
      if (!text?.trim()) return text;
      return text
        .replace(/\]\s+/g, ']\n')   // novi red posle ] (kraj komentara)
        .replace(/\s+\[/g, '\n[')    // novi red pre [ (početak komentara)
        .replace(/\.\s+/g, '.\n');   // novi red posle tačke (rečenice)
    };

    const handleSelectColor = (color: 'w' | 'b') => {
      onSetOrientation?.(color);
      onMessage({
        content: color === 'w' ? 'White' : 'Black',
        participantId: userData?.user_id || 'user',
        idResponse: currentChapterState.messages[currentChapterState.messages.length - 1]?.idResponse || '',
      });
      onMessage({
        content: color === 'w'
          ? "Great! You're playing as White. Let's explore the opening."
          : "Perfect! You're playing as Black. Let's begin.",
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      if (lastOpeningIntroContent.trim()) {
        onMessage({
          content: lastOpeningIntroContent,
          participantId: 'chatGPT123456',
          idResponse: '',
        });
      }
      setShowColorChoice(false);
    };

    const requestAnotherOpening = async () => {
      onMessage({
        content: 'Another opening',
        participantId: userData?.user_id || 'user',
        idResponse: currentChapterState.messages[currentChapterState.messages.length - 1]?.idResponse || '',
      });
      const list = await fetchOpeningSuggestions(4);
      setSuggestedOpenings(list);
      onMessage({
        content: 'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    };

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

    useEffect(() => {
      if (currentChapterState.aiLearn.mode !== 'opening') return;
      const fen = currentChapterState.displayFen;
      const LICHESS_PINK = '#f2358d';
      console.log('opening effect', currentChapterState.aiLearn.mode, fen);

      setSuggestedMoves(null);

      getLichessTopMoves(fen, 3).then((moves) => {
        console.log('lichess moves', moves);
        if (moves.length > 0) {
          setSuggestedMoves(moves);
          setSuggestedMainMoveUci(moves[0].uci);
          onArrowsChange(buildArrowsFromUciMoves([moves[0].uci], LICHESS_PINK));
        } else {
          setSuggestedMainMoveUci(null);
          onArrowsChange({} as ArrowsMap);
        }
      });
    }, [
      currentChapterState.displayFen,
      currentChapterState.notation.history,
      currentChapterState.aiLearn.mode,
    ]);

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
      const trimmed = question?.trim() ?? '';
      if (!trimmed) return;
      console.log('addQuestion', trimmed, 'openingFromDb', getOpeningByUserInput(trimmed), 'extracted', extractOpeningNameFromPhrase(trimmed));
      var lastIdResponse = currentChapterState.messages[currentChapterState.messages.length - 1]?.idResponse ?? '';
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');

      // 1) Uvek prvo proveri da li je to otvaranje iz naše baze (i za "Something else" i za običan unos)
      const openingFromDb = getOpeningByUserInput(trimmed);
      if (openingFromDb) {
      if (userId) {
        onMessage({
          content: trimmed,
          participantId: userId,
          idResponse: lastIdResponse,
        });
      }
      setQuestion('');
        setWaitingForCustomOpeningName(false);
        handleSelectOpening(openingFromDb);
        return;
      }
    
      // 2) Ako je kliknuo "Something else", tražimo naziv koji nije u bazi → pitaj OpenAI
      if (waitingForCustomOpeningName) {
        setWaitingForCustomOpeningName(false);
        if (userId) onMessage({ content: trimmed, participantId: userId, idResponse: lastIdResponse });
        setQuestion('');
        setPulseDot(true);
        const fromAi = await getOpeningFromAiByName(trimmed, lastIdResponse);
        setPulseDot(false);
        if (fromAi) {
          handleSelectOpening({ name: fromAi.name, pgn: fromAi.pgn }, fromAi.ideas);
        } else {
          onMessage({
            content: "I couldn't find that opening. Try typing another name (e.g. Italian Game, Sicilian) or pick one from the list.",
            participantId: 'chatGPT123456',
            idResponse: '',
          });
          const list = await fetchOpeningSuggestions(4);
          setSuggestedOpenings(list);
          onMessage({
            content: 'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
            participantId: 'chatGPT123456',
            idResponse: '',
          });
        }
        return;
      }
      // 3) Nije u bazi, ali poruka zvuči kao zahtev za otvaranje → pitaj OpenAI (i bez "Something else")
      const extractedName = extractOpeningNameFromPhrase(trimmed);
      if (extractedName && extractedName.length > 1) {
        if (userId) onMessage({ content: trimmed, participantId: userId, idResponse: lastIdResponse });
        setQuestion('');
        onMessage({ content: 'One moment...', participantId: 'chatGPT123456', idResponse: '' });
        setPulseDot(true);
        const fromAi = await getOpeningFromAiByName(extractedName, lastIdResponse);
        setPulseDot(false);
        if (fromAi) {
          handleSelectOpening({ name: fromAi.name, pgn: fromAi.pgn }, fromAi.ideas);
        } else {
          onMessage({
            content: "I couldn't find that opening. Try another name or pick one from the list.",
            participantId: 'chatGPT123456',
            idResponse: '',
          });
        }
        return;
      }

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
      if (data?.answer?.messageType === 'ratingChange') {
        const number = data.answer.text?.match(/\d+/);
        if (number) {
          const newRating = parseInt(number[0], 10);
          setRatingBotEngine(newRating);
        }
      }
      if (data?.answer?.text) {
        checkAnswerGPT(data);
      } else {
        onMessage({
          content: "Something went wrong. Please try again or ask something else.",
          participantId: 'chatGPT123456',
          idResponse: '',
        });
      }
    };

    useEffect(() => {
      if (currentChapterState.aiLearn.mode === 'opening' && !stockfish) {
        setTimeout(() => setStockfish(true), 3000);
      } else if (currentChapterState.aiLearn.mode === 'play' && !stockfish) {
        setTimeout(() => setStockfish(true), 500);
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
    const engineMove = (m: string) => {
      if (!m || m === '(none)' || m.length < 4) return;
      if (currentChapterState.aiLearn.mode !== 'play') return;

      const isMyTurn =
        currentChapterState.displayFen.split(' ')[1] ===
        currentChapterState.orientation;
      if (isMyTurn) return;

      const fromChess = m.slice(0, 2) as Square;
      const toChess = m.slice(2, 4) as Square;
      const promoChar = m.length === 5 ? m[4] : undefined;
      const promotion =
        promoChar === 'q' || promoChar === 'r' || promoChar === 'b' || promoChar === 'n'
          ? promoChar
          : undefined;

      const payload =
        promotion != null
          ? { from: fromChess, to: toChess, promotion }
          : { from: fromChess, to: toChess };

      setTimeout(() => {
        onMove(payload);
      }, 900);
    };
    const hint = async () => { };

    const handleSuggestedMove = useCallback((uci: string) => {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const promotion = uci.length >= 5 ? (uci[4] as 'q' | 'r' | 'b' | 'n') : undefined;
      setSuggestedMoves(null);
      onMove(promotion ? { from, to} : { from, to });
        }, [onMove]);

    const handleGameEvaluation = (newScore: number) => {
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
    };
    
    const play = async () => {
      setFreezeButton(true);
      addLearnAi({ ...currentChapterState.aiLearn, mode: 'play', moves: [] });
      onMessage({
        content: "Which strength level would you like to play against?",
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      setTimeout(() => setFreezeButton(false), 3000);
    };

    return (
      <div className="flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
      {stockfish && currentChapterState.aiLearn.mode === 'play' && (
         <StockFishEngineAI
            fen={currentChapterState.displayFen}
            orientation={currentChapterState.orientation}
            playMode={true}
            puzzleMode={false}
            isMyTurn={currentChapterState.displayFen.split(' ')[1] === currentChapterState.orientation}
            engineMove={engineMove}
            engineLines={engineLines}
            IsMate={isMate}
            isMobile={isMobile ?? false}
            newRatingEngine={newRatingEngine}
            ratingEngine={ratingEngine}
            addGameEvaluation={handleGameEvaluation}
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-4 md:pb-4 rounded-lg">            
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
        <Conversation

                        showColorChoice={showColorChoice}
                        onSelectColor={handleSelectColor}                        
                        suggestedOpenings={suggestedOpenings}
                        onSelectOpening={handleSelectOpening}
                        onSelectSomethingElse={handleSomethingElse}
                        currentChapterState={currentChapterState}
                        openViewSubscription={openViewSubscription}
                        onSelectRating={setRatingEngine}
                        onSelectLearnMode={async (mode) => {
                          if (mode === 'opening') {
                            onMessage({
                              content: 'Openings',
                              participantId: userData?.user_id || 'user',
                              idResponse: currentChapterState.messages[currentChapterState.messages.length - 1]?.idResponse || '',
                            });
                            const list = await fetchOpeningSuggestions(4);
                            setSuggestedOpenings(list);
                            onMessage({
                              content: 'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
                              participantId: 'chatGPT123456',
                              idResponse: '',
                            });
                          }
                        }}
                        pulseDot={pulseDot}
                        takeBack={takeBack}
                        playNext={playNext}
                        hint={hint}
                        userData={userData}
                        smallMobile={smallMobile}
                        onHistoryNotationRefocus={onHistoryNotationRefocus}
                        notationHistoryLength={currentChapterState.notation?.history?.length ?? 0 }
                        suggestedMoves={suggestedMoves}
                        onSuggestedMove={handleSuggestedMove}
                      />

                      <div className="relative flex flex-shrink-0 md:my-[20px] mt-3 my-[14px]">
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
                        {currentChapterState.aiLearn.mode === 'opening' && (
                        
                        <ButtonGreen
                          onClick={requestAnotherOpening}
                          size="sm"
                          className="md:max-w-[100px] max-w-[100px]"
                          style={{ maxWidth: smallMobile ? '68px' : '' }}
                        >
                        <p>Another Opening</p>
                        </ButtonGreen>
                      )}

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

                        {/* Flip Board Button - Poziva funkciju koju si definisao */}


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
                    
                      <div className="flex mb-2 mt-2 md:mt-0 items-center gap-2">
  <input
    id="title"
    type="text"
    name="tags"
    placeholder="Start chessiness..."
    value={question}
    style={{ boxShadow: '0px 0px 10px 0px #07DA6380' }}
    className="w-full text-sm rounded-[20px] border border-conversation-100 bg-[#111111]/40 text-white placeholder-slate-400 px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
    onChange={(e) => setQuestion(e.target.value)}
    onFocus={() => setIsFocusedInput(true)}
    onBlur={() => setIsFocusedInput(false)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' && !e.shiftKey) addQuestion(question);
    }}
  />
  <button
    type="button"
    onClick={startVoiceInput}
    className={`flex-shrink-0 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500/80 text-white' : 'bg-[#111111]/40 text-slate-300 hover:bg-slate-600 border border-conversation-100'}`}
    title={isListening ? 'Stop listening' : 'Voice input'}
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
    </svg>
  </button>
  <ButtonGreen
    size="md"
    onClick={() => { if (question.trim() !== '') addQuestion(question); }}
    disabled={question.trim() == ''}
    icon="PaperAirplaneIcon"
    className="flex-shrink-0 px-4 py-2 duration-200"
  />
</div>
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-slate-300 min-w-0 max-h-20 overflow-y-auto overflow-x-hidden">      {currentChapterState.notation?.history?.map((pair, moveIdx) => (
    <span key={moveIdx} className="flex items-center gap-0.5">
      <span className="text-slate-500">{moveIdx + 1}.</span>
      {pair[0] && !(pair[0] as any).isNonMove && (
        <button
          type="button"
          className="px-1 rounded hover:bg-slate-600"
          onClick={() => onHistoryNotationRefocus([moveIdx, 0])}
        >
          {(pair[0] as any).san}
        </button>
      )}
      {pair[1] && !(pair[1] as any).isNonMove && (
        <button
          type="button"
          className="px-1 rounded hover:bg-slate-600"
          onClick={() => onHistoryNotationRefocus([moveIdx, 1])}
        >
          {(pair[1] as any).san}
        </button>
      )}
    </span>
  ))}
{suggestedMainMoveUci && (() => {
  const from = suggestedMainMoveUci.slice(0, 2) as Square;
  const to = suggestedMainMoveUci.slice(2, 4) as Square;
  const promotion = suggestedMainMoveUci.length >= 5 ? (suggestedMainMoveUci[4] as 'q' | 'r' | 'b' | 'n') : undefined;
  let san: string;
  try {
    const chess = new Chess(currentChapterState.displayFen);
    const move = chess.move({ from, to, promotion });
    if (!move) return null; // ne prikazuj dugme ako potez nije legalan u trenutnoj poziciji
    san = move.san;
  } catch {
    return null; // zastareo predlog ili neusklađen FEN – ne prikazuj dugme
  }
  return (
    <button
      type="button"
      className="px-2 py-0.5 rounded bg-green-800/50 hover:bg-green-700/50"
      onClick={() => onMove({ from, to })}
    >
      {san}
    </button>
  );
})()}
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
                </div>
                );
              }
            );
          