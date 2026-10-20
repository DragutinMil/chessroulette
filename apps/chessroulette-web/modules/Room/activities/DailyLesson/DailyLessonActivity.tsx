import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { Chess, Square } from 'chess.js';
import {
  ChessMove,
  FreeBoardHistory,
  noop,
  ShortChessMove,
} from '@xmatter/util-kit';
import { PanelResizeHandle } from 'react-resizable-panels';
import movexConfig from '@app/movex.config';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { ArrowsMap } from '@app/components/Chessboard/types';
import { getProductLabel } from '@app/modules/User';
import { getRandomStr } from '@app/util';

import { useDailyLessonActivitySettings } from './hooks/useDailyLessonActivitySettings';
import {
  enqueueMovexUpdate,
  getSubscribeInfo,
  illegalMoveMessage,
  pickHintHelpMessage,
  pickVariedMessage,
  pickVariedWrongMoveMessage,
} from './util';
import { DailyLessonDialogContainer } from './DialogContainer/DailyLessonDialogContainer';
import {
  DailyLessonActivityState,
  dailyLesson,
  findLoadedChapter,
  initialDefaultChapter,
} from './movex';
import {
  ANY_LEGAL_REPLY,
  findLesson,
  getNextLessonId,
  LessonStep,
  MAX_HINTS_PER_STEP,
} from './lessonDatabase';
import {
  buildSolutionArrow,
  computeLinePath,
  hasMoreUserMoves,
  illegalMoveReason,
  isValidUnorderedMove,
  knightElbowSquare,
  movesMatch,
  pieceAt,
  pieceLegalTargets,
  resolveNextUnorderedTarget,
  resolveOpponentReply,
  requestBestMoveUci,
  rookRankSquaresByRook,
  uciToMove,
} from './lessonEngine';
import { WidgetPanel } from './components/WidgetPanel';
import { DailyLessonBoard } from './components/DailyLessonBoard';
import { PawnyEngine } from './components/PawnyEngine';
import { MateDefenseEngine } from './components/MateDefenseEngine';
import { pickBoxMethodHint } from './checkmateTechnique';
import { SendHintExplanation } from './components/WidgetPanel/SendHintExplanation';
import { LessonProgressBar } from './components/LessonProgressBar';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';

const COACH = 'chatGPT123456';
// Day 14 "Your First Game" - Pawny-jeve poruke idu pod SVOJIM participantId-em
// (ne COACH), da bi Conversation.tsx mogao da mu prikaze sopstveni avatar/
// animaciju umesto zelenog loga. Vidi PAWNY_AVATAR_FRAMES tamo.
const PAWNY = 'pawny-bot';
const OPPONENT_REPLY_DELAY_MS = 450;
// kind:'markSquares' - boja tackice za polje koje je KORISNIK trenutno
// obelezio (razlicita od quizHighlightSquares boja koje su sistemski/hint
// otkrivena resenja).
const MARK_SELECT_COLOR = '#11C6D1';
// LessonStep.highlightRookRanks (Day 17 "Two Rooks Checkmate") - ceo red na
// kom top stoji, posle SVAKOG poteza. Default (top koji samo drzi liniju) =
// ISTA zuta kao app-ovo sopstveno "last move" oznacavanje (outpostTheme.board.
// lastMoveToSquare, hooks/useTheme/defaultTheme.tsx). Top koji BAS TOM potezu
// daje sah = nasa brend zelena, da se vidi razlika "ko sece, ko sahira" na
// prvi pogled. Translucentne (fill preko celog polja, ne tanak okvir) da se
// figure ispod i dalje vide - isto vizuelno jezik kao lichess "last move".
const ROOK_RANK_CUTOFF_COLOR = 'rgba(155, 199, 0, .41)';
const ROOK_RANK_CHECK_COLOR = 'rgba(7, 218, 99, .38)';

type Props = {
  remoteState: DailyLessonActivityState['activityState'];
  dispatch?: MovexBoundResourceFromConfig<
    (typeof movexConfig)['resources'],
    'room'
  >['dispatch'];
};

