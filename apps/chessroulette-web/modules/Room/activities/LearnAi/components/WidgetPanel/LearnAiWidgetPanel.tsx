import React, {
  useCallback,
  // useMemo,
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
// import debounce from 'debounce';
import { Tabs, TabsRef } from '@app/components/Tabs';
import {
  getLichessTopMoves,
  getOutpostNextMoves,
  parseOutpostResponseToSuggestions,
  uciToSan,
} from '../../util';
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
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import Conversation from './Conversation';

import { Square, Chess } from 'chess.js';
import StockFishEngineAI from '@app/modules/ChessEngine/ChessEngineAI';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { SendQuestionCoach } from './SendQuestionCoach';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';

import {
  // getOpenings, // replaced by local OPENING_DATABASE
  // getWikibooksContent,
  getLichessBestMove,
  // getOpeningIdeas,
  //getOpeningCommentFromAi,
  buildPgnFromMessageContent,
  // getOpeningByUserInput,
  getOpeningFromAiByName,
  // extractOpeningNameFromPhrase,
} from '../../util';
import {
  OPENING_DATABASE,
  findOpeningFamily,
  getNextBranchMoves,
  type OpeningBranchMove,
} from '../../openingDatabase';

const SUGGESTED_ARROW_DIM = 'rgba(242, 53, 141, 0.28)';

// function parseIdeasToMoveCommentsAligned(
//   ideas: string,
//   sanMoves: string[]
// ): (string | null)[] {
//   const result: (string | null)[] = new Array(sanMoves.length).fill(null);
//   const list: { san: string; comment: string }[] = [];
//   const bracketRegex = /\[([^\]]*)\]/g;
//   let match;
//   let lastIndex = 0;
//   console.log('ideje', ideas);
//   while ((match = bracketRegex.exec(ideas)) !== null) {
//     const partBeforeBracket = ideas.slice(lastIndex, match.index).trim();
//     lastIndex = match.index + match[0].length;
//     const tokens = partBeforeBracket.split(/\s+/).filter(Boolean);
//     const lastToken = tokens[tokens.length - 1] || '';
//     const san = lastToken.replace(/^\d+\.{1,3}\s*/, '').trim();
//     if (san) list.push({ san, comment: match[1].trim() });
//   }
//   let listIdx = 0;
//   for (const { san, comment } of list) {
//     const j = sanMoves.indexOf(san, listIdx);
//     if (j !== -1) {
//       result[j] = comment;
//       listIdx = j + 1;
//     }
//   }
//   console.log('result', result);
//   return result;
// }

function getCurrentPositionUci(notation: {
  history: any[];
  focusedIndex: [number, number];
}): string {
  const { history, focusedIndex } = notation;
  if (!Array.isArray(history) || history.length === 0) return '';
  const [moveIdx, colorIdx] = focusedIndex;
  if (moveIdx < 0) return '';
  const pairs = history.slice(0, moveIdx + 1);
  const lastPair = pairs[pairs.length - 1];
  const moves: string[] = [];
  for (let i = 0; i < pairs.length - 1; i++) {
    const [w, b] = pairs[i];
    if (w && !(w as any).isNonMove)
      moves.push(
        `${(w as any).from}${(w as any).to}${(w as any).promotion ?? ''}`
      );
    if (b && !(b as any).isNonMove)
      moves.push(
        `${(b as any).from}${(b as any).to}${(b as any).promotion ?? ''}`
      );
  }
  if (lastPair) {
    if (lastPair[0] && !(lastPair[0] as any).isNonMove)
      moves.push(
        `${(lastPair[0] as any).from}${(lastPair[0] as any).to}${
          (lastPair[0] as any).promotion ?? ''
        }`
      );
    if (colorIdx === 1 && lastPair[1] && !(lastPair[1] as any).isNonMove)
      moves.push(
        `${(lastPair[1] as any).from}${(lastPair[1] as any).to}${
          (lastPair[1] as any).promotion ?? ''
        }`
      );
  }
  return moves.join(' ');
}

function buildArrowsFromUciMoves(
  uciMoves: string[],
  hexColor: string,
  options?: { highlightUci?: string | null; dimColor?: string }
): ArrowsMap {
  const map: ArrowsMap = {} as ArrowsMap;
  const dimColor = options?.dimColor ?? SUGGESTED_ARROW_DIM;
  const highlightUci = options?.highlightUci ?? null;
  uciMoves.forEach((uci) => {
    if (uci.length >= 4) {
      const from = uci.slice(0, 2) as Square;
      const to = uci.slice(2, 4) as Square;
      const color =
        highlightUci == null || uci === highlightUci ? hexColor : dimColor;
      const id = `${from}${to}-${color}` as keyof ArrowsMap;
      map[id] = [from, to, color];
    }
  });

  return map;
}

// function buildArrowsFromFen(fen: string, count: number = 3): ArrowsMap {
//   const map: ArrowsMap = {} as ArrowsMap;
//   try {
//     const chess = new Chess(fen);
//     if (chess.isGameOver()) return map;
//     const moves = chess.moves({ verbose: true }).slice(0, count);
//     moves.forEach((m: { from: string; to: string }) => {
//       const from = m.from as Square;
//       const to = m.to as Square;
//       const id = `${from}${to}-#07DA6380` as keyof ArrowsMap;
//       map[id] = [from, to, '#07DA6380'];
//     });
//   } catch {
//     // invalid FEN
//   }
//   return map;
// }

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
  onCanPlayChange: (canPlay: boolean) => void;
  userData: UserData;
  addLearnAi: (data: aiLearn) => void;
  onFlipBoard?: () => void;
  onSetOrientation?: (color: 'w' | 'b') => void;
  onRegisterNewOpening?: (fn: () => void) => void;

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
      onFlipBoard,
      onSetOrientation,
      onRegisterNewOpening,
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

    const [suggestedMoves, setSuggestedMoves] = useState<Array<{
      uci: string;
      san: string;
    }> | null>(null);
    const [hoveredSuggestedUci, setHoveredSuggestedUci] = useState<
      string | null
    >(null);
    const [suggestedMainMoveUci, setSuggestedMainMoveUci] = useState<
      string | null
    >(null);
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();

    const updateableSearchParams = useUpdateableSearchParams();
    const [pulseDot, setPulseDot] = useState(false);
    const [isFocusedInput, setIsFocusedInput] = useState(false);
    const [question, setQuestion] = useState('');

    const [reviewData, setReviewData] = useState<EvaluationMove[]>([]);
    const [freezeButton, setFreezeButton] = useState(false);
    const [deviatedFromOpening, setDeviatedFromOpening] = useState(false);
    const deviationMsgSentRef = useRef(false);
    const [hintActive, setHintActive] = useState(true);

    const [scoreCP, setScoreCP] = useState(0);
    const [prevScoreCP, setprevScoreCP] = useState(0);
    const [showColorChoice, setShowColorChoice] = useState(false);
    const [lastOpeningIntroContent, setLastOpeningIntroContent] =
      useState<string>('');
    const [waitingForCustomOpeningName, setWaitingForCustomOpeningName] =
      useState(false);
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

    const [preferedCategory, setPreferedCategory] = useState('');
    const [lines, setLines] = useState<StockfishLines>({
      1: '',
      2: '',
      3: '',
    });

    const [isWikiLoading, setIsWikiLoading] = useState(false);
    const [suggestedOpenings, setSuggestedOpenings] = useState<Array<{
      name: string;
      pgn: string;
    }> | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<{ stop: () => void } | null>(null);

    const [selectedOpeningFilter, setSelectedOpeningFilter] = useState<
      string | null
    >(null);
    const [openingMoveComments, setOpeningMoveComments] = useState<
      (string | null)[]
    >([]);
    const [branchMoves, setBranchMoves] = useState<
      Array<OpeningBranchMove & { san: string }> | null
    >(null);
    const [openingComplete, setOpeningComplete] = useState(false);
    const [keepPlaying, setKeepPlaying] = useState(false);
    const openingCompleteMessageSentRef = useRef(false);

    function parseIdeasToMoveComments(ideas: string): string[] {
      const comments: string[] = [];
      const regex = /\[([^\]]*)\]/g;
      let m;
      while ((m = regex.exec(ideas)) !== null) {
        comments.push(m[1].trim());
      }
      return comments;
    }

    const startVoiceInput = useCallback(() => {
      if (typeof window === 'undefined') return;
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
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
      recognition.onresult = (event: {
        results: { [key: number]: { [key: number]: { transcript?: string } } };
      }) => {
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

    const fetchOpeningSuggestions = (
      _count: number = 3
    ): Promise<Array<{ name: string; pgn: string }>> => {
      // Old API-based code (kept for reference):
      // const results = await Promise.all(
      //   Array.from({ length: count }, () => getOpenings())
      // );
      // const byName = new Map<string, { name: string; pgn: string }>();
      // results.forEach((data) => {
      //   if (data?.name && data?.pgn)
      //     byName.set(data.name, { name: data.name, pgn: data.pgn });
      // });
      // return Array.from(byName.values()).slice(0, count);

      const shuffled = [...OPENING_DATABASE].sort(() => Math.random() - 0.5);
      const suggestions = shuffled.slice(0, 3).map((family) => {
        const variant = family.variants[0];
        const chess = new Chess();
        for (const uci of variant.moves) {
          try {
            chess.move({
              from: uci.slice(0, 2),
              to: uci.slice(2, 4),
              promotion: uci[4] as any,
            });
          } catch {}
        }
        return {
          name: family.name,
          pgn: `[Event "?"]\n[Site "?"]\n\n${chess.pgn()}`,
        };
      });
      return Promise.resolve(suggestions);
    };

    const handleSelectOpening = async (
      opening: { name: string; pgn: string },
      precomputedIdeas?: string
    ) => {
      const intro = `Let's play the ${opening.name}. We'll start from the beginning. If you'd like to learn a different opening at any time, just tell me.`;
      console.log('precomputedIdeas', precomputedIdeas);
      console.log('opening', opening.name, opening.pgn);

      // let ideas = precomputedIdeas ?? getOpeningIdeas(opening.name);
      // if (!ideas && opening.pgn?.trim()) {
      // const lastId =
      //   currentChapterState.messages[currentChapterState.messages.length - 1]
      //     ?.idResponse ?? '';
      // const aiComment = await getOpeningCommentFromAi(opening.pgn, lastId);
      // if (aiComment) ideas = aiComment;
      // }

      setLastOpeningIntroContent(intro);

      let pgnToImport = opening.pgn;
      // if (ideas) {
      //   const pgnFromText = buildPgnFromMessageContent(ideas);
      //   if (pgnFromText) {
      //     try {
      //       const testChess = new Chess();
      //       testChess.loadPgn(pgnFromText);
      //       if (testChess.history().length > 0) {
      //         pgnToImport = pgnFromText;
      //       }
      //     } catch {
      //       // ostavi opening.pgn
      //     }
      //   }
      // }

      onQuickImport({ type: 'FEN', val: ChessFENBoard.STARTING_FEN });
      const chess = new Chess();
      chess.loadPgn(pgnToImport);
      // const sanMoves = chess.history();
      // console.log(ideas, sanMoves);
      // const moveComments = ideas
      //   ? parseIdeasToMoveCommentsAligned(ideas, sanMoves)
      //   : [];
      // setOpeningMoveComments(moveComments);
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
        content: intro + '\n\nWould you like to play as White or Black?',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
      setSuggestedOpenings(null);
      setShowColorChoice(true);
    };

    const handleSomethingElse = () => {
      // Old: ask user to type name
      // setSuggestedOpenings(null);
      // setWaitingForCustomOpeningName(true);
      // onMessage({
      //   content: "Please type the name of the opening you'd like to play (e.g. Italian Game, Sicilian Defense, Caro-Kann).",
      //   participantId: 'chatGPT123456',
      //   idResponse: '',
      // });

      const shownNames = new Set(suggestedOpenings?.map((o) => o.name) ?? []);
      const others = OPENING_DATABASE.filter((f) => !shownNames.has(f.name)).sort(
        () => Math.random() - 0.5
      );
      const picks = others.slice(0, 3).map((family) => {
        const variant = family.variants[0];
        const chess = new Chess();
        for (const uci of variant.moves) {
          try {
            chess.move({
              from: uci.slice(0, 2),
              to: uci.slice(2, 4),
              promotion: uci[4] as any,
            });
          } catch {}
        }
        return {
          name: family.name,
          pgn: `[Event "?"]\n[Site "?"]\n\n${chess.pgn()}`,
        };
      });
      setSuggestedOpenings(picks);
      onMessage({
        content:
          'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    };

    // const formatOpeningTextForDisplay = (text: string): string => {
    //   if (!text?.trim()) return text;
    //   return text
    //     .replace(/\]\s+/g, ']\n') // novi red posle ] (kraj komentara)
    //     .replace(/\s+\[/g, '\n[') // novi red pre [ (početak komentara)
    //     .replace(/\.\s+/g, '.\n'); // novi red posle tačke (rečenice)
    // };

    const handleSelectColor = (color: 'w' | 'b') => {
      onSetOrientation?.(color);
      onMessage({
        content: color === 'w' ? 'White' : 'Black',
        participantId: userData?.user_id || 'user',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            ?.idResponse || '',
      });
      onMessage({
        content:
          color === 'w'
            ? "Great! You're playing as White. Let's explore the opening."
            : "Perfect! You're playing as Black. Let's begin.",
        participantId: 'chatGPT123456',
        idResponse: '',
      });

      setShowColorChoice(false);
    };

    const requestAnotherOpening = async () => {
      addLearnAi({
        ...currentChapterState.aiLearn,
        moves: [],
        moves_test: [],
        errors: 0,
        popup: false,
        name: '',
        mode: 'opening',
      });
      onMessage({
        content: 'Another opening',
        participantId: userData?.user_id || 'user',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            ?.idResponse || '',
      });
      const list = await fetchOpeningSuggestions(4);
      setSuggestedOpenings(list);
      onMessage({
        content:
          'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    };

    useEffect(() => {
      onRegisterNewOpening?.(requestAnotherOpening);
    }, []);

    // Debounced function to fetch wiki content
    // const fetchWikiContent = useCallback(
    //   async (history: any[]) => {
    //     let title = 'Chess_Opening_Theory';
    //     history.forEach((pair, index) => {
    //       const moveNum = index + 1;
    //       if (pair[0]) title += `/${moveNum}._${pair[0].san}`;
    //       if (pair[1]) title += `/${moveNum}...${pair[1].san}`;
    //     });
    //     if (fetchedWikiTitlesRef.current.has(title)) return;
    //     fetchedWikiTitlesRef.current.add(title);
    //     try {
    //       const data = await getWikibooksContent(title);
    //       if (data && data.query && data.query.pages) {
    //         const pages = data.query.pages;
    //         const pageId = Object.keys(pages)[0];
    //         if (!pages[pageId].missing) {
    //           const raw: string = pages[pageId].extract ?? '';
    //           const stripped = raw
    //             .replace(/<h[1-3][^>]*>[\s\S]*?<\/h[1-4]>/gi, '')
    //             .replace(/<p[^>]*>[\s\S]*?<\/p>/i, '')
    //             .replace(/<[^>]+>/g, '')
    //             .replace(/\n+/g, ' ')
    //             .trim();
    //           const parts = stripped.split(/(?<!\d)\.\s+(?=[A-Z])/);
    //           const snippet = parts.slice(0, 2).join('. ');
    //           const text = (snippet.endsWith('.') ? snippet : snippet + '.').trim();
    //           if (text) onMessage({ content: text, participantId: 'chatGPT123456', idResponse: '' });
    //         }
    //       }
    //     } catch (e) {
    //       console.error('Wiki fetch error', e);
    //     }
    //   },
    //   [onMessage]
    // );

    // const debouncedFetchWiki = useMemo(
    //   () => debounce(fetchWikiContent, 500),
    //   [fetchWikiContent]
    // );

    const prevMoveCountRef = useRef(0);
    const prevOpeningNameRef = useRef('');
    // const fetchedWikiTitlesRef = useRef<Set<string>>(new Set());

    useEffect(() => {
      if (!openingComplete) {
        openingCompleteMessageSentRef.current = false;
        return;
      }
      if (openingCompleteMessageSentRef.current) return;
      openingCompleteMessageSentRef.current = true;
      onMessage({
        content:
          "⭐ Great job! You've completed the opening. Click Opening Test to practice it from memory, or Keep Playing to continue the game.",
        participantId: 'chatGPT123456',
        idResponse: '',
      });
    }, [openingComplete, onMessage]);

    useEffect(() => {
      if (currentChapterState.aiLearn.mode !== 'opening') return;

      const historyMoves: string[] = [];
      (currentChapterState.notation?.history as any[][] ?? []).forEach((pair) =>
        (pair as any[]).forEach((m: any) => {
          if (m && !m.isNonMove)
            historyMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
        })
      );
      const moveCount = historyMoves.length;

      if (moveCount > prevMoveCountRef.current && moveCount > 0) {
        const commentIndex = moveCount - 1;
        let comment: string | null = null;

        const openingName = (currentChapterState.aiLearn.name ?? '').trim();
        const family = findOpeningFamily(openingName);
        if (family) {
          // Find the variant that matches the full played sequence
          const matchingVariant = family.variants.find((v) =>
            historyMoves.every((m, i) => v.moves[i] === m)
          );
          if (matchingVariant) {
            comment = matchingVariant.comments[commentIndex] ?? null;
          }
        }
        // else if (moveCount <= 8) {
        //   comment = openingMoveComments[commentIndex] ?? null;
        // }

        if (comment) {
          onMessage({
            content: comment,
            participantId: 'chatGPT123456',
            idResponse: '',
          });
        }
        prevMoveCountRef.current = moveCount;
      } else {
        prevMoveCountRef.current = moveCount;
      }
    }, [currentChapterState.notation.history, currentChapterState.aiLearn.name, onMessage]);

    //const [visibleSuggestedCount, setVisibleSuggestedCount] = useState(3);

    const [visibleSuggestedRows, setVisibleSuggestedRows] = useState(1);

    useEffect(() => {
      // console.log('krk', currentChapterState.displayFen,currentChapterState.aiLearn.mode, currentChapterState.aiLearn.name)

      if (currentChapterState.aiLearn.mode !== 'opening') return;
      const fen = currentChapterState.displayFen;
      const openingName = (currentChapterState.aiLearn.name ?? '').trim();
      const hasOpeningSelected = openingName.length > 0;

      // Reset keepPlaying only when a different opening is selected
      if (openingName !== prevOpeningNameRef.current) {
        prevOpeningNameRef.current = openingName;
        setKeepPlaying(false);
        openingCompleteMessageSentRef.current = false;
      }

      setSuggestedMoves(null);
      setBranchMoves(null);
      setOpeningComplete(false);
      setHoveredSuggestedUci(null);
      setVisibleSuggestedRows(1);
      setDeviatedFromOpening(false);
      deviationMsgSentRef.current = false;
      onArrowsChange({} as ArrowsMap);

      if (hasOpeningSelected) {
        // Read full history directly (not via focusedIndex) so refresh restores correctly
        const historyMoves: string[] = [];
        (currentChapterState.notation?.history as any[][] ?? []).forEach((pair) =>
          (pair as any[]).forEach((m: any) => {
            if (m && !m.isNonMove)
              historyMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
          })
        );
        const playedMoves = historyMoves;
        const currentUci = historyMoves.join(' ');

        // Branch mode: opening from local database → show arrows for all variants
        const family = findOpeningFamily(openingName);
        if (family) {
          const rawBranches = getNextBranchMoves(family, playedMoves);
          if (rawBranches.length > 0) {
            setBranchMoves(
              rawBranches.map((bm) => ({ ...bm, san: uciToSan(fen, bm.uci) }))
            );
            return;
          }
          // All variants exhausted → opening complete
          setOpeningComplete(true);
          if (!keepPlaying) return;
        }

        const moveCount = playedMoves.length;
        const openingMoves = currentChapterState.aiLearn.moves ?? [];
        const followsOpening =
          openingMoves.length > moveCount &&
          playedMoves.every((m, i) => openingMoves[i] === m);

        if (moveCount < openingMoves.length && followsOpening) {
          const nextUci = openingMoves[moveCount];
          const san = uciToSan(fen, nextUci);
          setSuggestedMoves([{ uci: nextUci, san }]);
          setSuggestedMainMoveUci(nextUci);
        } else {
          getOutpostNextMoves(currentUci).then((data) => {
            if (data.length === 0) {
              setDeviatedFromOpening(true);
              if (!deviationMsgSentRef.current) {
                deviationMsgSentRef.current = true;

                // onMessage({
                //   content:
                //     "You've moved outside the known opening lines — there's no recorded continuation for this position. Start over to practice the full variation, then click Opening Test when you're ready!",
                //   participantId: 'chatGPT123456',
                //   idResponse: '',
                // });
              }
              return;
            }
            const parsed = parseOutpostResponseToSuggestions(
              data,
              currentUci,
              fen
            );
            const openingLower = openingName.toLowerCase();
            const firstWord = openingLower.split(/\s+/)[0] || openingLower;
            const matchKeys = [openingLower, firstWord];
            if (firstWord === 'petrov' || openingLower.includes('petrov'))
              matchKeys.push('russian', "petrov's");
            if (firstWord === 'vienna' || openingLower.includes('vienna'))
              matchKeys.push('vienna');
            const onlyThisVariant = parsed
              .filter((s) => {
                const o = (s.opening || '').toLowerCase();
                return matchKeys.some((k) => o.includes(k));
              })
              .sort((a, b) => b.cnt - a.cnt);
            let asUi = onlyThisVariant.map((m) => ({
              uci: m.uci,
              san: m.san,
            }));

            if (asUi.length === 0 && parsed.length > 0) {
              asUi = parsed
                .sort((a, b) => b.cnt - a.cnt)
                .map((m) => ({ uci: m.uci, san: m.san }));
            }
            if (asUi.length > 0) {
              setSuggestedMoves(asUi);
              setSuggestedMainMoveUci(asUi[0].uci);
            } else {
              setSuggestedMainMoveUci(null);
              getLichessTopMoves(fen, 9).then((moves) => {
                if (moves.length > 0) {
                  setSuggestedMoves(moves);
                  setSuggestedMainMoveUci(moves[0].uci);
                }
              });
            }
          });
        }
      } else {
        getLichessTopMoves(fen, 9).then((moves) => {
          if (moves.length > 0) {
            setSuggestedMoves(moves);
            setSuggestedMainMoveUci(moves[0].uci);
          } else {
            setSuggestedMainMoveUci(null);
          }
        });
      }
    }, [
      currentChapterState.displayFen,
      currentChapterState.aiLearn.mode,
      currentChapterState.aiLearn.name,
      currentChapterState.notation.history.length, // ensures restore on refresh when FEN alone doesn't change
      keepPlaying,
    ]);

    // Sync arrows with exactly the moves visible in Conversation (SAN dedup + visibleSuggestedRows)
    useEffect(() => {
      // Branch mode: colored arrows per variant
      if (branchMoves && branchMoves.length > 0) {
        const map: ArrowsMap = {} as ArrowsMap;
        branchMoves.forEach(({ uci, colorHex }) => {
          if (uci.length >= 4) {
            const from = uci.slice(0, 2) as Square;
            const to = uci.slice(2, 4) as Square;
            const id = `${from}${to}-${colorHex}` as keyof ArrowsMap;
            map[id] = [from, to, colorHex];
          }
        });
        onArrowsChange(map);
        return;
      }
      if (!suggestedMoves || suggestedMoves.length === 0) {
        onArrowsChange({} as ArrowsMap);
        return;
      }
      const seenSan = new Set<string>();
      const uniqueMoves = suggestedMoves.filter((m) => {
        if (seenSan.has(m.san)) return false;
        seenSan.add(m.san);
        return true;
      });
      const visible = uniqueMoves.slice(0, visibleSuggestedRows * 3);
      onArrowsChange(
        buildArrowsFromUciMoves(
          visible.map((m) => m.uci),
          '#11C6D1'
        )
      );
    }, [suggestedMoves, visibleSuggestedRows, branchMoves]);

    useEffect(() => {
      const lastMessage = currentChapterState?.messages?.at(-1)?.content;
      if (lastMessage?.includes('Here are some openings you could try')) {
        const getNewOpenings = async () => {
          const list = await fetchOpeningSuggestions(4);
          setSuggestedOpenings(list);
        };
        getNewOpenings();
      }
    }, []);
    //GUTA OBRISO
    // useEffect(() => {
    //   if (
    //     currentChapterState.aiLearn.mode !== 'opening' ||
    //     !suggestedMoves?.length
    //   )
    //     return;
    //   const blue = '#11C6D1';
    //   //#11c6d1
    //   const openingSelected = !!currentChapterState.aiLearn.name;
    //   const visible = suggestedMoves.slice(0, visibleSuggestedRows * 3);
    //   console.log('krk 4',visible)
    //   onArrowsChange(
    //     buildArrowsFromUciMoves(
    //       visible.map((m) => m.uci),
    //       blue,
    //       {
    //         highlightUci: hoveredSuggestedUci,
    //         dimColor: SUGGESTED_ARROW_DIM,
    //       }
    //     )
    //   );
    // }, [
    //   suggestedMoves,
    //   visibleSuggestedRows,
    //   hoveredSuggestedUci,
    //   currentChapterState.aiLearn.mode,
    //   onArrowsChange,
    // ]);

    const handleOtherSuggested = useCallback(() => {
      setVisibleSuggestedRows((prev) =>
        Math.min(prev + 1, Math.ceil((suggestedMoves?.length ?? 0) / 3))
      );
    }, [suggestedMoves?.length]);
    // Effect to follow the board (PGN/History) — only fires after a suggested move
    // useEffect(() => {
    //   if (currentChapterState.aiLearn.mode !== 'opening') return;
    //   if (
    //     currentChapterState?.notation?.history &&
    //     currentChapterState?.notation?.history.length > 4
    //   ) {
    //     const { history } = currentChapterState.notation;
    //     let activeHistory: any[] = history;
    //     debouncedFetchWiki(activeHistory);
    //   }
    // }, [currentChapterState.displayFen]);

    // const currentTabIndex = useMemo(
    //   () => widgetPanelTabsNav.getCurrentTabIndex(),
    //   [widgetPanelTabsNav.getCurrentTabIndex]
    // );

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
      var lastIdResponse =
        currentChapterState.messages[currentChapterState.messages.length - 1]
          ?.idResponse ?? '';
      const url = new URL(window.location.href);
      const userId = url.searchParams.get('userId');

      // 1) Uvek prvo proveri da li je to otvaranje iz naše baze (i za "Something else" i za običan unos)
      // const openingFromDb = getOpeningByUserInput(trimmed);
      // console.log('trt', trimmed, userId, waitingForCustomOpeningName);
      // if (openingFromDb) {
      //   if (userId) {
      //     onMessage({
      //       content: trimmed,
      //       participantId: userId,
      //       idResponse: lastIdResponse,
      //     });
      //   }
      //   setQuestion('');
      //   setWaitingForCustomOpeningName(false);
      //   handleSelectOpening(openingFromDb);
      //   return;
      // }

      // 2) Ako je kliknuo "Something else", tražimo naziv koji nije u bazi → pitaj OpenAI
      if (waitingForCustomOpeningName) {
        setWaitingForCustomOpeningName(false);
        if (userId)
          onMessage({
            content: trimmed,
            participantId: userId,
            idResponse: lastIdResponse,
          });
        setQuestion('');
        setPulseDot(true);
        const fromAi = await getOpeningFromAiByName(trimmed, lastIdResponse);
        setPulseDot(false);
        if (fromAi) {
          handleSelectOpening(
            { name: fromAi.name, pgn: fromAi.pgn },
            fromAi.ideas
          );
        } else {
          onMessage({
            content:
              "I couldn't find that opening. Try typing another name (e.g. Italian Game, Sicilian) or pick one from the list.",
            participantId: 'chatGPT123456',
            idResponse: '',
          });
          const list = await fetchOpeningSuggestions(4);
          setSuggestedOpenings(list);
          onMessage({
            content:
              'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
            participantId: 'chatGPT123456',
            idResponse: '',
          });
        }
        return;
      }
      // 3) Nije u bazi, ali poruka zvuči kao zahtev za otvaranje → pitaj OpenAI (i bez "Something else")
      // const extractedName = extractOpeningNameFromPhrase(trimmed);
      // if (extractedName && extractedName.length > 1) {
      //   if (userId)
      //     onMessage({
      //       content: trimmed,
      //       participantId: userId,
      //       idResponse: lastIdResponse,
      //     });
      //   setQuestion('');
      //   onMessage({
      //     content: 'One moment...',
      //     participantId: 'chatGPT123456',
      //     idResponse: '',
      //   });
      //   setPulseDot(true);
      //   const fromAi = await getOpeningFromAiByName(
      //     extractedName,
      //     lastIdResponse
      //   );
      //   setPulseDot(false);
      //   if (fromAi) {
      //     handleSelectOpening(
      //       { name: fromAi.name, pgn: fromAi.pgn },
      //       fromAi.ideas
      //     );
      //   } else {
      //     onMessage({
      //       content:
      //         "I couldn't find that opening. Try another name or pick one from the list.",
      //       participantId: 'chatGPT123456',
      //       idResponse: '',
      //     });
      //   }
      //   return;
      // }

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
          content:
            'Something went wrong. Please try again or ask something else.',
          participantId: 'chatGPT123456',
          idResponse: '',
        });
      }
    };

    // useEffect(() => {
    //   if (currentChapterState.aiLearn.mode === 'opening' && !stockfish) {
    //     setTimeout(() => setStockfish(true), 3000);
    //   } else if (currentChapterState.aiLearn.mode === 'play' && !stockfish) {
    //     setTimeout(() => setStockfish(true), 500);
    //   }
    // }, [currentChapterState.aiLearn.mode]);

    const isMate = async () => {
      console.log('MAT');
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

    const setRatingEngine = useCallback(
      (category: number) => {
        setRatingBotEngine(category);
        onMessage({
          content: `Game started! You're playing at ${category} level.`,
          participantId: 'chatGPT123456',
          idResponse: '',
        });
        setFreezeButton(false);
      },
      [onQuickImport, onMessage]
    );

    // const openings = async () => {
    //   const data = await getOpenings();

    //   const pgn = data.pgn;
    //   const chess = new Chess();
    //   chess.loadPgn(pgn);
    //   const uciMoves = chess
    //     .history({ verbose: true })
    //     .map((m) => `${m.from}${m.to}${m.promotion ?? ''}`);
    //   addLearnAi({
    //     ...currentChapterState.aiLearn,
    //     mode: 'opening',
    //     name: data.name,
    //     moves: uciMoves,
    //   });
    // };

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
    const playNext = async () => {};
    // const engineMove = (m: string) => {
    //   if (!m || m === '(none)' || m.length < 4) return;
    //   if (currentChapterState.aiLearn.mode !== 'test') return;

    //   const isMyTurn =
    //     currentChapterState.displayFen.split(' ')[1] ===
    //     currentChapterState.orientation;
    //   if (isMyTurn) return;

    //   const fromChess = m.slice(0, 2) as Square;
    //   const toChess = m.slice(2, 4) as Square;
    //   const promoChar = m.length === 5 ? m[4] : undefined;
    //   const promotion =
    //     promoChar === 'q' ||
    //     promoChar === 'r' ||
    //     promoChar === 'b' ||
    //     promoChar === 'n'
    //       ? promoChar
    //       : undefined;

    //   const payload =
    //     promotion != null
    //       ? { from: fromChess, to: toChess, promotion }
    //       : { from: fromChess, to: toChess };

    //   setTimeout(() => {
    //     onMove(payload);
    //   }, 900);
    // };
    // const hint = async () => {};

    const handleSuggestedMove = useCallback(
      (uci: string) => {
        const from = uci.slice(0, 2) as Square;
        const to = uci.slice(2, 4) as Square;
        const promotion =
          uci.length >= 5 ? (uci[4] as 'q' | 'r' | 'b' | 'n') : undefined;
        const turn = currentChapterState.displayFen.split(' ')[1] as 'w' | 'b';
        const promoteTo = promotion
          ? turn === 'w'
            ? (promotion.toUpperCase() as 'Q' | 'R' | 'B' | 'N')
            : promotion
          : undefined;
        setSuggestedMoves(null);
        onMove(promoteTo ? { from, to, promoteTo } : { from, to });
      },
      [onMove, currentChapterState.displayFen]
    );

    const handleGameEvaluation = (newScore: number) => {
      setprevScoreCP(scoreCP);
      setScoreCP(newScore);
    };
    const handleKeepPlaying = () => {
      setKeepPlaying(true);
    };

    const getHint = async () => {
      const history = currentChapterState.notation.history;
      const playedMoves: string[] = [];
      (history as any[]).flat().forEach((m: any) => {
        if (m && !m.isNonMove) {
          playedMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
        }
      });
      const moveCount = playedMoves.length;
      const openingMoves = currentChapterState.aiLearn.moves_test ?? [];
      const blue = '#11C6D1';

      if (moveCount < openingMoves.length) {
        onArrowsChange(
          buildArrowsFromUciMoves([openingMoves[moveCount]], blue)
        );
      } else if (suggestedMainMoveUci) {
        onArrowsChange(buildArrowsFromUciMoves([suggestedMainMoveUci], blue));
      }
    };
    const testOpening = async () => {
      setFreezeButton(true);
      const movesTest: string[] = [];
      (currentChapterState.notation.history as any[])
        .flat()
        .forEach((m: any) => {
          if (m && !m.isNonMove) {
            movesTest.push(`${m.from}${m.to}${m.promotion ?? ''}`);
          }
        });
      addLearnAi({
        ...currentChapterState.aiLearn,
        mode: 'test',
        moves_test: movesTest,
        errors: 0,
        popup: false,
      });
      onMessage({
        content: 'Time to review the opening!',
        participantId: 'chatGPT123456',
        idResponse:
          currentChapterState.messages[currentChapterState.messages.length - 1]
            .idResponse ?? '',
      });
      onQuickImport({
        type: 'FEN',
        val: ChessFENBoard.STARTING_FEN,
      });
      // onArrowsChange({});

      setTimeout(() => setFreezeButton(false), 3000);
    };

    // Auto-play opponent moves in test mode
    useEffect(() => {
      if (currentChapterState.aiLearn.mode !== 'test') return;

      const userColor = currentChapterState.orientation;
      const currentTurnColor = currentChapterState.displayFen.split(' ')[1];

      if (currentTurnColor === userColor) return;

      const history = currentChapterState.notation.history;
      const playedMoves: string[] = [];
      (history as any[]).flat().forEach((m: any) => {
        if (m && !m.isNonMove) {
          playedMoves.push(`${m.from}${m.to}${m.promotion ?? ''}`);
        }
      });
      const moveCount = playedMoves.length;
      const openingMoves = currentChapterState.aiLearn.moves_test ?? [];

      const timer = setTimeout(() => {
        if (moveCount >= openingMoves.length) return;
        const nextUci = openingMoves[moveCount];
        if (!nextUci || nextUci.length < 4) return;

        const from = nextUci.slice(0, 2) as Square;
        const to = nextUci.slice(2, 4) as Square;
        const promoChar =
          nextUci.length >= 5
            ? (nextUci[4] as 'q' | 'r' | 'b' | 'n')
            : undefined;

        onMove(promoChar ? { from, to, promoteTo: promoChar } : { from, to });
      }, 700);

      return () => clearTimeout(timer);
    }, [
      currentChapterState.aiLearn.mode,
      currentChapterState.notation.history,
    ]);

    return (
      <div className="flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl flex-1 flex min-h-0 ">
        {/* {stockfish && currentChapterState.aiLearn.mode === 'test' && (
          <StockFishEngineAI
            fen={currentChapterState.displayFen}
            orientation={currentChapterState.orientation}
            playMode={true}
            isMyTurn={
              currentChapterState.displayFen.split(' ')[1] ===
              currentChapterState.orientation
            }
            engineMove={engineMove}
            engineLines={engineLines}
            IsMate={isMate}
            isMobile={isMobile ?? false}
            newRatingEngine={newRatingEngine}
            ratingEngine={ratingEngine}
            addGameEvaluation={handleGameEvaluation}
          />
        )} */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-2 md:pb-4 rounded-lg">
          {/* Mobile: flex-col scrollable so input stays reachable; desktop: overflow-hidden with flex constraints */}
          <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-y-auto md:overflow-hidden no-scrollbar">
            {/* Buttons: order-1 on mobile (above conversation), order-2 on desktop (below conversation) */}
            <div className="flex order-1 md:order-2 gap-3 flex-shrink-0 pt-2 pb-2 md:my-[20px] justify-around sticky top-0 z-10 bg-op-widget">
              <ButtonGreen
                onClick={() => {
                  testOpening();
                }}
                size="sm"
                className="md:max-w-[140px] max-w-[140px]"
                style={{
                  width: '140px',
                  ...(deviatedFromOpening &&
                  currentChapterState.aiLearn.mode !== 'test'
                    ? {
                        boxShadow:
                          '0 0 12px 4px rgba(7,218,99,0.75), 0 0 24px 8px rgba(7,218,99,0.35)',
                        animation: 'pulseGlow 1.4s ease-in-out infinite',
                      }
                    : {}),
                }}
                disabled={
                  currentChapterState.aiLearn.mode === 'test' ||
                  (currentChapterState.aiLearn.mode === 'opening' &&
                    !openingComplete)
                }
              >
                <p>Opening Test</p>
              </ButtonGreen>
              {currentChapterState.aiLearn.mode === 'opening' && openingComplete && !keepPlaying ? (
                <ButtonGreen
                  onClick={handleKeepPlaying}
                  size="sm"
                  className="md:max-w-[130px] max-w-[130px] hidden md:flex"
                >
                  <p>Keep Playing</p>
                </ButtonGreen>
              ) : currentChapterState.aiLearn.mode === 'opening' && keepPlaying ? null : (
                <ButtonGreen
                  onClick={() => {
                    getHint();
                  }}
                  size="sm"
                  className="md:max-w-[100px] max-w-[100px] hidden md:flex"
                  style={{ maxWidth: smallMobile ? '68px' : '' }}
                  disabled={
                    (currentChapterState.aiLearn.mode !== 'test' && hintActive) ||
                    !!currentChapterState.aiLearn.popup
                  }
                >
                  <p>Hint</p>
                </ButtonGreen>
              )}
              <ButtonGreen
                onClick={requestAnotherOpening}
                size="sm"
                className="max-w-[160px] min-w-[132px]"
                style={{ maxWidth: smallMobile ? '100px' : '' }}
                disabled={currentChapterState.aiLearn.moves.length === 0}
              >
                <p className="pr-4 pl-4">Another Opening</p>
              </ButtonGreen>
            </div>

            {/* Conversation: order-2 on mobile (below buttons), order-1 on desktop */}
            <div className="order-2 md:order-1 min-w-0 md:flex-1 md:min-h-0 md:flex md:flex-col">
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
                    const list = await fetchOpeningSuggestions(4);
                    setSuggestedOpenings(list);
                    onMessage({
                      content:
                        'Here are some openings you could try. Pick one, or type the name of another opening in the box below.',
                      participantId: 'chatGPT123456',
                      idResponse: '',
                    });
                  }
                }}
                pulseDot={pulseDot}
                takeBack={takeBack}
                playNext={playNext}
                userData={userData}
                smallMobile={smallMobile}
                onHistoryNotationRefocus={onHistoryNotationRefocus}
                notationHistoryLength={
                  currentChapterState.notation?.history?.length ?? 0
                }
                suggestedMoves={showColorChoice ? null : suggestedMoves}
                branchMoves={showColorChoice ? null : branchMoves}
                visibleSuggestedRows={visibleSuggestedRows}
                onOtherSuggested={handleOtherSuggested}
                onSuggestedMove={handleSuggestedMove}
                onSuggestedMoveHover={setHoveredSuggestedUci}
                deviatedFromOpening={deviatedFromOpening}
              />
            </div>

            {/* Input: always last (order-3) */}
            <div className="order-3 flex flex-shrink-0 mb-2 mt-2 px-1 md:mt-0 items-center gap-2">
              <input
                id="title"
                type="text"
                name="tags"
                placeholder="Enter opening..."
                value={question}
                style={{ boxShadow: '0px 0px 10px 0px #07DA6380' }}
                className="w-full text-[16px]  md:text-[14px] rounded-[20px] border border-conversation-100 bg-[#111111]/40 text-white placeholder-[#FFFFFF]/25 px-4 py-1 md:py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
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
                className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                  isListening
                    ? 'bg-red-500/80 text-white'
                    : 'bg-[#111111]/40 bg-[#D9D9D9]/20 opacity-30 text-slate-300 hover:bg-slate-600 border border-conversation-100'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <ButtonGreen
                size="md"
                onClick={() => {
                  if (question.trim() !== '') addQuestion(question);
                }}
                disabled={question.trim() == ''}
                icon="PaperAirplaneIcon"
                className="flex-shrink-0 px-4 py-2 duration-200"
              />
            </div>
            {/* <div className="mt-2 flex flex-wrap items-center gap-1 text-sm text-slate-300 min-w-0 max-h-20 overflow-y-auto overflow-x-hidden">
              {' '}
              {currentChapterState.notation?.history?.map((pair, moveIdx) => (
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
              {suggestedMainMoveUci &&
                (() => {
                  const from = suggestedMainMoveUci.slice(0, 2) as Square;
                  const to = suggestedMainMoveUci.slice(2, 4) as Square;
                  const promotion =
                    suggestedMainMoveUci.length >= 5
                      ? (suggestedMainMoveUci[4] as 'q' | 'r' | 'b' | 'n')
                      : undefined;
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
            </div> */}
          </div>

          <div className="hidden md:flex flex-shrink-0 md:h-[240px] mt-2 rounded-lg  md:p-4 p-2 overflow-y-auto no-scrollbar">
            <FreeBoardNotation
              // reviewData={reviewData}
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