export const DailyLessonActivity = ({
  remoteState,
  dispatch: optionalDispatch,
}: Props) => {
  const dispatch = optionalDispatch || noop;
  const settings = useDailyLessonActivitySettings();

  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  if (!moveSoundRef.current) {
    moveSoundRef.current = new Audio('/chessmove.mp3');
  }
  const wrongMoveSoundRef = useRef<HTMLAudioElement | null>(null);
  if (!wrongMoveSoundRef.current) {
    wrongMoveSoundRef.current = new Audio('/buzz.flac');
    wrongMoveSoundRef.current.volume = 0.4;
  }
  const stepDoneSoundRef = useRef<HTMLAudioElement | null>(null);
  if (!stepDoneSoundRef.current) {
    stepDoneSoundRef.current = new Audio('/good.wav');
    stepDoneSoundRef.current.volume = 0.5;
  }

  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const wrongMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // LessonStep.wrongPathPreview (Day 17 Step 3) - isti crveni X kao
  // wrongSquare, ali TRAJAN (ne 700ms) i prikazan UNAPRED pri ucitavanju
  // koraka, ne kao posledica stvarnog pokusaja - vidi beginStep.
  const [xMarkSquares, setXMarkSquares] = useState<Square[] | null>(null);
  // "Jump over" efekat (Knight, LessonStep.jumpGlow) - polje koje skakac
  // preskace kratko zasvetli zlatno, pa se samo ugasi.
  const [glowSquare, setGlowSquare] = useState<Square | null>(null);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // "Reveal path" (History lekcija, LessonStep.revealPath) - polja izmedju
  // from/to se pale kvadrat po kvadrat, isti hintSquares mehanizam kao hint.
  const [revealSquares, setRevealSquares] = useState<Square[] | null>(null);
  const revealTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Board highlight (LessonStep.quizBoardHighlight) - scenski prikaz
  // strelica/obojenih polja. Koristi se na vise mesta: posle odgovora na
  // kviz pitanje (uvek, bez obzira na tacnost), posle TACNOG poteza na
  // goalCondition koraku, i odmah pri ucitavanju "watch & learn" koraka
  // (kind:'quiz' bez quizOptions - cista demonstracija, nema pitanje).
  // Generican, ne Day9/Day10-specifican. Ostaje dok korisnik ne predje na
  // sledeci korak (clearFeedback u loadStep ga gasi).
  const [quizHighlightSquares, setQuizHighlightSquares] = useState<
    { square: Square; color: string }[] | null
  >(null);
  const [quizHighlightArrows, setQuizHighlightArrows] =
    useState<ArrowsMap | null>(null);
  // LessonStep.highlightRookRanks (Day 17) - CEO red svakog topa, posle
  // SVAKOG poteza (ne samo zavrsnog) - potpuno odvojen kanal od
  // quizHighlightSquares (FILL preko celog polja, ne okvir - vidi
  // squareRenderer ispod), da se figure ispod i dalje vide. Racuna se u
  // onMove (vidi applyRookRankHighlight), ne ovde.
  const [rookRankSquares, setRookRankSquares] = useState<
    { square: Square; color: string }[] | null
  >(null);
  const applyBoardHighlight = useCallback(
    (highlight: NonNullable<LessonStep['quizBoardHighlight']>) => {
      const { arrows, squares } = highlight;
      if (arrows?.length) {
        const arrowsMap = arrows.reduce(
          (acc, { from, to, color }) => {
            acc[`${from}${to}-${color}`] = [from, to, color];
            return acc;
          },
          {} as Record<string, [string, string, string]>
        );
        setQuizHighlightArrows(arrowsMap as unknown as ArrowsMap);
      }
      if (squares?.length) {
        setQuizHighlightSquares(
          squares.map((s) => ({ square: s.square as Square, color: s.color }))
        );
      }
    },
    []
  );
  // kind:'markSquares' - polja koja je KORISNIK obelezio desnim klikom
  // (desktop) ili tapom (mobilni), JEDNO PO JEDNO. Lokalno, ne ide kroz
  // movex - ovo je "u toku" selekcija pre provere, ne treba drugim
  // igracima u sobi.
  const [markedSquares, setMarkedSquares] = useState<Set<Square>>(new Set());
  const lastMarkNudgeAtRef = useRef(0);
  // kind:'freePlay' (Day 14 "Your First Game") - broj odigranih poteza
  // (oba igraca zajedno) u tekucoj partiji, i koji indeksi iz
  // step.freePlayMessages su vec iskorisceni (nema ponavljanja u istoj
  // partiji). Resetuje se na svaki novi pocetak koraka (beginStep) - i
  // prvi put i na "Play again" (Repeat).
  const freePlyCountRef = useRef(0);
  const freePlayUsedMsgsRef = useRef<Set<number>>(new Set());
  // Samo KORISNIKOVI potezi (ne Pawny-jevi) - za motivationMessages ucestalost
  // (prvih 5 - svaki put, do 15. - na svaki 3., posle - na svaki 5.).
  const userMoveCountRef = useRef(0);
  const motivationUsedMsgsRef = useRef<Set<number>>(new Set());
  // LessonStep.techniqueTips (Day 20 "Deliver Mate" Phase 2) - za razliku od
  // freePlayMessages/motivationUsedMsgsRef gore, ovaj pool se RECIKLIRA kad
  // se potrosi (Set se isprazni i kreze ispocetka) umesto da samo cuti -
  // partija moze trajati duze od broja saveta u pool-u.
  const techniqueTipsUsedRef = useRef<Set<number>>(new Set());
  // Hint dugme u toku live AI poziva (Stockfish + ai_prompt) - LessonStep.liveHint
  // (Day 20 Phase 2). Odvojeno od standardnog hintsRef/MAX_HINTS_PER_STEP
  // brojaca (taj ovde NAMERNO nije dotaknut - live hint je dostupan
  // neograniceno, vidi onHint), samo sprecava duplo klikanje dok traje poziv.
  const [liveHintLoading, setLiveHintLoading] = useState(false);
  // checkmateTechnique.ts 'queenBoxMethod' - polje na koje je POSLEDNJI Hint
  // predlozio damu (samo kad je taj predlog bio box-fazni potez) - prosledjuje
  // se nazad u pickBoxMethodHint kao "izbegni ovo polje ako mozes", jedina
  // zastita od vezanog ponavljanja istog polja kad nijedan potez ne pravi
  // strogo poboljsanje. Resetuje se na novi korak.
  const lastHintQueenSquareRef = useRef<string | null>(null);
  // Sigurnosna brava protiv dupliranja korisnikovog poteza (freePlay) - ako
  // tabla/dnd biblioteka ikad ispali isti (from,to) dvaput veoma brzo za
  // redom (poznat "ghost click posle drag-a" tip problema), drugi poziv se
  // tiho ignorise umesto da se potez odigra dvaput.
  const lastUserMoveRef = useRef<{ key: string; at: number } | null>(null);
  // quizRetryOnWrong (Day 15 Position 6 "Yes/No") - da li je OVAJ korak vec
  // definitivno odgovoren TACNO. Namerno odvojeno od progressRef: "Got it!"
  // se otkljucuje cim se odgovori (tacno ILI netacno, vidi onSelectQuizAnswer)
  // tako da korisnik nikad ne ostane zarobljen, ali bez OVOG ref-a ponovni
  // pokusaj (Yes posle No) bi se blokirao - lessonState.progress se sinhronizuje
  // nazad u progressRef cim stigne kroz Movex (vidi efekat iznad), pa
  // progressRef sam vise NIJE pouzdan signal "da li sme ponovo da se odgovori"
  // za ovaj tip koraka.
  const quizAnsweredCorrectlyRef = useRef(false);
  // freePlay - pozicija posle korisnikovog drop-a, prikazana odmah dok Movex ne potvrdi.
  const [freePlayOptimisticFen, setFreePlayOptimisticFen] = useState<
    string | null
  >(null);
  // Reaktivna kopija freePlyCountRef - SAMO za UI gating (Take Back dugme
  // treba "bar jedna cela runda odigrana"), ref ostaje izvor istine za
  // sinhronu logiku unutar applyFreePlayPly (vidi tamo).
  const [freePlyCountState, setFreePlyCountState] = useState(0);
  // Menja se SAMO na Take Back (ne na svaki potez!) - jedini ispravan
  // trenutak da se PawnyEngine remountuje (vidi tamo zasto remount uopste
  // treba). key={freePlyCountState} je OVDE bio bug: remountuje PawnyEngine
  // na SVAKI potez (i korisnikov i Pawny-jev), a currentChapter.displayFen
  // je prop koji moze zaostati korak iza (Movex dispatch nije sinhron) - nov
  // PawnyEngine instance bi mountovala sa JOS STARIM fen-om, mislila da je
  // i dalje Pawny na potezu (jer se "aktivno" pita po zastareloj poziciji),
  // i odigrala DRUGI potez pre nego sto je korisnik uopste stigao na red.
  const [takeBackVersion, setTakeBackVersion] = useState(0);
  // Indeksi kviz koraka odgovorenih NETACNO - progress traka ih trajno
  // oboji roze (vidi LessonProgressBar.wrongSegments), ne resetuje se po
  // koraku (za razliku od ostalih feedback refova) jer treba da ostane
  // vidljivo i posle prelaska na sledece pitanje. Resetuje se na Repeat.
  const [wrongQuizSteps, setWrongQuizSteps] = useState<Set<number>>(
    new Set()
  );
  // Kratak "fokus na kviz" flash - tabla se zatamni kad user pokusa potez
  // dok je aktivno kviz pitanje (vidi onMove).
  const [quizBoardNudge, setQuizBoardNudge] = useState(false);
  const quizNudgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Hint dugme - 1. klik oznaci SAMO figuru koja igra, 2. klik doda i strelicu do mete.
  const [hintArrowMap, setHintArrowMap] = useState<ArrowsMap | null>(null);
  const [hintPieceSquare, setHintPieceSquare] = useState<string | null>(null);
  const hintArrowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Pogresan potez - tackice na svim poljima gde STVARNO sme figura koja je
  // na potezu (ne ona koju je korisnik pogresno pomerio), plus highlight na
  // njenom polju da se vidi koju figuru treba pomeriti.
  const [wrongMoveHint, setWrongMoveHint] = useState<{
    from: string;
    targets: string[];
  } | null>(null);
  const wrongMoveHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Blokira tablu dok traje protivnicki odgovor ili prelazak na sledeci korak.
  const [isBusy, setIsBusy] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  // Popup za novu pod-temu usred lekcije (npr. rokada) - null dok korak nema
  // preStepIntro. Generican mehanizam, ne samo za King/rokadu.
  const [preStepIntro, setPreStepIntro] = useState<LessonStep['preStepIntro'] | null>(
    null
  );

  const [userData, setUserData] = useState({
    name_first: '',
    name_last: '',
    picture: '',
    is_trial: false,
    user_id: '',
    new_product_id: '',
    subscriptionProduct: '',
  });

  useEffect(() => {
    const getUserData = async () => {
      const data = await getSubscribeInfo();
      setUserData({
        name_first: data?.name_first,
        name_last: data?.name_last,
        picture: data?.profile_image_url,
        is_trial: data?.is_trial,
        user_id: data?.user_id,
        new_product_id: data?.new_product_id,
        subscriptionProduct: getProductLabel(data ?? {}),
      });
    };
    getUserData();
  }, []);

  const currentChapter =
    findLoadedChapter(remoteState) || initialDefaultChapter;
  const lessonState = currentChapter.dailyLesson;
  const lesson = findLesson(lessonState.lessonId);

  // Prava pozicija stigla kroz Movex - optimisticna vise ne treba.
  useEffect(() => {
    setFreePlayOptimisticFen(null);
  }, [currentChapter.displayFen]);

  /**
   * stepIndex mora lokalno iz istog razloga kao progress ispod - loadStep ga
   * sinhrono postavlja PRE bilo kog dispatch-a. Bez ovoga, `step`/progress
   * traka bi za trenutak citali STARI stepIndex (remote jos nije stigao) sa
   * VEC resetovanim progress-om (0, iz ref-a) - izgleda kao da traka na
   * trenutak "skoci nazad" na stari segment pa se onda ponovo napuni na novi.
   */
  const stepIndexRef = useRef(lessonState.stepIndex);
  const step: LessonStep | null = lesson?.steps[stepIndexRef.current] ?? null;

  const totalSteps = lesson?.steps.length ?? 0;
  const isLastStep = !!lesson && stepIndexRef.current === totalSteps - 1;

  /**
   * Movex state stize tek posle round-tripa, pa bi brza dva poteza zaredom
   * (a upravo to su 'teach' koraci) citala stari progress i drugi tacan potez
   * bi bio ocenjen kao greska. Ref vodi napredak lokalno.
   *
   * Dok loadStep vraca korak na pocetak, remote jos nosi stari progress -
   * bez `awaitingReset` bi ga render odmah vratio nazad i Hint bi trazio
   * potez sa mesta na kom smo stali umesto prvog.
   */
  const progressRef = useRef(lessonState.progress);
  const stepKeyRef = useRef(`${lessonState.lessonId}:${lessonState.stepIndex}`);
  const awaitingResetRef = useRef(false);
  const stepKey = `${lessonState.lessonId}:${lessonState.stepIndex}`;

  // Isti problem kao progress - hint/error brojaci moraju da se citaju lokalno,
  // ne iz (mozda zastarelog) lessonState, inace brzi uzastopni klikovi na Hint
  // svi vide isti stari broj i uvecanje se izgubi (uvek +1 od istog starog 0).
  const hintsRef = useRef(lessonState.hints);
  const errorsRef = useRef(lessonState.errors);
  const totalHintsRef = useRef(lessonState.totalHints);
  const totalErrorsRef = useRef(lessonState.totalErrors);

  if (awaitingResetRef.current) {
    // Reset je stigao kroz Movex tek kad se poklope i korak i progress. Dok
    // se ceka, NE diramo hintsRef/errorsRef/totalRef ispod - loadStep ih je
    // vec sinhrono postavio na tacnu vrednost, a zastareo remote (koji jos
    // nosi brojeve sa proslog koraka) ne sme da ih prepise nazad.
    if (stepKey === stepKeyRef.current && lessonState.progress === 0) {
      awaitingResetRef.current = false;
    }
  } else {
    if (stepKeyRef.current !== stepKey) {
      stepKeyRef.current = stepKey;
      progressRef.current = lessonState.progress;
      hintsRef.current = lessonState.hints;
      errorsRef.current = lessonState.errors;
    } else if (lessonState.progress > progressRef.current) {
      progressRef.current = lessonState.progress;
    }
    if (lessonState.hints > hintsRef.current) hintsRef.current = lessonState.hints;
    if (lessonState.errors > errorsRef.current) errorsRef.current = lessonState.errors;
    if (lessonState.totalHints > totalHintsRef.current)
      totalHintsRef.current = lessonState.totalHints;
    if (lessonState.totalErrors > totalErrorsRef.current)
      totalErrorsRef.current = lessonState.totalErrors;
  }
  const progress = progressRef.current;

  /**
   * Svaki dispatch koji salje "sledece stanje lekcije" mora hintove/greske
   * da uzme odavde (refovi), ne iz `lessonState` (movex prop) - on moze biti
   * koji korak zastareo, pa bi npr. potez koji zavrsi primer (mat) tihо
   * prepisao broj hintova/gresaka nazad na staru vrednost od pre klika na
   * Hint. `patch` ide poslednji, pa i dalje moze eksplicitno da ih promeni
   * (npr. loadStep resetuje hints/errors na 0 za novi korak).
   */
  const withCounters = useCallback(
    (patch: Partial<dailyLesson>): dailyLesson => ({
      ...lessonState,
      hints: hintsRef.current,
      errors: errorsRef.current,
      totalHints: totalHintsRef.current,
      totalErrors: totalErrorsRef.current,
      ...patch,
    }),
    [lessonState]
  );

  // kind:'freePlay' (Day 14) nema solution niz (ostaje []) - "zavrsen" znaci
  // partija je stvarno gotova (mat/pat/remi), ne progress>=0 koje bi bilo
  // odmah tacno od samog pocetka i blokiralo tablu pre prvog poteza.
  const isStepComplete = !!step &&
    (step.kind === 'freePlay'
      ? lessonState.completed
      : progress >= step.solution.length);
  // "Watch & learn" kviz korak bez quizOptions (npr. Day 10 primeri bez
  // poteza) i kind:'markSquares' - zavrsen je odmah/cim korisnik zavrsi
  // obelezavanje, ali korisnik treba NEOGRANICENO vreme da pogleda
  // tablu/procita tekst pre nego sto predje dalje. Namerno NE ulazi u
  // nextReady (iskljucuje 6s auto-advance fill, pun-ekran zatamnjenje i
  // pulsiranje dole - sve to je za "upravo resen potez", ne za demonstraciju
  // ili tek zavrseno obelezavanje). Next/Got it dugme ostaje klikabilno
  // (isStepComplete je i dalje true), samo bez te agresivne najave.
  const isWatchStep =
    (step?.kind === 'quiz' && !step.quizOptions) ||
    step?.kind === 'markSquares' ||
    !!step?.noAutoAdvance;
  // Next je spreman za klik - i progress traka i Next dugme slave isti trenutak.
  const nextReady =
    !lessonState.completed &&
    isStepComplete &&
    !isBusy &&
    !isLastStep &&
    !isWatchStep;

  /**
   * Progress traka broji 5 delova, ne 9: svaki 'teach' korak je svoj deo, a
   * svih pet puzzli cine poslednji deo koji se puni kako se resavaju.
   */
  const segments = useMemo(() => {
    const steps = lesson?.steps ?? [];
    // lesson.flatProgressSegments - OTKAZUJE grupisanje ispod: svaki korak
    // (ukljucujuci trailing puzzle korake) dobija SVOJ segment. Koristi se
    // kad su puzzle koraci tematski razliciti, pojedinacno imenovani primeri
    // (npr. Day 10 "Find the checkmate"), ne ponovljena vezba istog tipa -
    // inace bi JEDNA greska na BILO KOJOJ od njih obojila ceo spojeni
    // segment, iako su ostale tacne.
    if (lesson?.flatProgressSegments) {
      const stepIndex = stepIndexRef.current;
      return {
        total: steps.length,
        current: stepIndex,
        // kind:'freePlay' (Day 14) nema solution.length da deli (ostaje []) -
        // bez ove provere bilo bi 0/0 = NaN, pa nevalidan CSS width.
        completed: stepIndex,
        currentFraction:
          step && step.solution.length ? progress / step.solution.length : 0,
      };
    }
    // Samo TRAILING niz puzzle-koraka na KRAJU niza (npr. Rook/Bishop-ovih 5
    // vezbi) se grupise u jedan "vezbaj" segment. Puzzle korak koji NIJE deo
    // te zavrsne grupe (npr. Kingov "uhvati pesaka" usred lekcije) dobija
    // SVOJ segment kao i svaki teach korak - ne sme da se grupise sa
    // stvarima posle njega.
    let trailingPuzzleStart = steps.length;
    while (
      trailingPuzzleStart > 0 &&
      steps[trailingPuzzleStart - 1].kind === 'puzzle'
    ) {
      trailingPuzzleStart -= 1;
    }
    const trailingPuzzleCount = steps.length - trailingPuzzleStart;
    const total = trailingPuzzleStart + (trailingPuzzleCount > 0 ? 1 : 0);
    const stepIndex = stepIndexRef.current;

    if (stepIndex < trailingPuzzleStart) {
      return {
        total,
        current: stepIndex,
        completed: stepIndex,
        currentFraction:
          step && step.solution.length ? progress / step.solution.length : 0,
      };
    }

    const solvedPuzzles =
      stepIndex - trailingPuzzleStart + (isStepComplete ? 1 : 0);
    return {
      total,
      current: trailingPuzzleStart,
      completed:
        trailingPuzzleStart + (solvedPuzzles >= trailingPuzzleCount ? 1 : 0),
      currentFraction: trailingPuzzleCount
        ? solvedPuzzles / trailingPuzzleCount
        : 0,
    };
  }, [lesson, step, progress, isStepComplete]);

  const sendCoachMessage = useCallback(
    (content: string, kind?: 'task') =>
      enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:writeMessage',
          payload: { content, participantId: COACH, idResponse: '', kind },
        })
      ),
    [dispatch]
  );

  /** Day 14 "Your First Game" - Pawny-jeve poruke u toku partije (vidi
   * applyFreePlayPly), odvojene od sendCoachMessage da dobiju sopstveni
   * avatar u Conversation.tsx. Zavrsna poruka ("Interesting game...") i dalje
   * ide kao Coach (tako je i navedeno u tiketu), samo poruke iz pool-a. */
  const sendPawnyMessage = useCallback(
    (content: string) =>
      enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:writeMessage',
          payload: { content, participantId: PAWNY, idResponse: '' },
        })
      ),
    [dispatch]
  );

  /**
   * Zadatak koraka ide u posebnom oblacicu, odvojenom od obicnog chata. Za
   * kviz pitanje (kind:'quiz') ovo JE pitanje samo - dugmad sa odgovorima se
   * dodaju odmah ispod njega, u istom skrolujucem toku (Conversation.tsx).
   */
  const sendStepIntro = useCallback(
    (target: LessonStep) =>
      sendCoachMessage(`**${target.prompt}**\n\n${target.introText}`, 'task'),
    [sendCoachMessage]
  );

  /**
   * `keepHintArrow` - kad su hintovi za korak potroseni, poslednja strelica
   * ostaje na tabli (korisnik nema vise nista drugo da se osloni) - ne brise
   * se na pogresan potez, samo kad se ucita novi korak ili zatrazi nov hint.
   */
  const clearFeedback = useCallback((opts?: { keepHintArrow?: boolean }) => {
    if (wrongMoveTimeoutRef.current) clearTimeout(wrongMoveTimeoutRef.current);
    if (wrongMoveHintTimeoutRef.current)
      clearTimeout(wrongMoveHintTimeoutRef.current);
    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    revealTimeoutsRef.current.forEach(clearTimeout);
    revealTimeoutsRef.current = [];
    setWrongSquare(null);
    setWrongMoveHint(null);
    setGlowSquare(null);
    setRevealSquares(null);
    setQuizHighlightSquares(null);
    setQuizHighlightArrows(null);
    setMarkedSquares(new Set());
    if (!opts?.keepHintArrow) {
      if (hintArrowTimeoutRef.current) clearTimeout(hintArrowTimeoutRef.current);
      setHintArrowMap(null);
      setHintPieceSquare(null);
    }
  }, []);

  /** Odigrava protivnicki odgovor u puzzle koracima. */
  const playOpponentReply = useCallback(
    async (
      fenAfterUserMove: string,
      replyUci: string,
      nextLesson: dailyLesson
    ) => {
      const reply = resolveOpponentReply(fenAfterUserMove, replyUci);
      if (!reply) return;

      await new Promise<void>((resolve) =>
        setTimeout(resolve, OPPONENT_REPLY_DELAY_MS)
      );
      moveSoundRef.current?.play().catch(() => {});
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:addDailyLessonMove',
          payload: {
            // promoteTo mora da se prenese - ChessFENBoard.move() BEZ njega
            // ne promovise automatski u damu, samo ostavi pesaka na mestu.
            move: {
              from: reply.from,
              to: reply.to,
              ...(reply.promoteTo
                ? { promoteTo: reply.promoteTo as ChessMove['promoteTo'] }
                : {}),
            },
            lesson: nextLesson,
          },
        })
      );
    },
    [dispatch]
  );

  /**
   * Salje uvodnu poruku koraka i, ako prvi potez u solution nizu pripada
   * PROTIVNIKU (boja razlicita od orientation - npr. "crni je vec na potezu"),
   * odigra ga automatski pre nego sto korisnik uopste dobije kontrolu.
   * Generican mehanizam - ne samo za King "hvata pesaka" primer.
   */
  const beginStep = useCallback(
    async (target: LessonStep) => {
      await sendStepIntro(target);

      // kind:'freePlay' (Day 14 "Your First Game") - prava partija, ne
      // skriptovana vezba. Samo reset brojaca za novu partiju (i prvi put i
      // na "Play again") - popup/completed su vec false iz pocetnog stanja,
      // nema potrebe da se ovde eksplicitno gase kao kod watch koraka.
      if (target.kind === 'freePlay') {
        freePlyCountRef.current = 0;
        setFreePlyCountState(0);
        setTakeBackVersion(0);
        freePlayUsedMsgsRef.current = new Set();
        userMoveCountRef.current = 0;
        motivationUsedMsgsRef.current = new Set();
        techniqueTipsUsedRef.current = new Set();
        lastHintQueenSquareRef.current = null;
        lastUserMoveRef.current = null;
        setIsBusy(false);
        return;
      }

      // "Watch & learn" kviz korak bez quizOptions (npr. Day 10 "primeri bez
      // poteza") - nema pitanje da se odgovori, samo prikaz pozicije +
      // objasnjenje. Zavrsava se odmah pri ucitavanju (progress na kraj),
      // board highlight se prikazuje odmah, Next dugme dole postaje
      // dostupno bez ikakve akcije korisnika. Generican mehanizam.
      if (target.kind === 'quiz' && !target.quizOptions) {
        progressRef.current = target.solution.length;
        if (target.quizBoardHighlight) {
          applyBoardHighlight(target.quizBoardHighlight);
        }
        // popup/completed MORAJU eksplicitno ovde - withCounters siri ceo
        // STARI lessonState, a ako je koran malopre bio na zavrsnom ekranu
        // (Repeat sa poslednjeg koraka), taj stari lessonState jos uvek nosi
        // popup:true/completed:true dok Movex ne stigne nazad. Bez ovoga bi
        // se zavrsni popup odmah ponovo pojavio na prvom (watch) koraku.
        await enqueueMovexUpdate(() =>
          dispatch({
            type: 'loadedChapter:setDailyLesson',
            payload: withCounters({
              progress: target.solution.length,
              popup: false,
              completed: false,
            }),
          })
        );
        // Prelaz izmedju vecih tematskih celina (npr. Day 11 "Bravo! Let's
        // move on...") - dodatna poruka POSLE standardnog zavrsetka, Next
        // dugme (umesto Got it) se bira u WidgetPanel preko nextButtonText.
        if (target.transitionText) {
          await sendCoachMessage(target.transitionText);
        }
        setIsBusy(false);
        return;
      }

      // Linija/oznaka vec nacrtana PRE pitanja (npr. Day 11 Section C -
      // "sta je ovo nacrtano?") - za razliku od standardnog kviz highlight-a
      // koji se otkriva tek POSLE odgovora, ovde je sam predmet pitanja.
      if (
        target.kind === 'quiz' &&
        target.quizOptions &&
        target.quizBoardHighlightUpfront &&
        target.quizBoardHighlight
      ) {
        applyBoardHighlight(target.quizBoardHighlight);
      }

      // Strelica do resenja vidljiva ODMAH, bez cekanja Hint klika (npr.
      // Day 12 "Bring It On!" - vodjeno izvodjenje, ne testiranje znanja).
      if (
        (target.kind === 'teach' || target.kind === 'puzzle') &&
        target.showSolutionArrowUpfront
      ) {
        const uci = target.solution[0];
        if (uci) setHintArrowMap(buildSolutionArrow(uci));
      }

      // "Zasto NE ovaj ocigledan potez" upozorenje, vidljivo ODMAH (npr. Day
      // 17 Step 3 - zasto rook ne moze da sahira odavde) - roze strelica(e) +
      // trajan crveni X, isti vizuelni jezik kao stvaran pogresan potez, samo
      // prikazan unapred kao objasnjenje, ne kao posledica pokusaja.
      if (
        (target.kind === 'teach' || target.kind === 'puzzle') &&
        target.wrongPathPreview
      ) {
        applyBoardHighlight({
          arrows: target.wrongPathPreview.arrows.map(({ from, to }) => ({
            from,
            to,
            color: '#f2358d',
          })),
        });
        setXMarkSquares(target.wrongPathPreview.squares as Square[]);
      }

      // LessonStep.highlightRookRanks (Day 17) - vidljivo ODMAH i PRE
      // prvog poteza, ne tek posle njega (onMove racuna isto posle svakog
      // sledeceg poteza) - korisnik od samog pocetka vidi koji top vec sad
      // drzi kralja, koji je slobodan da se pomeri. Nema "koji je upravo
      // sahirao" boje ovde (nema jos odigranog poteza) - oba reda isti,
      // podrazumevani ton.
      if (
        (target.kind === 'teach' || target.kind === 'puzzle') &&
        target.highlightRookRanks
      ) {
        const rookGroups = rookRankSquaresByRook(target.fen, target.orientation);
        setRookRankSquares(
          rookGroups.flatMap(({ rankSquares }) =>
            rankSquares.map((sq) => ({
              square: sq as Square,
              color: ROOK_RANK_CUTOFF_COLOR,
            }))
          )
        );
      }

      const firstUci = target.solution[0];
      if (target.kind === 'puzzle' && firstUci && firstUci !== ANY_LEGAL_REPLY) {
        const { from } = uciToMove(firstUci);
        const mover = pieceAt(target.fen, from);
        if (mover && mover.color !== target.orientation) {
          progressRef.current = 1;
          // popup/completed eksplicitno iz istog razloga kao watch-koraci
          // iznad - ako je ovo prvi korak posle Repeat-a sa zavrsnog ekrana,
          // withCounters bi inace preko starog lessonState vratio popup
          // nazad na true.
          await playOpponentReply(
            target.fen,
            firstUci,
            withCounters({ progress: 1, popup: false, completed: false })
          );
        }
      }
      setIsBusy(false);
    },
    [
      sendStepIntro,
      playOpponentReply,
      withCounters,
      applyBoardHighlight,
      dispatch,
      sendCoachMessage,
    ]
  );

  /** Ucitava zadati korak na tablu i resetuje napredak u njemu. */
  const loadStep = useCallback(
    async (stepIndex: number, lessonPatch: Partial<dailyLesson> = {}) => {
      const target = lesson?.steps[stepIndex];
      if (!target) return;

      clearFeedback();
      // NIJE u clearFeedback - taj se zove i na pogresan potez, gde top nije
      // stvarno pomeren pa stari rook-rank highlight i dalje tacno opisuje
      // tablu. Resetuje se SAMO ovde, na ucitavanje novog koraka.
      setRookRankSquares(null);
      setXMarkSquares(null);
      setIsBusy(true);
      // Napredak vracamo odmah, a `awaitingReset` drzi tu nulu dok stari
      // remote progress ne bude zamenjen - vazi i za Repeat (isti korak) i
      // za Next (novi korak), jer oba do tad citaju zastareo state. Isto
      // vazi za hintove/greske po koraku - svaki novi FEN pocinje od 0,
      // odmah, ne cekajuci da remote stigne (inace stari hintsRef ostane
      // "zaglavljen" na broju sa proslog koraka i Hint dugme lazno javlja
      // da su hintovi vec potroseni na sasvim novom primeru).
      progressRef.current = 0;
      hintsRef.current = 0;
      errorsRef.current = 0;
      quizAnsweredCorrectlyRef.current = false;
      // Ukupni brojaci se diraju samo kad ih poziv eksplicitno resetuje
      // (Repeat) - Next ih ne prosledjuje, pa ostaju kakvi jesu (akumuliraju
      // se kroz celu lekciju).
      if (lessonPatch.totalHints !== undefined)
        totalHintsRef.current = lessonPatch.totalHints;
      if (lessonPatch.totalErrors !== undefined)
        totalErrorsRef.current = lessonPatch.totalErrors;
      stepKeyRef.current = `${lessonState.lessonId}:${stepIndex}`;
      stepIndexRef.current = stepIndex;
      awaitingResetRef.current = true;

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:import',
          payload: { input: { type: 'FEN', val: target.fen } },
        })
      );
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setOrientation',
          payload: { color: target.orientation },
        })
      );
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({
            stepIndex,
            progress: 0,
            popup: false,
            ...lessonPatch,
          }),
        })
      );

      // Korak sa preStepIntro ceka klik na taj popup pre nego sto se
      // introText/protivnikov prvi potez uopste odigraju - vidi
      // onDismissPreStepIntro. isBusy ostaje true (tabla blokirana) dotle.
      if (target.preStepIntro) {
        setPreStepIntro(target.preStepIntro);
        return;
      }

      await beginStep(target);
    },
    [
      lesson,
      lessonState,
      dispatch,
      clearFeedback,
      withCounters,
      beginStep,
    ]
  );

  const onDismissPreStepIntro = useCallback(() => {
    setPreStepIntro(null);
    if (step) beginStep(step);
  }, [step, beginStep]);

  const onWrongMove = useCallback(
    async (move: ShortChessMove) => {
      clearFeedback({ keepHintArrow: hintsRef.current >= MAX_HINTS_PER_STEP });
      setWrongSquare(move.to);
      wrongMoveTimeoutRef.current = setTimeout(() => setWrongSquare(null), 700);

      // Hint uvek pokazuje FIGURU KOJA TREBA DA IGRA i njena stvarna moguca
      // polja - ne polje koje je korisnik pogresno pomerio. Ako korisnik npr.
      // pomeri kralja umesto lovca, ovo i dalje tacno pokazuje lovca. Za
      // unorderedTargets korak, polazno polje se cita sa trenutne pozicije
      // figure (resenje vise nema fiksan redosled/from po indeksu).
      // goalCondition korak (npr. "nadji mat u jednom") nema fiksno "tacno"
      // polje - ne postoji jedan unapred odredjen potez da bi se njegov
      // pocetni kvadrat ovde oznacio, a i ne bismo smeli da ga nagovestimo.
      if (step && !step.goalCondition) {
        const from = step.unorderedTargets
          ? resolveNextUnorderedTarget(currentChapter.displayFen, step)?.from
          : uciToMove(step.solution[progressRef.current] ?? '').from;
        if (from) {
          const targets = pieceLegalTargets(currentChapter.displayFen, from);
          // Ostaje na tabli dok korisnik ne odigra sledeci potez (tacan ili
          // pogresan) - ne gasi se samo posle par sekundi.
          setWrongMoveHint({ from, targets });
        }
      }

      // Strelica do resenja se otkriva ODMAH na prvi promasaj (ne ceka se
      // Hint klik) - za korake gde je vodjenje namerno "otkrij tek posle
      // pokusaja" (npr. Day 12 Move 3), za razliku od showSolutionArrowUpfront
      // (vidno od samog pocetka koraka).
      if (step?.revealArrowOnWrongMove) {
        const uci = step.solution[progressRef.current];
        if (uci) setHintArrowMap(buildSolutionArrow(uci));
      }

      // Day 15 Part 2 - Hint namerno ne otkriva resenje (hintNeverRevealsArrow),
      // ali prvi pogresan potez ipak dobija vizuelno objasnjenje (wrongMoveHighlight).
      if (step?.wrongMoveHighlight) {
        applyBoardHighlight(step.wrongMoveHighlight);
      }

      wrongMoveSoundRef.current!.currentTime = 0;
      wrongMoveSoundRef.current?.play().catch(() => {});

      const nextErrors = errorsRef.current + 1;
      const nextTotalErrors = totalErrorsRef.current + 1;
      errorsRef.current = nextErrors;
      totalErrorsRef.current = nextTotalErrors;
      // Traka gore mora da prati ISTI broj gresaka kao "X errors" na kraju
      // lekcije - ne samo pogresne kviz odgovore (vidi onSelectQuizAnswer),
      // nego i pogresne poteze na tabli (teach/puzzle, ukljucujuci
      // goalCondition korake). Bez ovoga Day 9 Part B ("nadji mat/pat sam")
      // bi uvecavao footer brojac a traku ostavljao zelenu.
      setWrongQuizSteps((prev) => new Set(prev).add(stepIndexRef.current));

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          // progress iz ref-a, da ne vratimo napredak unazad ako Movex kasni
          payload: withCounters({ progress: progressRef.current }),
        })
      );
      if (step) {
        if (step.hintTextAlways) {
          await sendCoachMessage(step.hintText);
        } else {
          const lastContent =
            currentChapter.messages[currentChapter.messages.length - 1]
              ?.content;
          await sendCoachMessage(
            pickVariedWrongMoveMessage(step.hintText, lastContent)
          );
        }
      }
    },
    [
      applyBoardHighlight,
      clearFeedback,
      currentChapter.displayFen,
      currentChapter.messages,
      dispatch,
      lessonState,
      sendCoachMessage,
      step,
      withCounters,
    ]
  );

  // Potez koji JESTE tacan po goalCondition (npr. sah-mat), ali je oznacen
  // requireRetry - lekcija uci TACNO odredjen obrazac (npr. Day 12 "Kiss of
  // Death"), ne bilo koji ispravan mat. Za razliku od onWrongMove: bez
  // crvenog X, bez zvuka greske - igrac nije pogresio, samo trazimo da
  // proba drugaciji, tacan potez. Potez se ne primenjuje (nema dispatch-a),
  // tako da se figura vizuelno vraca kao i kod pravog pogresnog poteza.
  const onNearMissMove = useCallback(
    async (alt: NonNullable<LessonStep['altSolutions']>[number]) => {
      clearFeedback({ keepHintArrow: hintsRef.current >= MAX_HINTS_PER_STEP });
      await sendCoachMessage(alt.retryMessage ?? step?.hintText ?? 'Try again!');
    },
    [clearFeedback, sendCoachMessage, step]
  );

  /**
   * kind:'freePlay' (Day 14 "Your First Game") - zajednicka logika za SVAKI
   * odigran potez, i korisnikov i Pawny-jev: primeni ga, prebroj ga (za
   * "svakih 5 poteza" Pawny poruku), i provery kraj partije. Ne postoji
   * "sledeci skriptovan potez" - samo sahovski zavrsni ishod (mat/pat/remi)
   * zavrsava korak, bez obzira ko je odigrao poslednji potez.
   */
  const applyFreePlayPly = useCallback(
    async (move: ShortChessMove, fenBeforeMove: string) => {
      clearFeedback();
      moveSoundRef.current?.play().catch(() => {});

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:addDailyLessonMove',
          payload: {
            move: {
              from: move.from,
              to: move.to,
              ...(move.promoteTo ? { promoteTo: move.promoteTo } : {}),
            },
          },
        })
      );

      freePlyCountRef.current += 1;
      setFreePlyCountState(freePlyCountRef.current);

      const chess = new Chess(fenBeforeMove);
      chess.move({
        from: move.from,
        to: move.to,
        // chess.js prihvata SAMO malo slovo za promociju (q/r/b/n) - UI
        // promotion dijalog salje ispravno veliko/malo slovo PO BOJI (npr.
        // 'Q' za belog), pa se ovde mora eksplicitno spustiti na malo slovo,
        // inace chess.js baca "Invalid move" (video se kod f7-g8=Q).
        promotion: (move.promoteTo ?? 'q').toLowerCase() as 'q' | 'r' | 'b' | 'n',
      });

      if (chess.isGameOver()) {
        // LessonStep.requireCheckmate (Day 20 "Deliver Mate" Phase 2) - SAMO
        // stvaran sah-mat zavrsava korak. Bilo koji drugi kraj (pat, cesta
        // pocetnicka greska pri matiranju damom - "box" bez izlaza, ali bez
        // saha) VRACA bas odigran potez (jedan ply, ne cela runda kao rucno
        // Take Back dugme) i trazi ponovni pokusaj, umesto da "zavrsi"
        // lekciju neuspehom.
        if (step?.requireCheckmate && !chess.isCheckmate()) {
          const history = currentChapter.notation.history;
          const lastIndex = FreeBoardHistory.getLastIndexInHistory(history);
          const oneBack = FreeBoardHistory.decrementIndex(lastIndex);
          clearFeedback();
          await enqueueMovexUpdate(() =>
            dispatch({ type: 'loadedChapter:takeBack', payload: oneBack })
          );
          freePlyCountRef.current = Math.max(0, freePlyCountRef.current - 1);
          setFreePlyCountState(freePlyCountRef.current);
          userMoveCountRef.current = Math.max(0, userMoveCountRef.current - 1);
          // Forsira remount MateDefenseEngine/PawnyEngine - ista zastita kao
          // rucno Take Back dugme (vidi onTakeBack), da eventualni "thinking"
          // timeout zakazan za sada zastarelu poziciju ne odigra potez na
          // vec vracenu tablu.
          setTakeBackVersion((v) => v + 1);
          await sendCoachMessage(
            step.stalemateText ??
              "That's not checkmate yet - try a different move."
          );
          setIsBusy(false);
          return;
        }
        stepDoneSoundRef.current?.play().catch(() => {});
        await sendCoachMessage(step?.doneText ?? '');
        await enqueueMovexUpdate(() =>
          dispatch({
            type: 'loadedChapter:setDailyLesson',
            payload: withCounters({ progress: 1, popup: true, completed: true }),
          })
        );
        setIsBusy(false);
        return;
      }

      // Pawny poruka na svakih 5 poteza (oba igraca zajedno), nasumicna, bez
      // ponavljanja u istoj partiji - kad se pool istroši, cuti do kraja.
      const pool = step?.freePlayMessages;
      if (pool?.length && freePlyCountRef.current % 5 === 0) {
        const unusedIndexes = pool
          .map((_, i) => i)
          .filter((i) => !freePlayUsedMsgsRef.current.has(i));
        if (unusedIndexes.length > 0) {
          const pick =
            unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)];
          freePlayUsedMsgsRef.current.add(pick);
          await sendPawnyMessage(pool[pick]);
        }
      }

      // Tabla/kontrole (Draw/Takeback/Resign) ostaju zakljucane dok NIJE
      // korisnikov red - ako je upravo odigran korisnikov potez, Pawny je
      // sledeci na potezu (jos "razmislja" u PawnyEngine-u, pre svog
      // odigranog poteza), pa se ovde NAMERNO ne otkljucava jos. Otkljucava
      // se tek kad Pawny-jev potez stvarno stigne (ova ista funkcija, drugi
      // poziv) i red se vrati na korisnika.
      if (chess.turn() === step?.orientation) {
        setIsBusy(false);
      }
    },
    [
      clearFeedback,
      currentChapter.notation.history,
      dispatch,
      sendCoachMessage,
      sendPawnyMessage,
      step,
      withCounters,
    ]
  );

  /** kind:'freePlay' - korisnikov potez: mora biti sahovski LEGALAN (nema
   * skriptovano resenje da se poredi), inace tiha odbijena vuca (crveni X,
   * bez chat poruke - ovo je prava partija, ne vezba). */
  const onFreePlayUserMove = useCallback(
    async (move: ShortChessMove) => {
      // Isti (from,to) stigao dvaput u kratkom razmaku - tiho ignorisi drugi
      // poziv (vidi komentar uz lastUserMoveRef).
      const moveKey = `${move.from}${move.to}${move.promoteTo ?? ''}`;
      const now = Date.now();
      if (
        lastUserMoveRef.current &&
        lastUserMoveRef.current.key === moveKey &&
        now - lastUserMoveRef.current.at < 500
      ) {
        return;
      }
      lastUserMoveRef.current = { key: moveKey, at: now };

      const fenBeforeMove = currentChapter.displayFen;
      const chess = new Chess(fenBeforeMove);
      // Partija vec gotova (Movex jos nije javio kraj) - nema poteza ni objasnjenja.
      if (chess.isGameOver()) return;
      let played = false;
      try {
        // chess.js 1.x baca gresku na nelegalan potez (ne vraca null).
        played = !!chess.move({
          from: move.from,
          to: move.to,
          promotion: (move.promoteTo ?? 'q').toLowerCase() as
            | 'q'
            | 'r'
            | 'b'
            | 'n',
        });
      } catch {
        played = false;
      }
      if (!played) {
        // Nelegalan potez - X na polju, tackice gde figura sme, objasnjenje u chatu.
        // Ostaje vidljivo do sledeceg pokusaja.
        clearFeedback();
        const targets = pieceLegalTargets(fenBeforeMove, move.from);
        setWrongSquare(move.to);
        setWrongMoveHint({ from: move.from, targets });
        wrongMoveSoundRef.current!.currentTime = 0;
        wrongMoveSoundRef.current?.play().catch(() => {});
        const why = illegalMoveReason(fenBeforeMove, move.from, move.to);
        if (why) {
          sendCoachMessage(
            illegalMoveMessage(why.reason, why.piece, move.to, targets.length > 0)
          );
        }
        return;
      }
      // Figura ostaje na drop polju odmah, ne vraca se na polazno dok potez ceka u Movex redu.
      setFreePlayOptimisticFen(chess.fen());
      // Motivaciona recenica (Outposty, treneR) - posle KORISNIKOVOG poteza
      // samo, ucestalost opada kroz partiju. Ne ceka se (await) - ide u isti
      // Movex red kao i sam potez ispod, redosled je i dalje tacan jer oba
      // prolaze kroz isti enqueueMovexUpdate niz.
      userMoveCountRef.current += 1;
      const n = userMoveCountRef.current;
      const shouldMotivate =
        n <= 5 || (n <= 15 && n % 3 === 0) || (n > 15 && n % 5 === 0);
      const motivationPool = step?.motivationMessages;
      if (shouldMotivate && motivationPool?.length) {
        const unusedIndexes = motivationPool
          .map((_, i) => i)
          .filter((i) => !motivationUsedMsgsRef.current.has(i));
        if (unusedIndexes.length > 0) {
          const pick =
            unusedIndexes[Math.floor(Math.random() * unusedIndexes.length)];
          motivationUsedMsgsRef.current.add(pick);
          sendCoachMessage(motivationPool[pick]);
        }
      }

      // LessonStep.techniqueTips (Day 20 "Deliver Mate" Phase 2) - POSLE
      // SVAKOG korisnikovog poteza, bez opadanja ucestalosti (za razliku od
      // motivationMessages iznad) - i RECIKLIRA pool kad se potrosi umesto
      // da samo cuti, jer partija moze trajati duze od broja saveta.
      const tipPool = step?.techniqueTips;
      if (tipPool?.length) {
        let unusedTipIndexes = tipPool
          .map((_, i) => i)
          .filter((i) => !techniqueTipsUsedRef.current.has(i));
        if (unusedTipIndexes.length === 0) {
          techniqueTipsUsedRef.current = new Set();
          unusedTipIndexes = tipPool.map((_, i) => i);
        }
        const tipPick =
          unusedTipIndexes[Math.floor(Math.random() * unusedTipIndexes.length)];
        techniqueTipsUsedRef.current.add(tipPick);
        sendCoachMessage(tipPool[tipPick]);
      }

      setIsBusy(true);
      await applyFreePlayPly(move, fenBeforeMove);
      // Sigurnosno - ako dispatch nije prosao, ne ostaje zaglavljena lazna pozicija.
      setFreePlayOptimisticFen(null);
    },
    [
      applyFreePlayPly,
      clearFeedback,
      currentChapter.displayFen,
      sendCoachMessage,
      step,
    ]
  );

  /** kind:'freePlay' - Pawny-jev potez, direktno iz Stockfish engine-a (vidi
   * PawnyEngine) - vec garantovano legalan, nema potrebe da se validira. */
  const onFreePlayBotMove = useCallback(
    async (uci: string) => {
      const fenBeforeMove = currentChapter.displayFen;
      const move = uciToMove(uci);
      setIsBusy(true);
      await applyFreePlayPly(
        {
          from: move.from,
          to: move.to,
          ...(move.promoteTo
            ? { promoteTo: move.promoteTo as ChessMove['promoteTo'] }
            : {}),
        },
        fenBeforeMove
      );
    },
    [applyFreePlayPly, currentChapter.displayFen]
  );

  /** kind:'freePlay' - Draw ponuda: Pawny je prijateljski bot za prvu
   * partiju, UVEK prihvata (nema smisla modelovati odbijanje ovde). Isti
   * zavrsni tok kao mat/pat - ishod se ne pominje u tekstu (Day 14 spec). */
  const onDrawOffer = useCallback(async () => {
    if (!step) return;
    await sendPawnyMessage("Sure, let's call it a draw.");
    stepDoneSoundRef.current?.play().catch(() => {});
    await sendCoachMessage(step.doneText);
    await enqueueMovexUpdate(() =>
      dispatch({
        type: 'loadedChapter:setDailyLesson',
        payload: withCounters({ progress: 1, popup: true, completed: true }),
      })
    );
  }, [dispatch, sendCoachMessage, sendPawnyMessage, step, withCounters]);

  /** kind:'freePlay' - Resign: odmah zavrsava partiju, isti zavrsni tekst
   * kao svaki drugi ishod (Day 14 namerno ne pominje ishod u tekstu). */
  const onResign = useCallback(async () => {
    if (!step) return;
    stepDoneSoundRef.current?.play().catch(() => {});
    await sendCoachMessage(step.doneText);
    await enqueueMovexUpdate(() =>
      dispatch({
        type: 'loadedChapter:setDailyLesson',
        payload: withCounters({ progress: 1, popup: true, completed: true }),
      })
    );
  }, [dispatch, sendCoachMessage, step, withCounters]);

  /** kind:'freePlay' - Take Back: vraca poslednja 2 poteza (korisnikov +
   * Pawny-jev odgovor), ODMAH - nema "pitaj protivnika" kao u pravom mecu,
   * Pawny je bot, ovo je solo vezba. Dugme je UVEK aktivno, i dok Pawny
   * "razmislja" (vidi FreePlayControls/disabled u WidgetPanel-u) - ako se
   * klikne tad, `takeBackVersion` ispod forsira remount PawnyEngine-a, pa
   * njegov stari "thinking" timeout (zakazan za vec zastarelu poziciju) biva
   * otkazan umesto da odigra potez na pogresnu, vec vracenu tablu. */
  const onTakeBack = useCallback(async () => {
    const history = currentChapter.notation.history;
    if (!history.length) return;
    const lastIndex = FreeBoardHistory.getLastIndexInHistory(history);
    const oneBack = FreeBoardHistory.decrementIndex(lastIndex);
    const twoBack = FreeBoardHistory.decrementIndex(oneBack);
    clearFeedback();
    await enqueueMovexUpdate(() =>
      dispatch({ type: 'loadedChapter:takeBack', payload: oneBack })
    );
    await enqueueMovexUpdate(() =>
      dispatch({ type: 'loadedChapter:takeBack', payload: twoBack })
    );
    freePlyCountRef.current = Math.max(0, freePlyCountRef.current - 2);
    setFreePlyCountState(freePlyCountRef.current);
    userMoveCountRef.current = Math.max(0, userMoveCountRef.current - 1);
    setTakeBackVersion((v) => v + 1);
  }, [clearFeedback, currentChapter.notation.history, dispatch]);

  const onMove = useCallback(
    async (move: ShortChessMove) => {
      // Premove sistem (useMoves.ts) pozива ovaj isti onMove DIREKTNO cim
      // isMyTurn postane true - to se desi cim protivnikov potez stigne kroz
      // Movex, sto je obicno BRZE od naseg sopstvenog `setIsBusy(false)`
      // (koji ceka i dodatnih enqueueMovexUpdate 150ms). Zato se ovde NE
      // oslanjamo na `isBusy` (bio bi jos true i odbio bi potez koji je u
      // stvari vec legalan) - samo na progressRef, koji je uvek tacan jer se
      // azurira sinhrono pre bilo kog await-a.
      // Korisnik je samo podigao figuru i vratio je na isto polje - nije
      // odigrao nista, ne racuna se kao pogresan potez (bez zvuka, bez
      // hint promene). Vazi za sve Daily Lesson korake.
      if (move.from === move.to) return;

      // kind:'freePlay' (Day 14) - prava partija, nema solution niza da se
      // poredi (ostaje []), pa ide u SOPSTVENU granu PRE donje provere koja
      // bi inace odmah izasla (solution.length je 0).
      if (step?.kind === 'freePlay') {
        await onFreePlayUserMove(move);
        return;
      }

      // Kviz korak - tabla je samo ambijent, nema sta da se odigra. MORA pre
      // donjeg "currentProgress >= solution.length" izlaza: "watch & learn"
      // koraci (bez quizOptions) vec imaju progress postavljen na kraj cim se
      // ucitaju (beginStep), pa bi taj izlaz inace tiho progutao potez bez
      // ikakve poruke. Tekst se razlikuje: ako ima pitanje, podseti da prvo
      // odgovori; ako je cist "watch & learn" primer, objasni da je to samo
      // primer i da se ide dalje na Got it.
      if (step?.kind === 'quiz') {
        setQuizBoardNudge(true);
        if (quizNudgeTimeoutRef.current)
          clearTimeout(quizNudgeTimeoutRef.current);
        quizNudgeTimeoutRef.current = setTimeout(
          () => setQuizBoardNudge(false),
          1200
        );
        await sendCoachMessage(
          step.quizOptions
            ? 'Solve the quiz above first — the board comes right after! 👆'
            : 'This is a static example — just look at the board and read the text, no need to play. Click Got it and let’s keep learning.'
        );
        return;
      }

      const currentProgress = progressRef.current;
      if (!step || currentProgress >= step.solution.length) return;

      // goalCondition (Day 9, "nadji mat/pat u jednom") - potez se ne poredi
      // sa fiksnim kvadratom, nego se STVARNO odigra kroz chess.js i proveri
      // da li REZULTUJUCA pozicija zadovoljava trazeni uslov. Prihvata svaki
      // legalan potez koji dovede do mata/pata, ne samo jedan unapred
      // zamisljen (npr. kod stalemate zadatka cesto postoji vise ispravnih
      // poteza).
      const isCorrect = step.goalCondition
        ? (() => {
            try {
              const chess = new Chess(currentChapter.displayFen);
              const played = chess.move({
                from: move.from,
                to: move.to,
                promotion: (move.promoteTo ?? 'q').toLowerCase() as
                  | 'q'
                  | 'r'
                  | 'b'
                  | 'n',
              });
              if (!played) return false;
              if (step.goalCondition === 'checkmate') return chess.isCheckmate();
              if (step.goalCondition === 'stalemate') return chess.isStalemate();
              // denyCastleKingside/denyCastleQueenside (Day 15) - potez je
              // vec odigran, red je na protivniku (chess.js sam to uradi),
              // pa se ovde proverava da li JOS uvek ima legalan O-O/O-O-O
              // medju njegovim trenutnim legalnim potezima.
              const opponentMoves = chess.moves();
              if (step.goalCondition === 'denyCastleKingside') {
                return !opponentMoves.includes('O-O');
              }
              if (step.goalCondition === 'denyCastleQueenside') {
                return !opponentMoves.includes('O-O-O');
              }
              return false;
            } catch {
              return false;
            }
          })()
        : step.unorderedTargets
          ? isValidUnorderedMove(currentChapter.displayFen, step, move)
          : movesMatch(
              step.solution[currentProgress] ?? '',
              move,
              step.requireExactPromotion
            ) ||
            (step.altMoves?.[currentProgress] ?? []).some((uci) =>
              movesMatch(uci, move, step.requireExactPromotion)
            );
      // Potez koji TEHNICKI zadovoljava goalCondition (npr. i jeste sah-mat)
      // ali je oznacen requireRetry (npr. Day 12 "nauci TACNO Kiss of Death",
      // ne bilo koji mat damom+kraljem) - ohrabrujuca poruka, potez se NE
      // primenjuje, korak ostaje otvoren dok ne odigra trazen potez.
      const playedUciEarly = `${move.from}${move.to}`;
      const nearMissAlt =
        isCorrect &&
        step.altSolutions?.find(
          (s) => s.uci === playedUciEarly && s.requireRetry
        );
      if (nearMissAlt) {
        await onNearMissMove(nearMissAlt);
        return;
      }

      if (!isCorrect) {
        await onWrongMove(move);
        return;
      }

      clearFeedback();
      // wrongPathPreview X (ako postoji) - gasi se cim je TACAN potez nadjen,
      // ne ranije (ostaje vidljiv kroz pogresne pokusaje - clearFeedback ga
      // namerno ne dira, vidi komentar uz xMarkSquares).
      setXMarkSquares(null);
      setIsBusy(true);
      moveSoundRef.current?.play().catch(() => {});

      // "Jump over" efekat (Knight, Primer 2) - ako neka figura stoji na
      // geometrijskom "poljacu" L-poteza, kratko zasvetli zlatno.
      if (step.jumpGlow) {
        const elbow = knightElbowSquare(move.from, move.to);
        if (elbow && pieceAt(currentChapter.displayFen, elbow)) {
          setGlowSquare(elbow);
          glowTimeoutRef.current = setTimeout(() => setGlowSquare(null), 700);
        }
      }

      // goalCondition korak moze imati VISE ispravnih poteza (npr. 4 razlicita
      // mata) - ako je odigran potez JEDAN od njih ali NIJE step.hintMove
      // (podrazumevani), njegovo sopstveno objasnjenje/highlight iz
      // altSolutions ima prednost, da tekst zaista opisuje odigran potez
      // (npr. ne kazemo "Qg7#!" ako je user odigrao Qa8#).
      const playedUci = `${move.from}${move.to}`;
      const altSolution = step.altSolutions?.find((s) => s.uci === playedUci);

      // Board highlight (goalCondition koraci, npr. Day 10 "nadji mat sam") -
      // posle TACNOG poteza, isti mehanizam kao posle kviz odgovora (Day 9).
      const goalHighlight =
        altSolution?.quizBoardHighlight ?? step.quizBoardHighlight;
      if (step.goalCondition && goalHighlight) {
        applyBoardHighlight(goalHighlight);
      }

      // "Reveal path" (History lekcija, "oznaci red/kolonu/dijagonalu") -
      // posle tacnog poteza, otkrij celu liniju kvadrat po kvadrat, isti
      // hintSquares mehanizam kao svuda drugde u lekciji.
      if (step.revealPath) {
        const path = computeLinePath(move.from, move.to);
        if (path) {
          let revealed: Square[] = [];
          path.forEach((sq, i) => {
            revealTimeoutsRef.current.push(
              setTimeout(() => {
                revealed = [...revealed, sq];
                setRevealSquares([...revealed]);
              }, i * 150)
            );
          });
        }
      }

      const moreUserMoves = hasMoreUserMoves(step, currentProgress);
      // U 'teach' koracima korisnik igra vise poteza zaredom, pa potez
      // vracamo njemu; u puzzle koracima na redu je protivnik.
      const forceTurn =
        step.kind === 'teach' && moreUserMoves ? step.orientation : undefined;

      const progressAfterUserMove = currentProgress + 1;
      // Odmah pomeramo lokalni napredak - sledeci potez ne sme da ceka Movex.
      progressRef.current = progressAfterUserMove;
      const lessonAfterUserMove: dailyLesson = withCounters({
        progress: progressAfterUserMove,
      });

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:addDailyLessonMove',
          payload: {
            move: {
              from: move.from,
              to: move.to,
              ...(move.promoteTo ? { promoteTo: move.promoteTo } : {}),
            },
            forceTurn,
            lesson: lessonAfterUserMove,
          },
        })
      );

      const replyUci = step.solution[progressAfterUserMove];

      // Poziciju posle korisnikovog poteza racunamo lokalno (ne cekamo
      // Movex) - treba i za ANY_LEGAL_REPLY protivnika ispod, i za
      // step.highlightRookRanks (top se ne pomera na crnom potezu, pa je ovo
      // i FINALNA pozicija topova za ovaj potez). promoteTo iz korisnikovog
      // izbora (ne uvek dama - Pawn lekcija nudi izbor figure), 'q' je samo
      // fallback ako potez uopste nije promocija.
      let fenAfterUserMove = currentChapter.displayFen;
      try {
        const chess = new Chess(currentChapter.displayFen);
        chess.move({
          from: move.from,
          to: move.to,
          promotion: (move.promoteTo ?? 'q').toLowerCase() as
            | 'q'
            | 'r'
            | 'b'
            | 'n',
        });
        fenAfterUserMove = chess.fen();
        // LessonStep.highlightRookRanks (Day 17) - CEO red svakog topa, boja
        // zavisi od toga da li BAS OVAJ potez daje sah (top koji je upravo
        // odigrao i daje sah = zelena, drugi top uvek zuta). Racuna se iz
        // `move.to` (gde je top upravo sleteo), ne iz solution indeksa - radi
        // identicno za kind:'teach' (Koraci 1-3) i kind:'puzzle' (glavna vezba).
        if (step.highlightRookRanks) {
          const givesCheck = chess.inCheck();
          const rookGroups = rookRankSquaresByRook(
            fenAfterUserMove,
            step.orientation
          );
          setRookRankSquares(
            rookGroups.flatMap(({ rookSquare, rankSquares }) => {
              const isMovedRook = rookSquare === move.to;
              const color =
                isMovedRook && givesCheck
                  ? ROOK_RANK_CHECK_COLOR
                  : ROOK_RANK_CUTOFF_COLOR;
              return rankSquares.map((sq) => ({
                square: sq as Square,
                color,
              }));
            })
          );
        }
      } catch {
        // ostaje pozicija pre poteza - resolveOpponentReply ce vratiti null
      }

      if (step.kind === 'puzzle' && replyUci) {
        progressRef.current = progressAfterUserMove + 1;
        await playOpponentReply(
          fenAfterUserMove,
          replyUci,
          withCounters({ progress: progressAfterUserMove + 1 })
        );
      }

      // Kontinuirana vodjena vezba sa VISE poteza u ISTOM koraku (npr. Day 13
      // London System walkthrough) - showSolutionArrowUpfront je nacrtala
      // strelicu samo za PRVI potez u beginStep; ovde se obnavlja za SVAKI
      // sledeci, cim prethodni (i njegov auto-odgovor, ako ga je bilo)
      // zavrse. Ako je korak time zavrsen, nema sledeceg poteza - ostaje bez
      // strelice (uskoro se cisti kroz clearFeedback na pocetku sledeceg
      // koraka svakako).
      if (
        step.showSolutionArrowUpfront &&
        progressRef.current < step.solution.length
      ) {
        const nextUci = step.solution[progressRef.current];
        if (nextUci) setHintArrowMap(buildSolutionArrow(nextUci));
      }

      // Pozicija je vec na svom mestu (korisnikov potez, i protivnikov ako ga
      // je bilo) - otkljucavamo tablu ODMAH, pre slanja poruka trenera.
      // Ranije se cekalo da sendCoachMessage/finishStep zavrse (svaki
      // enqueueMovexUpdate nosi svojih 150ms), pa je korisnik koji je vec
      // uhvatio sledecu figuru dobijao odbijen drop iako je protivnik vec
      // odigrao - potez je bio ispravan, samo je canPlay kasnio.
      setIsBusy(false);

      const finalProgress = progressRef.current;
      if (finalProgress >= step.solution.length) {
        stepDoneSoundRef.current?.play().catch(() => {});
        // Promocija u nedamu i dalje ispravno zavrsava korak, samo drugi ton
        // poruke (blago upozorenje umesto pune pohvale) - vidi nonQueenPromotionText.
        // promoteTo dolazi iz stvarnog UI dijaloga sa ispravnim velikim/malim
        // slovom po boji (npr. 'Q' za belog) - poredimo case-insensitive.
        const doneMessage =
          move.promoteTo &&
          move.promoteTo.toLowerCase() !== 'q' &&
          step.nonQueenPromotionText
            ? step.nonQueenPromotionText
            : (altSolution?.doneText ?? step.doneText);
        // Board highlight (npr. Day 12 "box" koji dama drzi oko kralja) -
        // ovde se prikazuje POSLE cele sekvence (ukljucujuci protivnikov
        // auto-odgovor), ne odmah posle korisnikovog poteza - za
        // goalCondition korake vec je primenjeno ranije (jednopotezni,
        // "posle" i "odmah" se poklapaju), ponovni poziv je bezopasan.
        if (step.quizBoardHighlight) {
          applyBoardHighlight(step.quizBoardHighlight);
        }
        await sendCoachMessage(doneMessage);
        // Druga poruka/highlight POSLE standardnog zavrsetka (npr. Day 17
        // Step 2 "roles-swap illustration" - strelice se precrtaju da
        // pokazu sledecu smenu uloga, uz prateci tekst). Vidi
        // transitionHighlight/transitionText.
        if (step.transitionHighlight) {
          applyBoardHighlight(step.transitionHighlight);
        }
        if (step.transitionText) {
          await sendCoachMessage(step.transitionText);
        }
        if (step.celebrate || isLastStep) {
          await enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:setDailyLesson',
              payload: withCounters({
                progress: step.solution.length,
                popup: true,
                completed: isLastStep,
              }),
            })
          );
        }
      } else if (
        step.moveExplanations?.[currentProgress] ||
        step.moveHighlights?.[currentProgress]
      ) {
        // Per-ply objasnjenje/highlight (npr. Day 17 "Two Rooks" - 5 razlicitih
        // belih poteza u ISTOM multi-move puzzle koraku, svaki sa sopstvenim
        // tekstom umesto ponovljenog successText) - uvek tacno kako je
        // napisano, bez variranja (isti princip kao successTextAlways).
        if (step.moveHighlights?.[currentProgress]) {
          applyBoardHighlight(step.moveHighlights[currentProgress]);
        }
        if (step.moveExplanations?.[currentProgress]) {
          await sendCoachMessage(step.moveExplanations[currentProgress]);
        }
      } else if (step.successText) {
        if (step.successTextAlways) {
          await sendCoachMessage(step.successText);
        } else {
          const lastContent =
            currentChapter.messages[currentChapter.messages.length - 1]
              ?.content;
          await sendCoachMessage(
            pickVariedMessage(step.successText, lastContent)
          );
        }
      }
    },
    [
      // isBusy/progress se namerno NE citaju iz zatvaranja unutar onMove -
      // premove sistem poziva ovaj isti onMove sa mogucim starim
      // zatvaranjem (react-chessboard zamrzava handleDragEnd na trenutak
      // hvatanja figure), pa se sve kriticno cita direktno iz progressRef.
      step,
      lessonState,
      onWrongMove,
      onNearMissMove,
      onFreePlayUserMove,
      clearFeedback,
      dispatch,
      currentChapter.displayFen,
      currentChapter.messages,
      playOpponentReply,
      sendCoachMessage,
      isLastStep,
      withCounters,
      applyBoardHighlight,
    ]
  );

  /**
   * Klikabilno dugme sa potezom u AI chat-u (step.suggestedMove, npr. Day 17
   * "Two Rooks" Koraci 1-3) - "igra" potez bez prevlacenja, kroz ISTI onMove
   * put kao rucno odigran potez (ista validacija/poruke/highlight), ne
   * posebna grana. uciToMove parsira UCI string u {from,to} par.
   */
  const onPlaySuggestedMove = useCallback(
    (uci: string) => onMove(uciToMove(uci) as ShortChessMove),
    [onMove]
  );

  /**
   * Kviz pitanje (kind:'quiz') - jedan pokusaj, ne trazi ponovni klik kao
   * potezi na tabli. Bira se dugme umesto pomeranja figure, pa ne prolazi
   * kroz onMove/movesMatch uopste - samo upisuje progress i posalje objasnjenje.
   */
  const onSelectQuizAnswer = useCallback(
    async (index: number) => {
      if (!step || step.kind !== 'quiz') return;
      // quizRetryOnWrong koraci (Day 15 "Yes/No") NE koriste progressRef kao
      // "vec odgovoreno" bravu - "Got it!" se otkljucuje i na netacan
      // odgovor (vidi nize), pa bi progressRef vec bio na kraju posle PRVOG
      // pokusaja, bez obzira na tacnost. Ponovni pokusaj se blokira samo kad
      // je VEC definitivno odgovoreno TACNO (quizAnsweredCorrectlyRef).
      if (step.quizRetryOnWrong) {
        if (quizAnsweredCorrectlyRef.current) return;
      } else if (progressRef.current >= step.solution.length) {
        return;
      }

      const isCorrect = index === step.quizCorrectIndex;
      (isCorrect ? stepDoneSoundRef : wrongMoveSoundRef).current
        ?.play()
        .catch(() => {});
      if (!isCorrect) {
        const stepIndex = stepIndexRef.current;
        setWrongQuizSteps((prev) => new Set(prev).add(stepIndex));
        // Netacan kviz odgovor racuna se u ukupan broj gresaka na kraju
        // lekcije (End Screen) - isti brojac kao pogresni potezi na tabli,
        // samo bez "pokusaj ponovo" (kviz je jedan pokusaj). Ako lekcija ima
        // scoreSummary (npr. Piece Values Phase 2 - "pravi" primeri posle
        // sredisnjeg popup-a), End Screen brojac gresaka prati TACNO te
        // korake, da se poklapa sa "X/Y correct" rezimeom umesto da meri
        // nepovezan recall kviz (Phase 1) koji nema sopstveni prikaz greske.
        const isScoreSummaryStep = lesson?.scoreSummary?.stepIds.includes(
          step.id
        );
        const countsTowardErrorFooter = lesson?.scoreSummary
          ? isScoreSummaryStep
          : true;
        if (countsTowardErrorFooter) {
          errorsRef.current += 1;
          totalErrorsRef.current += 1;
        }

        // Day 15 Position 6 "Yes/No" trik - netacan odgovor NE zatvara
        // pitanje (dugmad se vracaju u WidgetPanel-u, korisnik moze da proba
        // ponovo), ALI "Got it!" se ODMAH otkljucava i na netacan odgovor -
        // korisnik ne sme ostati zarobljen u petlji ako uporno bira pogresno,
        // mora moci da ide dalje kad god hoce, ne samo kad konacno pogodi.
        if (step.quizRetryOnWrong) {
          if (step.quizExplanationWrong) {
            await sendCoachMessage(step.quizExplanationWrong);
          }
          // NAMERNO ne diramo progressRef.current ovde (ostaje 0) - samo
          // reaktivni lessonState.progress ide na kraj, da isStepComplete
          // (i time "Got it!") postane true za UI, a da ponovni pokusaj
          // (gated preko quizAnsweredCorrectlyRef gore, ne preko progressRef)
          // ostane moguc.
          await enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:setDailyLesson',
              payload: withCounters({ progress: step.solution.length }),
            })
          );
          return;
        }
      } else if (step.quizRetryOnWrong) {
        quizAnsweredCorrectlyRef.current = true;
      }

      progressRef.current = step.solution.length;
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ progress: step.solution.length }),
        })
      );

      // Board highlight - UVEK se prikazuje posle odgovora, bez obzira na
      // tacnost, isti princip kao objasnjenje iznad.
      if (step.quizBoardHighlight) {
        applyBoardHighlight(step.quizBoardHighlight);
      }

      // Day 15 Position 6 - posle TACNOG "Yes" odgovora, tabla sama odigra
      // rokadu da pokaze da je stvarno legalna, PRE Coach-ove poruke.
      if (isCorrect && step.quizAutoPlayMove) {
        const autoMove = uciToMove(step.quizAutoPlayMove);
        moveSoundRef.current?.play().catch(() => {});
        await enqueueMovexUpdate(() =>
          dispatch({
            type: 'loadedChapter:addDailyLessonMove',
            payload: { move: { from: autoMove.from, to: autoMove.to } },
          })
        );
      }

      const explanation = isCorrect
        ? step.quizExplanation
        : (step.quizExplanationWrong ?? step.quizExplanation);
      if (explanation) {
        await sendCoachMessage(explanation);
      }

      if (step.celebrate || isLastStep) {
        await enqueueMovexUpdate(() =>
          dispatch({
            type: 'loadedChapter:setDailyLesson',
            payload: withCounters({
              progress: step.solution.length,
              popup: true,
              completed: isLastStep,
            }),
          })
        );
      }
    },
    [
      step,
      isLastStep,
      withCounters,
      dispatch,
      sendCoachMessage,
      lesson,
      applyBoardHighlight,
    ]
  );

  /**
   * Korisnik je kliknuo levim tasterom (ili drugacije) umesto desnim klikom
   * na kind:'markSquares' koraku - podseti ga u chatu kako se stvarno
   * obelezava polje. Throttle 4s da ne poplavi chat ako vise puta zaredom
   * pogresi gest.
   */
  const sendMarkSquaresNudge = useCallback(async () => {
    const now = Date.now();
    if (now - lastMarkNudgeAtRef.current < 4000) return;
    lastMarkNudgeAtRef.current = now;
    await sendCoachMessage(
      "To mark a square: right-click it with your mouse on desktop — or tap it if you're on mobile. Give that a try!"
    );
  }, [sendCoachMessage]);

  /**
   * kind:'markSquares' - desni klik (desktop) ili tap (mobilni) obelezava/
   * skida oznaku sa JEDNOG polja (squareRenderer ispod). Cim broj obelezenih
   * polja dostigne ocekivani broj, JEDAN pokusaj se odmah ocenjuje - isto
   * kao kviz pitanje (onSelectQuizAnswer): tacno ili netacno, korak je
   * GOTOV, board highlight + objasnjenje se UVEK prikazuju, pa se ide dalje
   * (ne ceka se ponovni pokusaj). Hint (vidi onHint) ostaje dostupan PRE
   * pokusaja, dok god korak nije gotov - pokazuje tacna polja da korisnik
   * ima trag pre nego sto "potrosi" svoj jedini pokusaj.
   */
  const finalizeMarkAttempt = useCallback(
    async (markedSet: Set<Square>) => {
      if (!step || step.kind !== 'markSquares') return;
      const expected = new Set(step.solution);
      const isCorrect =
        markedSet.size === expected.size &&
        Array.from(markedSet).every((sq) => expected.has(sq));
      (isCorrect ? stepDoneSoundRef : wrongMoveSoundRef).current
        ?.play()
        .catch(() => {});

      if (!isCorrect) {
        const stepIndex = stepIndexRef.current;
        setWrongQuizSteps((prev) => new Set(prev).add(stepIndex));
        const isScoreSummaryStep = lesson?.scoreSummary?.stepIds.includes(
          step.id
        );
        const countsTowardErrorFooter = lesson?.scoreSummary
          ? isScoreSummaryStep
          : true;
        if (countsTowardErrorFooter) {
          errorsRef.current += 1;
          totalErrorsRef.current += 1;
        }
      }

      progressRef.current = step.solution.length;
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ progress: step.solution.length }),
        })
      );

      // Board highlight UVEK - tacno ili netacno, korisnik mora da vidi gde
      // su prava polja pre nego sto predje dalje (isti princip kao kviz).
      if (step.quizBoardHighlight) {
        applyBoardHighlight(step.quizBoardHighlight);
      }

      const explanation = isCorrect
        ? step.doneText
        : (step.retryPromptText ?? step.doneText);
      if (explanation) {
        await sendCoachMessage(explanation);
      }
      if (step.transitionText) {
        await sendCoachMessage(step.transitionText);
      }
      if (step.celebrate || isLastStep) {
        await enqueueMovexUpdate(() =>
          dispatch({
            type: 'loadedChapter:setDailyLesson',
            payload: withCounters({
              progress: step.solution.length,
              popup: true,
              completed: isLastStep,
            }),
          })
        );
      }
    },
    [
      step,
      isLastStep,
      lesson,
      dispatch,
      withCounters,
      sendCoachMessage,
      applyBoardHighlight,
    ]
  );

  const onToggleMarkSquare = useCallback(
    async (square: Square) => {
      if (!step || step.kind !== 'markSquares') return;
      if (isBusy || isStepComplete) return;

      const already = markedSquares.has(square);
      // Ne dozvoljava da predje preko ocekivanog broja polja - kad ih je vec
      // tacno onoliko koliko resenje trazi, svaki DODATNI klik se ignorise
      // (skidanje postojece oznake i dalje uvek radi, da korisnik moze da
      // ispravi pogresan izbor pre nego sto ponovo dostigne taj broj).
      if (!already && markedSquares.size >= step.solution.length) return;

      const next = new Set(markedSquares);
      if (already) next.delete(square);
      else next.add(square);
      setMarkedSquares(next);

      if (next.size === step.solution.length) {
        await finalizeMarkAttempt(next);
      }
    },
    [step, isBusy, isStepComplete, markedSquares, finalizeMarkAttempt]
  );

  const onHint = useCallback(async () => {
    if (!step || isStepComplete) return;

    // kind:'freePlay' - za Day 14/18 "hint" nema smisla (nema skriptovano
    // resenje da se otkrije), dugme je sakriveno u UI-u. LessonStep.liveHint
    // (Day 20 "Deliver Mate" Phase 2) je SUPROTNO - nema fiksnog "sledeceg
    // poteza" da se unapred napise (slobodno matiranje), pa Hint ovde pita
    // Stockfish za predlog ZA TRENUTNU poziciju, pa AI model (uzivo, vidi
    // SendHintExplanation.ts) za kratko objasnjenje tog KONKRETNOG poteza -
    // NIJE ogranicen MAX_HINTS_PER_STEP brojacem (dostupan neograniceno).
    if (step.kind === 'freePlay') {
      if (!step.liveHint || liveHintLoading) return;
      setLiveHintLoading(true);
      try {
        // step.hintTechnique (Day 20 Phase 2 - 'queenBoxMethod') racuna
        // potez PO FIKSNOJ TEHNICI (engine-ov najbolji potez, ali OGRANICEN
        // na damu dok kralj ima vise od jednog bekstva, pa na kralja - vidi
        // checkmateTechnique.ts), ne sirov neogranicen Stockfish predlog. Bez
        // tehnike, padni nazad na cist predlog (requestBestMoveUci) - buduce
        // liveHint lekcije koje jos nemaju sopstvenu tehniku.
        const technique =
          step.hintTechnique === 'queenBoxMethod'
            ? await pickBoxMethodHint(
                currentChapter.displayFen,
                step.orientation,
                lastHintQueenSquareRef.current
              )
            : null;
        // Zapamti damino polje SAMO ako je OVAJ predlog bio box-fazni damin
        // potez (approach/mate ga ne diraju - te faze ionako ne pozivaju
        // safeQueenMoves, nema potrebe da se nulira ili prepravlja ovde).
        if (technique?.phase === 'box') {
          lastHintQueenSquareRef.current = technique.uci.slice(2, 4);
        }
        const bestUci =
          technique?.uci ?? (await requestBestMoveUci(currentChapter.displayFen));
        if (!bestUci) {
          await sendCoachMessage(
            "Couldn't reach the engine just now. Try Hint again in a moment."
          );
          return;
        }
        const { from, to } = uciToMove(bestUci);
        setHintPieceSquare(from);
        setHintArrowMap(buildSolutionArrow(bestUci));
        // SAN (npr. "Qb6+") za prikaz AI modelu i za fallback poruku ako
        // live poziv ne uspe - citljivije od sirovog UCI-ja.
        let san = technique?.san ?? `${from}${to}`;
        if (!technique) {
          try {
            const sanChess = new Chess(currentChapter.displayFen);
            const promo = bestUci.length >= 5 ? bestUci[4] : undefined;
            const played = sanChess.move({ from, to, promotion: promo });
            if (played) san = played.san;
          } catch {
            // ostaje UCI string kao fallback prikaz
          }
        }
        const phase = technique?.phase ?? 'mate';
        const data = await SendHintExplanation(
          currentChapter.displayFen,
          san,
          phase,
          currentChapter
        );
        const phaseFallback: Record<typeof phase, string> = {
          box: `Try ${san}. It boxes the king in further before your own king comes up.`,
          approach: `Try ${san}. The king's boxed in now - bring your own king up to help.`,
          mate: `Try ${san}. That's checkmate.`,
        };
        if (data === 'ai_daily_limit_reached') {
          await sendCoachMessage(
            `${phaseFallback[phase]} I'm out of live explanations for today.`
          );
          return;
        }
        const answerText =
          typeof data?.answer === 'string' ? data.answer : data?.answer?.text;
        await sendCoachMessage(answerText || phaseFallback[phase]);
      } finally {
        setLiveHintLoading(false);
      }
      return;
    }

    // Kviz koraci (Checkmate/Stalemate/Neither i slicno) nemaju nikakvu
    // figuru ili potez na tabli - hint je tu samo JEDAN tekstualni trag, bez
    // dvostepenog sistema (nema sta drugo da se oznaci).
    if (step.kind === 'quiz') {
      if (!step.extraHintText || hintsRef.current >= 1) return;
      hintsRef.current = 1;
      totalHintsRef.current += 1;
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ progress: progressRef.current }),
        })
      );
      await sendCoachMessage(step.extraHintText);
      return;
    }

    // kind:'markSquares' - Hint PRVO podseti na PRAVILO (kako se uopste
    // obelezava polje - za slucaj da je to sam izvor zabune), pa tek onda
    // POKAZUJE tacna polja (quizBoardHighlight) + kratko objasnjenje. NE
    // zavrsava korak i NE dira korisnikove vec postavljene oznake -
    // korisnik i dalje sam klikce da ih stvarno obelezi.
    if (step.kind === 'markSquares') {
      if (hintsRef.current >= 1) return;
      hintsRef.current = 1;
      totalHintsRef.current += 1;
      await sendCoachMessage(
        "To mark a square: right-click it with your mouse on desktop — or tap it if you're on mobile."
      );
      if (step.quizBoardHighlight) {
        applyBoardHighlight(step.quizBoardHighlight);
      }
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ progress: progressRef.current }),
        })
      );
      if (step.extraHintText) {
        await sendCoachMessage(step.extraHintText);
      }
      return;
    }

    if (hintsRef.current >= MAX_HINTS_PER_STEP) {
      await sendCoachMessage(
        "You've used both hints — look at the board, you'll spot the move."
      );
      return;
    }
    // "goal-based" puzzle korak (npr. "nadji mat/pat u jednom", Day 9) nema
    // fiksno resenje u solution (ono je placeholder ['goal']) - Hint cita
    // `hintMove`, posebno zadat JEDAN tacan potez za prikaz. Sama validacija
    // (onMove) i dalje prihvata bilo koji potez koji zadovolji goalCondition,
    // ne samo ovaj - hintMove postoji cisto da Hint dugme ovde radi na ISTI
    // nacin (1. klik figura, 2./poslednji klik strelica) kao svuda drugde,
    // da korisnik uvek zna sta da ocekuje. unorderedTargets korak nema
    // fiksan "sledeci potez" po indeksu - bira se prva preostala meta koja
    // je trenutno stvarno legalna sa pozicije figure.
    const nextMove = step.goalCondition
      ? step.hintMove
        ? uciToMove(step.hintMove)
        : null
      : step.unorderedTargets
        ? resolveNextUnorderedTarget(currentChapter.displayFen, step)
        : (() => {
            const uci = step.solution[progress];
            return uci ? uciToMove(uci) : null;
          })();
    if (!nextMove) return;

    // 1. hint - samo oznaci figuru koja igra. 2. (poslednji) hint - dodaje i
    // strelicu do mete. Nijedan hint se ne gasi sam po sebi (nema tajmera) -
    // ostaje na tabli dok korisnik ne odigra sledeci potez. Vazi za ceo
    // Daily Lesson, ne samo poslednji hint.
    const isFinalHint = hintsRef.current + 1 >= MAX_HINTS_PER_STEP;
    const { from, to } = nextMove;

    clearFeedback();
    setHintPieceSquare(from);
    // Day 15 Part 2 - Hint namerno NIKAD ne otkriva resenje preko strelice
    // (hintNeverRevealsArrow), ostaje cisto tekstualan trag cak i na
    // poslednjem kliku - vidi wrongMoveHighlight za vizuelni trag posle
    // stvarno pogresnog poteza.
    if (isFinalHint && !step.hintNeverRevealsArrow) {
      setHintArrowMap(buildSolutionArrow(`${from}${to}`));
    }

    // Lokalno odmah - da brzi drugi klik ne vidi isti stari broj (vidi
    // komentar uz hintsRef).
    const nextHints = hintsRef.current + 1;
    const nextTotalHints = totalHintsRef.current + 1;
    hintsRef.current = nextHints;
    totalHintsRef.current = nextTotalHints;

    await enqueueMovexUpdate(() =>
      dispatch({
        type: 'loadedChapter:setDailyLesson',
        payload: withCounters({ progress: progressRef.current }),
      })
    );
    // Korak moze imati sopstveni, konkretniji hint tekst (step.extraHintText,
    // npr. Day 16 "Secret hint" po puzzli) umesto generickog variranog - radi
    // za bilo koji puzzle/teach korak, ne samo goalCondition (Day 9/15). Pada
    // nazad na generican ako nije zadat.
    if (step.extraHintText) {
      await sendCoachMessage(step.extraHintText);
    } else {
      const lastContent =
        currentChapter.messages[currentChapter.messages.length - 1]?.content;
      await sendCoachMessage(pickHintHelpMessage(lastContent));
    }
  }, [
    step,
    isStepComplete,
    progress,
    lessonState,
    clearFeedback,
    dispatch,
    sendCoachMessage,
    currentChapter,
    currentChapter.displayFen,
    currentChapter.messages,
    withCounters,
    applyBoardHighlight,
    liveHintLoading,
  ]);

  /** Repeat uvek vraca celu lekciju na prvi korak, ne samo tekuci. */
  const onRepeatLesson = useCallback(() => {
    setWrongQuizSteps(new Set());
    return loadStep(0, {
      errors: 0,
      hints: 0,
      totalErrors: 0,
      totalHints: 0,
      completed: false,
    });
  }, [loadStep]);

  const onNextStep = useCallback(() => {
    if (isLastStep) return;
    // Hintovi i greske su po koraku (svaki FEN nosi svoja 2 hinta), ne
    // kumulativni za celu lekciju - moraju se resetovati na svaki novi korak.
    return loadStep(stepIndexRef.current + 1, { errors: 0, hints: 0 });
  }, [isLastStep, loadStep]);

  const onDismissCelebration = useCallback(
    () =>
      enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ popup: false }),
        })
      ),
    [dispatch, withCounters]
  );

  /** Sledeca lekcija u nizu (npr. Rook -> Bishop) - null ako je ovo poslednja za sad. */
  const nextLessonId = lesson ? getNextLessonId(lesson.id) : null;
  const onNextLesson = useCallback(() => {
    if (!nextLessonId) return;
    const params = new URLSearchParams(window.location.search);
    params.delete('pgn'); // staro pogresno ime parametra (zamenjeno sa lessonId)
    params.set('activity', 'dailylesson');
    params.set('lessonId', nextLessonId);
    window.location.href = `/room/new?${params.toString()}`;
  }, [nextLessonId]);

  /**
   * endScreenButtons action:'review' (Day 14 "Your First Game") - otvara
   * postojecu Game Review aktivnost u NOVOJ sobi, sa PGN-om ove partije.
   * `startingPgn` je NOVI, odvojen query parametar (ReviewActivity.tsx) -
   * postojeci `?pgn=` tamo je zapravo matchId za lookup u pravom Match-u
   * (endedGames), partija protiv Pawny-ja nema takav zapis, pa se ide
   * direktno sa gotovim PGN tekstom, bez mrezhog poziva.
   */
  const onGameReview = useCallback(() => {
    const history = currentChapter.notation.history;
    if (!history.length) return;
    const linear = FreeBoardHistory.calculateLinearHistoryToIndex(
      history,
      FreeBoardHistory.getLastIndexInHistory(history)
    );
    const parts: string[] = [];
    for (let i = 0; i < linear.length; i += 2) {
      const white = linear[i];
      const black = linear[i + 1];
      parts.push(`${i / 2 + 1}.`);
      if (white && !white.isNonMove) parts.push(white.san);
      if (black && !black.isNonMove) parts.push(black.san);
    }
    const pgn = parts.join(' ');
    if (!pgn) return;

    const roomId = getRandomStr();
    const params = new URLSearchParams();
    params.set('activity', 'review');
    params.set('startingPgn', pgn);
    params.set('opponentName', 'Pawny');
    if (userData.user_id) params.set('userId', userData.user_id);
    const theme = new URLSearchParams(window.location.search).get('theme');
    if (theme) params.set('theme', theme);
    window.location.href = `/room/a/review/${roomId}?${params.toString()}`;
  }, [currentChapter.notation.history, userData.user_id]);

  const boardArrows = useMemo(
    () =>
      hintArrowMap || quizHighlightArrows
        ? ({
            ...currentChapter.arrowsMap,
            ...hintArrowMap,
            ...quizHighlightArrows,
          } as ArrowsMap)
        : currentChapter.arrowsMap,
    [currentChapter.arrowsMap, hintArrowMap, quizHighlightArrows]
  );

  // Kviz pitanje (kind:'quiz') nema potez na tabli - tabla je samo ambijent
  // (standardna pocetna pozicija). canPlay NAMERNO ostaje true (umesto da se
  // blokira ovde) da bi potez stigao do onMove, gde se korisniku eksplicitno
  // kaze da prvo resi kviz - tiha odbijena vuca figure bez objasnjenja je
  // konfuznija nego jasna poruka + zatamnjena tabla. OVO VAZI I ZA "watch &
  // learn" kviz korake (bez quizOptions) - njima je progress (pa time i
  // isStepComplete) vec TRUE odmah na ucitavanju koraka (beginStep), pa bi
  // bez ovog izuzetka isStepComplete sam vratio canPlay na false pre nego
  // sto korisnik uopste pokusa potez - komentar iznad je opisivao nameru,
  // ali `!isStepComplete` je bio bezuslovan, pa namera nikad nije radila za
  // bas te korake (otud tiha, bez-poruke odbijena vuca figure).
  // freePlay - kao Match: ko je na potezu odredjuje turn (premove dok Pawny razmislja), ne isBusy.
  const canPlay =
    !showIntro &&
    !preStepIntro &&
    (step?.kind === 'quiz' || !isStepComplete) &&
    (step?.kind === 'freePlay' || !isBusy);

  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <div>
          <DailyLessonDialogContainer
            lesson={lesson}
            step={step}
            lessonState={lessonState}
            showIntro={showIntro}
            onStartLesson={async () => {
              setShowIntro(false);
              if (step) await beginStep(step);
            }}
            onDismissCelebration={onDismissCelebration}
            onRepeatLesson={onRepeatLesson}
            onNextStep={onNextStep}
            isLastStep={isLastStep}
            onNextLesson={nextLessonId ? onNextLesson : undefined}
            onGameReview={onGameReview}
            preStepIntro={preStepIntro}
            onDismissPreStepIntro={onDismissPreStepIntro}
            wrongQuizSteps={wrongQuizSteps}
          />

          {/* Day 14 "Your First Game" - Pawny (Stockfish, namerno slab)
              odigrava crnog kad je na potezu, samo za kind:'freePlay'. Bez
              UI-a, samo efekat. LessonStep.strongOpponent (Day 20 "Deliver
              Mate" Phase 2) prebacuje na MateDefenseEngine - PUNA snaga, ista
              key/active logika, samo drugi komponent. */}
          {step?.kind === 'freePlay' && !step.strongOpponent && (
            <PawnyEngine
              // Key SAMO na Take Back verziju (NE na svaki potez - vidi
              // komentar uz takeBackVersion gore, bio je realan bug) -
              // garantuje svez unutrasnji "lastRepliedFen" posle Take Back-a
              // (inace bi, ako korisnik vrati pa odigra IDENTICAN potez,
              // stari fen poklopio i Pawny nikad ne bi odgovorio drugi put).
              key={takeBackVersion}
              fen={currentChapter.displayFen}
              active={
                !lessonState.completed &&
                !showIntro &&
                !preStepIntro &&
                (currentChapter.displayFen.split(' ')[1] as 'w' | 'b') !==
                  step.orientation
              }
              onMove={onFreePlayBotMove}
              randomMoveChance={step.pawnyRandomMoveChance}
            />
          )}
          {step?.kind === 'freePlay' && step.strongOpponent && (
            <MateDefenseEngine
              key={takeBackVersion}
              fen={currentChapter.displayFen}
              active={
                !lessonState.completed &&
                !showIntro &&
                !preStepIntro &&
                (currentChapter.displayFen.split(' ')[1] as 'w' | 'b') !==
                  step.orientation
              }
              onMove={onFreePlayBotMove}
            />
          )}

          <div className="relative">
          <DailyLessonBoard
            // Forsira remount table na SVAKI prelazak koraka, cak i kad dva
            // uzastopna koraka dele IDENTICAN FEN (npr. Day 11 A1/A2 obe
            // pocetna pozicija, ili prazna tabla kod B1/B2) - biblioteka
            // (react-chessboard) sama brise korisnikove strelice/krugove na
            // promenu FEN-a i na levi klik, ALI samo kad FEN string STVARNO
            // drugacije izgleda od proslog; kad se poklopi, njena interna
            // "crtana" strelica ostaje da visi preko nove pozicije. Key vezan
            // za stepIndexRef (lokalan, trenutan - ne ceka Movex) ovo resava
            // generalno, ne samo za slucajeve istog FEN-a.
            key={`${lessonState.lessonId}:${stepIndexRef.current}`}
            sizePx={boardSize}
            displayFen={freePlayOptimisticFen ?? currentChapter.displayFen}
            orientation={currentChapter.orientation}
            circlesMap={currentChapter.circlesMap}
            notation={currentChapter.notation}
            arrowsMap={boardArrows}
            hintFromSquare={
              (wrongMoveHint?.from ?? hintPieceSquare ?? undefined) as
                | Square
                | undefined
            }
            glowSquare={glowSquare ?? undefined}
            canPlay={canPlay}
            // freePlay (Day 14/18) MORA da ima premove kao i Match (korisnik
            // povuce figuru dok Pawny "razmislja", potez se "opali" sam cim
            // dodje red na njega - standardno sahovsko ponasanje). Ranije je
            // ovde bilo iskljuceno jer je premove osumnjicen za "dupliran"
            // potez - stvarni uzrok je bio drugde (vidi lastUserMoveRef,
            // 500ms debounce na identican (from,to) u onFreePlayUserMove),
            // koji ostaje kao zastita bez obzira na premove.
            allowPremoves={true}
            // Gasi klizecu animaciju prelaza figure na drop za freePlay -
            // bez nje nema "preklapanja" izmedju drag-ove optimisticne
            // pozicije i stvarne FEN pozicije koja stize sa malim zakasnjenjem.
            disableAnimations={step?.kind === 'freePlay'}
            // kind:'quiz' ("Got it!" primeri, sa ili bez pitanja) - tabla je
            // cist ambijent, nema koncept "moje/protivnikove figure". Bez
            // ovoga, vucenje CRNE (ili bilo koje "tudje") figure bi i dalje
            // bilo tiho odbijeno pre nego sto stigne do onMove, i korisnik
            // nikad ne bi video "ovo je statican primer" objasnjenje.
            anyPieceDraggable={step?.kind === 'quiz'}
            squareRenderer={({ square, children }) => {
              // kind:'markSquares' - desni klik (desktop) ili tap (mobilni)
              // obelezava/skida oznaku sa JEDNOG polja. Potpuno nezavisno od
              // drag-figuru mehanizma (prazna tabla, nema sta da se vuce).
              if (step?.kind === 'markSquares') {
                // Hint (quizHighlightSquares) - isti okvir kao svuda drugde
                // (boxShadow inset, vidi quizMark ispod), NE tackica - Hint
                // samo POKAZUJE, ne "obelezava". Korisnikov sopstveni klik
                // (markedSquares) ostaje tackica - to je NJEGOVA oznaka.
                const hintMark = quizHighlightSquares?.find(
                  (m) => m.square === square
                );
                const isMarked = markedSquares.has(square as Square);
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      ...(hintMark
                        ? { boxShadow: `inset 0 0 0 3px ${hintMark.color}` }
                        : {}),
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onToggleMarkSquare(square as Square);
                    }}
                    onClick={(e) => {
                      // Levi klik nije ispravan gest ovde - podseti umesto
                      // da ga cisto ignorises.
                      e.stopPropagation();
                      sendMarkSquaresNudge();
                    }}
                    onTouchEnd={(e) => {
                      // Tap na mobilnom - isti efekat kao desni klik na
                      // desktopu, bez potrebe za drzanjem.
                      e.preventDefault();
                      onToggleMarkSquare(square as Square);
                    }}
                  >
                    {children}
                    {isMarked && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <div
                          style={{
                            width: '26%',
                            height: '26%',
                            borderRadius: '9999px',
                            background: MARK_SELECT_COLOR,
                            boxShadow: `0 0 6px 2px ${MARK_SELECT_COLOR}88`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              }

              if (wrongSquare === square) {
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {children}
                    <svg
                      viewBox="0 0 100 100"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                      }}
                    >
                      <line
                        x1="18"
                        y1="18"
                        x2="82"
                        y2="82"
                        stroke="#f2358d"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      <line
                        x1="82"
                        y1="18"
                        x2="18"
                        y2="82"
                        stroke="#f2358d"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                );
              }

              // LessonStep.wrongPathPreview (Day 17 Step 3) - isti X kao
              // iznad, samo TRAJAN (ne vezan za wrongSquare, koji se gasi
              // posle 700ms) - ostaje na tabli kroz ceo korak.
              if (xMarkSquares?.includes(square as Square)) {
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {children}
                    <svg
                      viewBox="0 0 100 100"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                      }}
                    >
                      <line
                        x1="18"
                        y1="18"
                        x2="82"
                        y2="82"
                        stroke="#f2358d"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                      <line
                        x1="82"
                        y1="18"
                        x2="18"
                        y2="82"
                        stroke="#f2358d"
                        strokeWidth="14"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                );
              }

              // Kruzic za "ovde top moze da ode" ide PREKO figure (ne kao
              // pozadina polja) - inace se ne vidi kad je meta polje zauzeto
              // pesakom koji treba pojesti.
              if (wrongMoveHint?.targets?.includes(square as Square)) {
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {children}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '26%',
                          height: '26%',
                          borderRadius: '9999px',
                          background: 'rgba(7,218,99,0.85)',
                          boxShadow: '0 0 6px 2px rgba(7,218,99,0.55)',
                        }}
                      />
                    </div>
                  </div>
                );
              }

              // "Reveal path" (History lekcija) - ista tackica kao gore, samo
              // drugi izvor polja (cela otkrivena linija, ne "gde figura sme").
              if (revealSquares?.includes(square as Square)) {
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    {children}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '26%',
                          height: '26%',
                          borderRadius: '9999px',
                          background: 'rgba(7,218,99,0.85)',
                          boxShadow: '0 0 6px 2px rgba(7,218,99,0.55)',
                        }}
                      />
                    </div>
                  </div>
                );
              }

              // Kviz board highlight (Day 9+) - boja dolazi po polju iz
              // step.quizBoardHighlight (napad/blokirano/odbrana imaju
              // razlicito znacenje istovremeno). Isti vizuelni jezik kao
              // postojeci hint-na-figuru okvir (useCustomStyles.ts
              // hintFromStyles) - inset box-shadow preko CELOG polja, ne
              // skupljena unutrasnja kutija.
              const quizMark = quizHighlightSquares?.find(
                (m) => m.square === square
              );
              if (quizMark) {
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      boxShadow: `inset 0 0 0 3px ${quizMark.color}`,
                    }}
                  >
                    {children}
                  </div>
                );
              }

              // LessonStep.highlightRookRanks (Day 17) - CEO red topa, FILL
              // preko celog polja (ne okvir kao quizMark iznad) - isti
              // vizuelni jezik kao app-ovo sopstveno "last move" oznacavanje
              // (translucentno, figure ispod ostaju vidljive).
              const rookRankMark = rookRankSquares?.find(
                (m) => m.square === square
              );
              if (rookRankMark) {
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      background: rookRankMark.color,
                    }}
                  >
                    {children}
                  </div>
                );
              }

              return null as unknown as React.JSX.Element;
            }}
            onMove={onMove}
            onArrowsChange={noop}
            onCircleDraw={async (tuple) => {
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:drawCircle', payload: tuple })
              );
            }}
            onClearCircles={async () => {
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:clearCircles' })
              );
            }}
            rightSideClassName="flex-1"
            rightSideComponent={
              <>
                <div className="relative flex flex-1 flex-col items-center justify-center">
                  <PanelResizeHandle
                    className="w-1 h-20 rounded-lg bg-slate-600"
                    title="Resize"
                  />
                </div>
                <div className="flex-1" />
              </>
            }
          />
          {step?.kind === 'quiz' && step.quizDimBoard && (
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-300 bg-black ${
                quizBoardNudge ? 'opacity-60' : 'opacity-30'
              }`}
            />
          )}
          </div>
        </div>
      )}
      rightComponent={
        <div className="flex flex-col gap-2 h-[360px] md:h-full w-full flex-1 md:min-h-0 pb-4 md:pb-0">
          {lesson && (
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              Day {lesson.day} · {lesson.title}
            </p>
          )}
          {/* kind:'freePlay' (Day 14) - prava partija, "1/1" segment nema
              smisla, pa traka ovde izostaje u potpunosti. */}
          {step?.kind !== 'freePlay' && (
            <LessonProgressBar
              total={segments.total}
              current={segments.current}
              completed={segments.completed}
              currentFraction={segments.currentFraction}
              celebrateStepDone={nextReady}
              wrongSegments={wrongQuizSteps}
            />
          )}
          <WidgetPanel
            userData={userData}
            currentChapterState={currentChapter}
            lesson={lesson}
            step={step}
            lessonState={lessonState}
            isStepComplete={isStepComplete}
            isLastStep={isLastStep}
            isBusy={isBusy}
            nextReady={nextReady}
            isInstructor={settings.isInstructor}
            onHint={onHint}
            liveHintLoading={liveHintLoading}
            onRepeatLesson={onRepeatLesson}
            onNextStep={onNextStep}
            onSelectQuizAnswer={onSelectQuizAnswer}
            onPlaySuggestedMove={onPlaySuggestedMove}
            onDrawOffer={onDrawOffer}
            onTakeBack={onTakeBack}
            onResign={onResign}
            canTakeBack={freePlyCountState >= 2}
            onMessage={async (payload) =>
              await enqueueMovexUpdate(() =>
                dispatch({ type: 'loadedChapter:writeMessage', payload })
              )
            }
            onHistoryNotationRefocus={async (payload) => {
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:focusHistoryIndex',
                  payload,
                })
              );
            }}
          />
        </div>
      }
    />
  );
};
