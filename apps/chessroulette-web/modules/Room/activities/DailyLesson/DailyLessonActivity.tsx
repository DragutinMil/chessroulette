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
  shuffleFrom,
} from './util';
import { DailyLessonDialogContainer } from './DialogContainer/DailyLessonDialogContainer';
import {
  DailyLessonActivityState,
  dailyLesson,
  findLoadedChapter,
  initialDefaultChapter,
} from './movex';
import {
  ANY_LEGAL_CHECK,
  ANY_LEGAL_REPLY,
  findLesson,
  getNextLessonId,
  LessonStep,
  MAX_HINTS_PER_STEP,
} from './lessonDatabase';
import {
  buildCrosshairArrows,
  buildSolutionArrow,
  computeLinePath,
  findSafeCheckMove,
  hasMoreUserMoves,
  isSafeCheckMove,
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
import { NotationConvergeAnimation } from './components/NotationConvergeAnimation';
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
    { square: Square; color: string; fill?: boolean; dot?: boolean }[] | null
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
          squares.map((s) => ({
            square: s.square as Square,
            color: s.color,
            fill: s.fill,
            dot: s.dot,
          }))
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
  // Day 27 "Chess Notation" - polje koje je korisnik POGRESNO obelezio
  // (markSquares desni klik) ILI pogresno izabrao (kviz tekstualna opcija
  // ciji naziv je polje, vidi onSelectQuizAnswer), ostaje vidljivo (plavi
  // okvir + crvena tackica, vidi squareRenderer) - korisnica eksplicitno
  // trazila da se NJENA greska jasno vidi, umesto strelica duz reda/kolone.
  // Cisti se na sledeci klik/pokusaj i na ucitavanje sledeceg koraka
  // (clearFeedback).
  const [wrongMarkedSquare, setWrongMarkedSquare] = useState<Square | null>(
    null
  );
  // LessonStep.revealSquareAnimation (Day 27 "Chess Notation") - slovo+broj
  // "spajanje" animacija (vidi NotationConvergeAnimation.tsx), okida se posle
  // SVAKOG odgovora (tacnog ili netacnog). `nonce` forsira remount (restart
  // CSS tranzicija) i kad se ISTO polje otkrije dva puta zaredom. `pieceLetter`
  // (Part C "napisi potez") - slovo figure (npr. 'N'), dodaje se ISPRED u
  // istom redosledu kojim se notacija pise (vidi onSelectQuizAnswer).
  const [revealAnimation, setRevealAnimation] = useState<{
    square: Square;
    pieceLetter?: string;
    nonce: number;
  } | null>(null);
  const revealAnimationNonceRef = useRef(0);
  const triggerRevealAnimation = useCallback(
    (square: string, pieceLetter?: string) => {
      revealAnimationNonceRef.current += 1;
      setRevealAnimation({
        square: square as Square,
        pieceLetter,
        nonce: revealAnimationNonceRef.current,
      });
    },
    []
  );
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
  // LessonStep.anyLegalMoveStreak/exactMoveUci/raceSolution (Day 30
  // "Graduation Checkpoint 1" Part A) - sopstveni, odvojen set refova, NE
  // deli progressRef/errorsRef semantiku standardnog teach/puzzle koraka
  // (resenje je ovde samo placeholder duzine, ne stvarna lista poteza).
  // Sve se resetuje na pocetku svakog ovakvog koraka (vidi beginStep).
  const drillStreakRef = useRef(0); // ukupno LEGALNIH poteza (anyLegalMoveStreak) - greska NE resetuje ovo, samo kosta poene
  const drillStepScoreRef = useRef(1); // frakcioni skor OVOG koraka, 1.0 start, floor 0.25
  const drillMovesPlayedRef = useRef(0); // ukupno odigranih poteza (raceSolution - za "extra moves" penal)
  const drillCurrentSquareRef = useRef<string | null>(null); // gde se figura koja se testira TRENUTNO nalazi
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

  /**
   * Lesson.shuffleStepsFrom (Day 22 "Material") - koraci od tog indeksa se
   * nasumicno premestaju JEDNOM po "pokretanju" lekcije (prvi load ILI
   * Repeat - vidi onRepeatLesson ispod, koji ovaj ref eksplicitno cisti pre
   * loadStep(0)), ne na svaki render. `lesson.steps` sam (bez
   * shuffleStepsFrom) se nikad ne kopira/menja - ostali 21+ lekcija
   * nepromenjeni. Kljuc je lessonId - promena lekcije automatski re-roll-uje.
   */
  const shuffledStepsRef = useRef<{
    lessonId: string;
    steps: LessonStep[];
  } | null>(null);
  if (lesson && shuffledStepsRef.current?.lessonId !== lesson.id) {
    shuffledStepsRef.current = {
      lessonId: lesson.id,
      steps: shuffleFrom(lesson.steps, lesson.shuffleStepsFrom),
    };
  }
  const steps = shuffledStepsRef.current?.steps ?? lesson?.steps ?? [];

  // Indeks "koji po redu BROJIVI korak" je dati sirovi stepIndex - isti
  // princip kao `countableBefore` u segments ispod (LessonStep.
  // excludeFromProgress preskace kratke prelazne poruke, npr. Day 27 intro).
  // Koristi se za wrongQuizSteps/LessonProgressBar.wrongSegments - taj Set
  // mora da nosi istu "brojivu" indeksaciju kao segmenti trake, inace greska
  // na PRVOM pitanju oboji DRUGI segment (prijavljen bag - excludeFromProgress
  // korak ispred pomera sirov niz-indeks za 1 u odnosu na trakin indeks).
  const countableIndexOf = useCallback(
    (rawIndex: number) =>
      steps.slice(0, rawIndex).filter((s) => !s.excludeFromProgress).length,
    [steps]
  );

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
  const step: LessonStep | null = steps[stepIndexRef.current] ?? null;

  // Sigurnosna mreza (korisnica prijavila: staro quiz oznacavanje polja - npr.
  // f2 iz Part A - ostaje vidljivo na tabli i NAKON prelaska na sledeci
  // markSquares korak u Part B, cija tabla treba da bude potpuno cista dok
  // ne pokusa). clearFeedback() u loadStep vec gasi quizHighlightSquares na
  // pocetku ucitavanja, ali ovaj efekat je DODATNA garancija koja se okida
  // na SVAKU promenu aktivnog koraka, nezavisno od kog async toka je highlight
  // prvobitno postavljen (npr. 6s "pilulica" na Next dugmetu, itd).
  useEffect(() => {
    setQuizHighlightSquares(null);
    setQuizHighlightArrows(null);
  }, [step?.id]);

  const totalSteps = steps.length;
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
  // Lesson.graduationTest (Day 30) - kumulativan skor, isti princip kao
  // totalErrorsRef/totalHintsRef (ne resetuje se na Next, samo na Repeat).
  const scoreRef = useRef(lessonState.score);

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
    if (lessonState.score > scoreRef.current) scoreRef.current = lessonState.score;
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
      score: scoreRef.current,
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
    !!step?.noAutoAdvance ||
    // LessonStep.autoAdvanceOnCorrect (Day 31) - korak vec ima SOPSTVENI,
    // brzi (1100ms) auto-advance na tacan odgovor. Bez ovoga, standardna 6s
    // "pilulica" ispod bi istovremeno trcala UPOREDO sa njim - kad bi oba
    // na kraju pozvala onNextStep() (npr. ako pilulicin tajmer kasni i jos
    // uvek "visi" kad sledeci korak vec ucita), drugi poziv bi preskocio
    // SLEDECI korak bez da ga korisnik ikad vidi/odgovori (korisnicin
    // prijavljen bag - Day 31 Q12 "progutano"). Generican mehanizam.
    !!step?.autoAdvanceOnCorrect;
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
    // lesson.flatProgressSegments - OTKAZUJE grupisanje ispod: svaki korak
    // (ukljucujuci trailing puzzle korake) dobija SVOJ segment. Koristi se
    // kad su puzzle koraci tematski razliciti, pojedinacno imenovani primeri
    // (npr. Day 10 "Find the checkmate"), ne ponovljena vezba istog tipa -
    // inace bi JEDNA greska na BILO KOJOJ od njih obojila ceo spojeni
    // segment, iako su ostale tacne.
    if (lesson?.flatProgressSegments) {
      // LessonStep.excludeFromProgress (Day 27 "Chess Notation") - kratki
      // prelazni "watch & learn" koraci se ne racunaju u traku - "current"
      // je broj BROJIVIH koraka PRE tekuceg, ne sirov niz-indeks.
      const stepIndex = stepIndexRef.current;
      const countableTotal = steps.filter((s) => !s.excludeFromProgress).length;
      const countableBefore = steps
        .slice(0, stepIndex)
        .filter((s) => !s.excludeFromProgress).length;
      const currentIsCountable = !steps[stepIndex]?.excludeFromProgress;
      return {
        total: countableTotal,
        current: countableBefore,
        // kind:'freePlay' (Day 14) nema solution.length da deli (ostaje []) -
        // bez ove provere bilo bi 0/0 = NaN, pa nevalidan CSS width.
        completed: countableBefore,
        currentFraction:
          currentIsCountable && step && step.solution.length
            ? progress / step.solution.length
            : 0,
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
    (content: string, kind?: 'task' | 'wrongQuizAnswer') =>
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
    setWrongMarkedSquare(null);
    setRevealAnimation(null);
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

      // LessonStep.anyLegalMoveStreak/exactMoveUci/raceSolution (Day 30
      // "Graduation Checkpoint 1" Part A) - svez pocetak za svaki ovakav
      // korak: streak na 0, skor koraka na pun 1.0, figura koja se testira
      // POCINJE na drillPieceSquare (menja se kako se igra).
      if (
        target.kind === 'teach' &&
        (target.anyLegalMoveStreak || target.exactMoveUci || target.raceSolution)
      ) {
        drillStreakRef.current = 0;
        drillStepScoreRef.current = 1;
        drillMovesPlayedRef.current = 0;
        drillCurrentSquareRef.current = target.drillPieceSquare ?? null;
      }
      // LessonStep.scoredMarkSquares/quizScoredRetry (Day 31 "Graduation
      // Test 2" Q13/Q14) - isti "skor koraka pocinje na 1.0" princip, deli
      // isti ref (drillStepScoreRef) - ova dva tipa koraka se nikad ne
      // preklapaju sa anyLegalMoveStreak/exactMoveUci/raceSolution (razliciti
      // `kind`), pa je bezbedno deliti.
      if (
        (target.kind === 'markSquares' && target.scoredMarkSquares) ||
        (target.kind === 'quiz' && target.quizScoredRetry)
      ) {
        drillStepScoreRef.current = 1;
      }

      // LessonStep.requireLegalCheck (Day 26 "Perpetual Check") - "zagreva"
      // minimax memo-kes ODMAH pri ucitavanju koraka (fire-and-forget, posle
      // intro poruke je vec poslata), ne tek na prvi potez/Hint klik - tako
      // je prvi stvaran potez/Hint vec brz umesto da korisnik ceka 1-2s bas
      // kad pokusa nesto da odigra. setTimeout(0) da ne blokira ovaj isti
      // render ciklus (intro tekst stigne na ekran prvo).
      if (target.kind === 'puzzle' && target.requireLegalCheck) {
        const totalRounds = Math.ceil(target.solution.length / 2);
        setTimeout(() => findSafeCheckMove(target.fen, totalRounds), 0);
      }

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

      // LessonStep.playMoveOnLoad (Day 27 "Chess Notation" Part C) - tabla
      // POCINJE sa figurom na POLAZNOM polju (`target.fen`) i odigra STVARAN
      // potez do odredista CIM se korak ucita, pre bilo kog odgovora -
      // korisnica trazila da vidi pravi potez (npr. konj Ng1-f3), ne samo
      // gotovu poziciju, da pitanje "kako bi ovo zapisao" opisuje ono sto je
      // STVARNO video. Mala pauza pre poteza (isti princip kao protivnikov
      // odgovor u puzzle koracima) da polazna pozicija stigne da se vidi.
      if (target.kind === 'quiz' && target.playMoveOnLoad) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, OPPONENT_REPLY_DELAY_MS)
        );
        const introMove = uciToMove(target.playMoveOnLoad);
        moveSoundRef.current?.play().catch(() => {});
        await enqueueMovexUpdate(() =>
          dispatch({
            type: 'loadedChapter:addDailyLessonMove',
            payload: { move: { from: introMove.from, to: introMove.to } },
          })
        );
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
          // Bag (Day 29 "Caro-Kann", orientation:'b') - showSolutionArrowUpfront
          // iznad je vec nacrtala strelicu za solution[0], ALI to je bas
          // potez koji je OVDE upravo auto-odigrao protivnik, ne korisnikov.
          // Korisnik ostaje bez strelice za SVOJ stvarni prvi potez
          // (solution[1]) dok ne pogodi slucajno ili ne zatrazi Hint -
          // "vodjenje" se prekida pre nego sto i pocne. Ponovo nacrtaj
          // strelicu OVDE, sada za solution[1] - isti princip kao re-arm
          // logika u onMove za svaki sledeci potez.
          if (target.showSolutionArrowUpfront) {
            const nextUci = target.solution[1];
            if (nextUci) setHintArrowMap(buildSolutionArrow(nextUci));
          }
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
      // Cita ref-a DIREKTNO (ne zatvoreni `steps`) - onRepeatLesson gore
      // mutira shuffledStepsRef SINHRONO, TACNO pre ovog poziva; zatvoreni
      // `steps` bi i dalje bio stara (pred-reroll) vrednost iz ovog render-a
      // dok React ne zavrti sledeci render.
      const target = (shuffledStepsRef.current?.steps ?? steps)[stepIndex];
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
      if (lessonPatch.score !== undefined) scoreRef.current = lessonPatch.score;
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
      steps,
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

  const onNextStep = useCallback(() => {
    if (isLastStep) return;
    // Hintovi i greske su po koraku (svaki FEN nosi svoja 2 hinta), ne
    // kumulativni za celu lekciju - moraju se resetovati na svaki novi korak.
    return loadStep(stepIndexRef.current + 1, { errors: 0, hints: 0 });
  }, [isLastStep, loadStep]);

  const onWrongMove = useCallback(
    async (move: ShortChessMove, otherTypeMessage?: string) => {
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
        // LessonStep.requireLegalCheck (Day 26) - "from" nije u solution-u
        // (ANY_LEGAL_CHECK marker, ne UCI) - figura koja igra je UVEK dama,
        // trazi se na trenutnoj tabli umesto citanja iz resenja.
        const from = step.unorderedTargets
          ? resolveNextUnorderedTarget(currentChapter.displayFen, step)?.from
          : step.requireLegalCheck
            ? (() => {
                try {
                  const board = new Chess(currentChapter.displayFen).board();
                  for (const row of board) {
                    for (const sq of row) {
                      if (sq && sq.type === 'q' && sq.color === step.orientation) {
                        return sq.square as Square;
                      }
                    }
                  }
                } catch {
                  // ignore
                }
                return undefined;
              })()
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
      setWrongQuizSteps((prev) =>
        new Set(prev).add(countableIndexOf(stepIndexRef.current))
      );

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          // progress iz ref-a, da ne vratimo napredak unazad ako Movex kasni
          payload: withCounters({ progress: progressRef.current }),
        })
      );
      if (step) {
        // step.otherTypeMoves (Day 21 "Opposition") - potez je PREPOZNAT
        // kao svoja sopstvena kategorija (npr. opozicija, samo pogresna
        // vrsta), ne generican promasaj - salje se TACNO napisana poruka,
        // bez variranja (isti princip kao hintTextAlways).
        if (otherTypeMessage) {
          await sendCoachMessage(otherTypeMessage);
        } else if (step.hintTextAlways) {
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
      countableIndexOf,
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

      // LessonStep.anyLegalMoveStreak/exactMoveUci/raceSolution (Day 30
      // "Graduation Checkpoint 1" Part A) - potpuno odvojena grana, NE
      // poredi se sa solution[] (ovde samo placeholder duzine). Potez sa
      // BILO KOG drugog polja (npr. dummy kralj dodat samo zbog FEN
      // validacije) se tiho ignorise - nije deo zadatka.
      if (
        step?.kind === 'teach' &&
        (step.anyLegalMoveStreak || step.exactMoveUci || step.raceSolution)
      ) {
        if (move.from !== drillCurrentSquareRef.current) return;

        const deduction = step.scoreDeduction ?? 0.25;
        const chess = new Chess(currentChapter.displayFen);
        const legalMoves = chess.moves({
          square: move.from as Square,
          verbose: true,
        });
        const matchedLegal = legalMoves.find(
          (m) =>
            m.to === move.to &&
            (!move.promoteTo ||
              (m.promotion ?? '').toLowerCase() ===
                move.promoteTo.toLowerCase())
        );
        // Bag prijavljen: ove pozicije imaju dummy kraljeve dodati SAMO
        // zbog FEN validacije (vidi komentar uz DAY_30 u lessonDatabase.ts).
        // Pravi sah NIKAD ne dozvoljava da se kralj pojede (korisnik bi vec
        // bio u satu/matu pre te pozicije) - ali chess.js, kad se pozicija
        // UCITA direktno (ne stigne kroz pravu partiju), generise "uzmi
        // kralja" kao sasvim obican legalan potez klizece figure! Bez ove
        // provere, pokusaj da se pojede kralj bi se pogresno RACUNAO kao
        // tacan potez (ukljucujuci sam kralj kao "odigranu figuru"). Uvek
        // tretiraj kao gresku, bez obzira sta chess.js kaze.
        const isKingCapture = chess.get(move.to as Square)?.type === 'k';
        const isLegal = !!matchedLegal && !isKingCapture;
        const wrongMessage = isKingCapture
          ? "That's the king. You can't capture it, not even here."
          : step.hintText;

        const applyDrillMove = (forPromotion?: boolean) =>
          enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:addDailyLessonMove',
              payload: {
                move: {
                  from: move.from,
                  to: move.to,
                  ...(move.promoteTo ? { promoteTo: move.promoteTo } : {}),
                },
                // Uvek korisnikov red opet - nema "protivnika" u ovim
                // izolovanim vezbama, svaki potez je njegov.
                forceTurn: step.orientation,
                lesson: withCounters({}),
              },
            })
          );

        const finalizeDrillStep = async (doneMessage?: string) => {
          scoreRef.current += drillStepScoreRef.current;
          progressRef.current = step.solution.length;
          stepDoneSoundRef.current?.play().catch(() => {});
          await enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:setDailyLesson',
              payload: withCounters({ progress: step.solution.length }),
            })
          );
          if (doneMessage ?? step.doneText) {
            await sendCoachMessage(doneMessage ?? step.doneText);
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
        };

        const flashWrong = async (message: string) => {
          clearFeedback({ keepHintArrow: hintsRef.current >= MAX_HINTS_PER_STEP });
          setWrongSquare(move.to);
          wrongMoveTimeoutRef.current = setTimeout(
            () => setWrongSquare(null),
            700
          );
          wrongMoveSoundRef.current!.currentTime = 0;
          wrongMoveSoundRef.current?.play().catch(() => {});
          const nextErrors = errorsRef.current + 1;
          errorsRef.current = nextErrors;
          totalErrorsRef.current += 1;
          // Bag prijavljen: ovaj korak je imao bar jedan pogresan/ilegalan
          // pokusaj, ali se NIKAD nije dodavao u wrongQuizSteps (za razliku
          // od onWrongMove/onSelectQuizAnswer/finalizeMarkAttempt, koji svi
          // ovo rade) - segment na traci je zato ostajao zelen cak i kad je
          // korisnica pogresila usput. Isti countableIndexOf princip kao
          // svuda drugde.
          setWrongQuizSteps((prev) =>
            new Set(prev).add(countableIndexOf(stepIndexRef.current))
          );
          await enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:setDailyLesson',
              payload: withCounters({ progress: progressRef.current }),
            })
          );
          if (message) await sendCoachMessage(message);
        };

        // ---------- Q6/Q7 (Day 30), Q5/Q6 (Day 31) stil: jedan od unapred
        // odredjenih tacnih poteza (jedan string ili VISE prihvatljivih) ----------
        if (step.exactMoveUci) {
          const acceptedUcis = Array.isArray(step.exactMoveUci)
            ? step.exactMoveUci
            : [step.exactMoveUci];
          const isTarget = acceptedUcis.some((uci) =>
            movesMatch(uci, move, true)
          );
          if (isLegal && isTarget) {
            await applyDrillMove();
            await finalizeDrillStep();
          } else {
            drillStepScoreRef.current = Math.max(
              0.25,
              drillStepScoreRef.current - deduction
            );
            await flashWrong(wrongMessage);
          }
          return;
        }

        // ---------- Q8 stil: trka do promocije ----------
        // Korisnica eksplicitno trazila STROZE ponasanje od originalnog
        // "bilo koji legalan potez, penal na kraju za spori put": svako
        // odstupanje od raceSolution (spor prvi potez umesto dvopoljnog
        // skoka, promocija u bilo sta osim dame) se sad ODBIJA - potez se NE
        // primenjuje, pesak ostaje gde je bio, penal + poruka, korisnik
        // mora da proba TACNO taj potez ponovo. Isti princip kao Day 19
        // "Pawn Promotion" (requireExactPromotion), samo pod ovim sistemom
        // bodovanja (movesMatch odavde ne koristi nikakvu drugu potvrdu).
        if (step.raceSolution) {
          const expectedUci = step.raceSolution[drillMovesPlayedRef.current];
          const isExactMatch =
            !!expectedUci && movesMatch(expectedUci, move, true);
          if (isExactMatch) {
            drillMovesPlayedRef.current += 1;
            drillCurrentSquareRef.current = move.to;
            await applyDrillMove(true);
            if (drillMovesPlayedRef.current >= step.raceSolution.length) {
              await finalizeDrillStep();
            } else {
              progressRef.current = Math.min(
                drillMovesPlayedRef.current,
                step.solution.length
              );
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setDailyLesson',
                  payload: withCounters({ progress: progressRef.current }),
                })
              );
              moveSoundRef.current?.play().catch(() => {});
            }
          } else {
            drillStepScoreRef.current = Math.max(
              0.25,
              drillStepScoreRef.current - deduction
            );
            // Specificnija poruka kad je u pitanju TACNO polje/krajnja tacka
            // (samo pogresna brzina/promocija), generican fallback inace.
            const isSameDestinationWrongPromo =
              isLegal &&
              expectedUci &&
              `${move.from}${move.to}` === expectedUci.slice(0, 4) &&
              !!move.promoteTo &&
              move.promoteTo.toLowerCase() !== (expectedUci[4] ?? 'q');
            const isSlowFirstStep =
              isLegal &&
              drillMovesPlayedRef.current === 0 &&
              move.to[1] !== expectedUci?.[3];
            const message = isSameDestinationWrongPromo
              ? "That works, but you've got a stronger piece waiting. Promote to a queen instead."
              : isSlowFirstStep
                ? "That's not the fastest start. From the starting square, you can push two. Get to a queen as fast as you can."
                : wrongMessage;
            await flashWrong(message);
          }
          return;
        }

        // ---------- Q1-5 stil: N legalnih poteza zaredom ----------
        if (step.anyLegalMoveStreak) {
          if (isLegal) {
            drillCurrentSquareRef.current = move.to;
            drillStreakRef.current += 1;
            await applyDrillMove();
            if (drillStreakRef.current >= step.anyLegalMoveStreak) {
              progressRef.current = step.solution.length;
              await finalizeDrillStep();
            } else {
              progressRef.current = drillStreakRef.current;
              await enqueueMovexUpdate(() =>
                dispatch({
                  type: 'loadedChapter:setDailyLesson',
                  payload: withCounters({ progress: progressRef.current }),
                })
              );
              moveSoundRef.current?.play().catch(() => {});
            }
          } else {
            // Korisnica prijavila: brojac se ranije resetovao na 0 na SVAKI
            // pogresan/ilegalan pokusaj, pa je greska usred vezbe znala da
            // trazi VISE OD 3 ukupna uspesna poteza (3 NOVA zaredom POSLE
            // greske, ne 3 ukupno). Trazeno ponasanje: greska KOSTA POENE
            // (penal ispod), ali NE resetuje koliko je poteza vec uspesno
            // odigrano - "3 ukupno, cak i pored greske". drillStreakRef
            // (i progress) se NAMERNO ne diraju ovde.
            drillStepScoreRef.current = Math.max(
              0.25,
              drillStepScoreRef.current - deduction
            );
            await flashWrong(wrongMessage);
          }
        }
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
          : step.requireLegalCheck &&
              step.solution[currentProgress] === ANY_LEGAL_CHECK
            ? // LessonStep.requireLegalCheck (Day 26 "Perpetual Check") -
              // NIJE dovoljno da potez bude BILO KOJI legalan sah - mora
              // biti PROVERENO bezbedan (isSafeCheckMove, pravi minimax),
              // inace korisnik moze da "sahira" na nasumicno polje koje ga
              // vodi u cistu poziciju bez daljeg saha - to tehnicki JESTE
              // sah, ali nije dobar potez za ovu vezbu.
              isSafeCheckMove(
                currentChapter.displayFen,
                `${move.from}${move.to}`,
                Math.max(1, Math.ceil((step.solution.length - currentProgress) / 2))
              )
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
        // step.otherTypeMoves (Day 21 "Opposition") - potez koji ne prolazi
        // korak, ali JE prepoznat kao sopstvena kategorija (vidi definiciju
        // polja) - sopstvena poruka umesto generickog hintText-a.
        // step.unsafeCheckText (Day 26 "Perpetual Check") - potez JESTE sah
        // (legalan), samo nije PROVEREN kao bezbedan - drugacija poruka od
        // standardnog hintText-a (koji je za poteze koji uopste nisu sah).
        const isUnsafeButRealCheck =
          step.requireLegalCheck &&
          step.solution[currentProgress] === ANY_LEGAL_CHECK &&
          step.unsafeCheckText &&
          (() => {
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
              return !!played && chess.inCheck();
            } catch {
              return false;
            }
          })();
        const otherTypeMessage = isUnsafeButRealCheck
          ? step.unsafeCheckText
          : step.otherTypeMoves?.[currentProgress]?.find((m) =>
              movesMatch(m.uci, move)
            )?.message;
        await onWrongMove(move, otherTypeMessage);
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
      countableIndexOf,
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
      if (step.quizRetryOnWrong || step.quizScoredRetry) {
        if (quizAnsweredCorrectlyRef.current) return;
      } else if (progressRef.current >= step.solution.length) {
        return;
      }

      const isCorrect = index === step.quizCorrectIndex;
      (isCorrect ? stepDoneSoundRef : wrongMoveSoundRef).current
        ?.play()
        .catch(() => {});
      // Lesson.graduationTest - tacan odgovor dodaje poene, jedan pokusaj
      // (Day 30 Part B, flat 1 poen) ILI frakcioni skor koraka (Day 31 Q14
      // "quizScoredRetry" - moze biti umanjen prethodnim pogresnim
      // pokusajima, vidi grana ispod). Generican mehanizam.
      if (lesson?.graduationTest && isCorrect) {
        scoreRef.current += step.quizScoredRetry ? drillStepScoreRef.current : 1;
      }
      // Day 27 "Chess Notation" - kviz opcije su cesto SAME polje/notacija
      // (npr. 'e4'/'e5', 'Nf3'/'Nc7') - na netacan odgovor, obelezi NA TABLI
      // koje polje korisnik pogresno izabrao (plavi okvir + crvena tackica,
      // isti vizuelni jezik kao markSquares Part B). Preskace se kad netacna
      // opcija cilja ISTO polje kao tacna (npr. 'a4' vs 'Pa4' - razlika je u
      // notaciji, ne u polju, obelezavanje bi tu bilo pogresno/zbunjujuce).
      // Generican mehanizam - ne samo za ovu lekciju, radi za svaki kviz
      // ciji su quizOptions stringovi koji se zavrsavaju nazivom polja.
      if (isCorrect) {
        setWrongMarkedSquare(null);
      } else if (step.quizOptions) {
        const wrongSq = step.quizOptions[index]?.match(/[a-h][1-8]$/)?.[0];
        const correctSq =
          step.quizCorrectIndex != null
            ? step.quizOptions[step.quizCorrectIndex]?.match(/[a-h][1-8]$/)?.[0]
            : undefined;
        if (wrongSq && wrongSq !== correctSq) {
          setWrongMarkedSquare(wrongSq as Square);
        }
      }
      if (!isCorrect) {
        const stepIndex = stepIndexRef.current;
        setWrongQuizSteps((prev) =>
          new Set(prev).add(countableIndexOf(stepIndex))
        );
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

        // LessonStep.quizScoredRetry (Day 31 "Graduation Test 2" Q14) -
        // netacan odgovor NE zatvara pitanje, ALI svaki pokusaj oduzima
        // poene (floor 0.25) i prikazuje automatske crosshair strelice do
        // tacnog polja (citano sa kraja tacne quizOptions opcije, npr. 'g5')
        // - isti princip kao scoredMarkSquares (finalizeMarkAttempt).
        if (step.quizScoredRetry) {
          const deduction = step.scoreDeduction ?? 0.25;
          drillStepScoreRef.current = Math.max(
            0.25,
            drillStepScoreRef.current - deduction
          );
          const correctSq =
            step.quizCorrectIndex != null
              ? step.quizOptions?.[step.quizCorrectIndex]?.match(
                  /[a-h][1-8]$/
                )?.[0]
              : undefined;
          if (correctSq) {
            const crosshair = buildCrosshairArrows(correctSq);
            applyBoardHighlight({
              arrows: Object.values(crosshair).map(([from, to, color]) => ({
                from,
                to,
                color: color ?? '#11C6D1',
              })),
            });
          }
          if (step.quizExplanationWrong) {
            await sendCoachMessage(
              step.quizExplanationWrong,
              'wrongQuizAnswer'
            );
          }
          await enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:setDailyLesson',
              payload: withCounters({ progress: progressRef.current }),
            })
          );
          return;
        }

        // Day 15 Position 6 "Yes/No" trik - netacan odgovor NE zatvara
        // pitanje (dugmad se vracaju u WidgetPanel-u, korisnik moze da proba
        // ponovo), ALI "Got it!" se ODMAH otkljucava i na netacan odgovor -
        // korisnik ne sme ostati zarobljen u petlji ako uporno bira pogresno,
        // mora moci da ide dalje kad god hoce, ne samo kad konacno pogodi.
        if (step.quizRetryOnWrong) {
          if (step.quizExplanationWrong) {
            await sendCoachMessage(
              step.quizExplanationWrong,
              'wrongQuizAnswer'
            );
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
      } else if (step.quizRetryOnWrong || step.quizScoredRetry) {
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
      // LessonStep.revealSquareAnimation (Day 27) - slovo+broj (+ opciono
      // slovo figure, Part C) "spajanje" na TACNOM polju, i na tacan i na
      // netacan odgovor. Polje se cita sa kraja tacne quizOptions opcije
      // (npr. 'Nf3' -> 'f3', 'e4' -> 'e4'), slovo figure sa pocetka (npr.
      // 'Nf3' -> 'N') - izostaje za pesacke poteze (nemaju slovo) i za Part
      // A (naziv polja, ne potez).
      if (step.revealSquareAnimation && step.quizOptions && step.quizCorrectIndex != null) {
        const correctOption = step.quizOptions[step.quizCorrectIndex];
        const targetSq = correctOption?.match(/[a-h][1-8]$/)?.[0];
        const pieceLetter = correctOption?.match(/^[KQRBN]/)?.[0];
        if (targetSq) triggerRevealAnimation(targetSq, pieceLetter);
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

      // step.quizCorrectFeedbackPool / quizShowCorrectAnswerOnWrong (Day 23
      // "Bridge" kviz) - generican fond/sablon umesto autorovane poruke po
      // pitanju, vidi definicije polja u lessonDatabase.ts.
      const correctAnswerText =
        step.quizOptions && step.quizCorrectIndex != null
          ? step.quizOptions[step.quizCorrectIndex]
          : undefined;
      const explanation = isCorrect
        ? step.quizCorrectFeedbackPool?.length
          ? pickVariedMessage(
              step.quizExplanation ?? step.quizCorrectFeedbackPool[0],
              currentChapter.messages[currentChapter.messages.length - 1]
                ?.content,
              step.quizCorrectFeedbackPool
            )
          : step.quizExplanation
        : step.quizShowCorrectAnswerOnWrong && correctAnswerText
          ? `The right answer: ${correctAnswerText}.`
          : (step.quizExplanationWrong ?? step.quizExplanation);
      if (explanation) {
        // Netacan odgovor - fiksna "Not quite right." oznaka ide ispred
        // (vidi WRONG_ANSWER_LABEL u Conversation.tsx/TypewriterText.tsx,
        // Message.kind u movex/types.ts) - zato ovde (i gore) poruka sama
        // vise NE treba sopstveno "Not quite..." na pocetku, dupliralo bi se.
        await sendCoachMessage(
          explanation,
          isCorrect ? undefined : 'wrongQuizAnswer'
        );
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
      } else if (isCorrect && step.autoAdvanceOnCorrect) {
        // LessonStep.autoAdvanceOnCorrect (opt-in, vraceno za Day 30
        // "Graduation Checkpoint 1" Part B - "immediate advance" na tacan
        // odgovor, rucni Next ostaje na netacan). Day 27 ga NAMERNO ne
        // koristi (korisnica tada trazila iskljucivo rucni Next kroz celu
        // tu lekciju) - polje je generican opt-in, ne globalno ponasanje.
        // Korisnica prijavila (Day 31, mnogo uzastopnih auto-advance pitanja
        // zaredom): korak zna da "proguta" sledece pitanje bez da ga korisnik
        // uopste vidi/odgovori. ZASTITA - zapamti IDENTITET koraka u trenutku
        // zakazivanja (stepKeyRef), proveri DA LI JE JOS UVEK isti kad tajmer
        // stvarno opali. Ako se korak vec promenio u medjuvremenu (npr. stigao
        // je i vec odigran JOS jedan brz odgovor/drugi mehanizam koji je vec
        // pomerio korak), ovaj zakazani poziv se tiho preskace umesto da
        // preskoci korak na koji je korisnik u medjuvremenu stigao.
        const scheduledStepKey = stepKeyRef.current;
        setTimeout(() => {
          if (stepKeyRef.current !== scheduledStepKey) return;
          onNextStep();
        }, 1100);
      }
    },
    [
      step,
      isLastStep,
      onNextStep,
      withCounters,
      dispatch,
      sendCoachMessage,
      lesson,
      applyBoardHighlight,
      currentChapter.messages,
      countableIndexOf,
      triggerRevealAnimation,
    ]
  );

  /**
   * LessonStep.quizMultiSelect (Day 31 "Graduation Test 2" Q2/Q3) - korisnik
   * BIRA tacno `quizCorrectIndices.length` opcija (dugmad se toggle-uju u
   * WidgetPanel-u, ovo se zove TEK kad je taj broj dostignut). Tacno samo
   * ako izabrani skup TACNO odgovara `quizCorrectIndices` (sve-ili-nista) -
   * jedan pokusaj, bez retry-ja, isti autoAdvanceOnCorrect/scoring princip
   * kao standardan kviz.
   */
  const onSelectMultiQuizAnswer = useCallback(
    async (selectedIndices: number[]) => {
      if (!step || step.kind !== 'quiz' || !step.quizMultiSelect) return;
      if (progressRef.current >= step.solution.length) return;

      const correctSet = new Set(step.quizCorrectIndices ?? []);
      const selectedSet = new Set(selectedIndices);
      const isCorrect =
        correctSet.size === selectedSet.size &&
        [...correctSet].every((i) => selectedSet.has(i));
      (isCorrect ? stepDoneSoundRef : wrongMoveSoundRef).current
        ?.play()
        .catch(() => {});
      if (lesson?.graduationTest && isCorrect) {
        scoreRef.current += 1;
      }
      if (!isCorrect) {
        const stepIndex = stepIndexRef.current;
        setWrongQuizSteps((prev) =>
          new Set(prev).add(countableIndexOf(stepIndex))
        );
        errorsRef.current += 1;
        totalErrorsRef.current += 1;
      }

      progressRef.current = step.solution.length;
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ progress: step.solution.length }),
        })
      );
      if (step.quizBoardHighlight) {
        applyBoardHighlight(step.quizBoardHighlight);
      }
      const explanation = isCorrect
        ? step.quizExplanation
        : (step.quizExplanationWrong ?? step.quizExplanation);
      if (explanation) {
        await sendCoachMessage(
          explanation,
          isCorrect ? undefined : 'wrongQuizAnswer'
        );
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
      } else if (isCorrect && step.autoAdvanceOnCorrect) {
        // Ista zastita kao u onSelectQuizAnswer - vidi komentar tamo.
        const scheduledStepKey = stepKeyRef.current;
        setTimeout(() => {
          if (stepKeyRef.current !== scheduledStepKey) return;
          onNextStep();
        }, 1100);
      }
    },
    [
      step,
      isLastStep,
      onNextStep,
      withCounters,
      dispatch,
      sendCoachMessage,
      lesson,
      applyBoardHighlight,
      countableIndexOf,
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

      // LessonStep.scoredMarkSquares (Day 31 "Graduation Test 2" Q13) -
      // netacan klik NE zavrsava korak: penal (floor 0.25), automatske
      // crosshair strelice do tacnog polja, pa pusta da proba ponovo - nema
      // fiksnog broja pokusaja, za razliku od standardnog markSquares
      // ponasanja ispod. Samo kad je lekcija ocenjen test.
      if (!isCorrect && step.scoredMarkSquares && lesson?.graduationTest) {
        const stepIndex = stepIndexRef.current;
        setWrongQuizSteps((prev) =>
          new Set(prev).add(countableIndexOf(stepIndex))
        );
        errorsRef.current += 1;
        totalErrorsRef.current += 1;
        const deduction = step.scoreDeduction ?? 0.25;
        drillStepScoreRef.current = Math.max(
          0.25,
          drillStepScoreRef.current - deduction
        );
        setWrongMarkedSquare(Array.from(markedSet)[0] ?? null);
        setMarkedSquares(new Set());
        const target = step.solution[0];
        if (target) {
          const crosshair = buildCrosshairArrows(target);
          applyBoardHighlight({
            arrows: Object.values(crosshair).map(([from, to, color]) => ({
              from,
              to,
              color: color ?? '#11C6D1',
            })),
          });
        }
        if (step.firstMissText) {
          await sendCoachMessage(step.firstMissText, 'wrongQuizAnswer');
        }
        return;
      }

      if (!isCorrect) {
        const stepIndex = stepIndexRef.current;
        setWrongQuizSteps((prev) =>
          new Set(prev).add(countableIndexOf(stepIndex))
        );
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

        // Pogresno obelezeno polje ostaje vidljivo (plavi okvir + crvena
        // tackica, vidi squareRenderer/wrongMarkedSquare) - korisnica
        // eksplicitno trazila "ne strelicama". Korak se ODMAH zavrsava (ne
        // ceka drugi pokusaj) - mora moci da klikne Next kad hoce, ne sme
        // ostati zakljucana dok ne pogodi.
        setWrongMarkedSquare(Array.from(markedSet)[0] ?? null);
        setMarkedSquares(new Set());
      }

      // scoredMarkSquares (Day 31) - TACAN pokusaj dodaje preostali skor
      // koraka (1.0 ako nikad nije pogresio) u kumulativni lesson score.
      if (isCorrect && step.scoredMarkSquares && lesson?.graduationTest) {
        scoreRef.current += drillStepScoreRef.current;
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
      // Netacno - ovo je TACNO polje (zeleno), zajedno sa pogresno obelezenim
      // (plavo+crveno, gore) - obe boje vidljive istovremeno, jasno razlicite.
      if (step.quizBoardHighlight) {
        applyBoardHighlight(step.quizBoardHighlight);
      }
      // LessonStep.revealSquareAnimation (Day 27 Part B) - ciljno polje je
      // direktno solution[0] (markSquares nema notaciju da se parsira).
      if (step.revealSquareAnimation && step.solution[0]) {
        triggerRevealAnimation(step.solution[0]);
      }

      const explanation = isCorrect
        ? step.doneText
        : (step.firstMissText ?? step.retryPromptText ?? step.doneText);
      if (explanation) {
        await sendCoachMessage(explanation, isCorrect ? undefined : 'wrongQuizAnswer');
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
      // BEZ auto-advance-a (korisnica eksplicitno trazila da se to iskljuci
      // kroz celu lekciju) - Next dugme ceka rucni klik.
    },
    [
      step,
      isLastStep,
      lesson,
      dispatch,
      withCounters,
      sendCoachMessage,
      applyBoardHighlight,
      countableIndexOf,
      triggerRevealAnimation,
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
      // Nov pokusaj pocinje - prethodno pogresno obelezeno polje (vidi
      // wrongMarkedSquare) vise nije relevantno.
      if (wrongMarkedSquare) setWrongMarkedSquare(null);

      if (next.size === step.solution.length) {
        await finalizeMarkAttempt(next);
      }
    },
    [
      step,
      isBusy,
      isStepComplete,
      markedSquares,
      wrongMarkedSquare,
      finalizeMarkAttempt,
    ]
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
      if (!step.extraHintText) return;
      // step.unlimitedQuizHint (Day 22 "Material") - ovde hint NE otkriva
      // resenje, samo podseca na vrednosti figura, pa nema razloga da se
      // zakljuca posle prvog klika kao Day 9 Checkmate/Stalemate.
      if (!step.unlimitedQuizHint) {
        if (hintsRef.current >= 1) return;
        hintsRef.current = 1;
      }
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

    // LessonStep.anyLegalMoveStreak/exactMoveUci/raceSolution (Day 30
    // "Graduation Checkpoint 1" Part A) - bag prijavljen: generican fallback
    // ispod (za standardne teach/puzzle korake) cita `step.solution[progress]`
    // kao UCI string, ali ovde je `solution` samo placeholder ('*') - uciToMove
    // na tome nije davao validno polje, pa se "oznacavanje" tiho gubilo. ISTI
    // standardni dvostepeni sistem kao svuda drugde (1. klik oznaci figuru,
    // 2./poslednji klik doda strelicu, ostaje dok korisnik ne odigra), samo
    // se ciljno polje racuna po modu umesto citanja iz solution[].
    if (
      step.kind === 'teach' &&
      (step.anyLegalMoveStreak || step.exactMoveUci || step.raceSolution)
    ) {
      if (hintsRef.current >= MAX_HINTS_PER_STEP) {
        await sendCoachMessage(
          "You've used both hints — look at the board, you'll spot the move."
        );
        return;
      }
      const from = drillCurrentSquareRef.current as Square | null;
      if (!from) return;
      // Bilo koji TRENUTNO legalan potez te figure - zajednicki fallback za
      // anyLegalMoveStreak (uvek) i raceSolution (kad korisnik vec presao
      // duzinu najbrze linije, spori put). uciToMove NIKAD ne vraca
      // null/undefined (prazan string za nevalidan UCI) - ne sme se osloniti
      // na `??`/optional chaining protiv njega, zato eksplicitna provera.
      const anyCurrentLegalTo = (): string | undefined => {
        try {
          const chess = new Chess(currentChapter.displayFen);
          return chess.moves({ square: from, verbose: true })[0]?.to;
        } catch {
          return undefined;
        }
      };
      let to: string | undefined;
      if (step.exactMoveUci) {
        const firstUci = Array.isArray(step.exactMoveUci)
          ? step.exactMoveUci[0]
          : step.exactMoveUci;
        to = uciToMove(firstUci).to;
      } else if (step.raceSolution) {
        const raceUci = step.raceSolution[drillMovesPlayedRef.current];
        const raceTo = raceUci ? uciToMove(raceUci).to : '';
        to = raceTo || anyCurrentLegalTo();
      } else {
        to = anyCurrentLegalTo();
      }
      if (!to) return;

      const isFinalHint = hintsRef.current + 1 >= MAX_HINTS_PER_STEP;
      clearFeedback();
      setHintPieceSquare(from);
      if (isFinalHint) {
        setHintArrowMap(buildSolutionArrow(`${from}${to}`));
      }
      hintsRef.current += 1;
      totalHintsRef.current += 1;
      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: withCounters({ progress: progressRef.current }),
        })
      );
      if (step.extraHintText) {
        await sendCoachMessage(step.extraHintText);
      } else {
        const lastContent =
          currentChapter.messages[currentChapter.messages.length - 1]
            ?.content;
        await sendCoachMessage(pickHintHelpMessage(lastContent));
      }
      return;
    }

    // LessonStep.requireLegalCheck (Day 26 "Perpetual Check") - ISTI
    // standardni dvostepeni Hint kao svuda drugde (1. klik oznaci figuru,
    // 2./poslednji klik doda strelicu) - korisnicin eksplicitan zahtev,
    // umesto ranijeg "jedan nivo, strelica odmah". "Figura" je uvek dama,
    // njeno TRENUTNO polje se trazi na tabli (jeftino, ne treba minimax) -
    // skupo UZIVO racunanje (findSafeCheckMove) se zove SAMO na 2. klik, kad
    // se stvarno otkriva potez (solution ovde nosi samo ANY_LEGAL_CHECK
    // marker, ne fiksan UCI - tacno koje polje je "bezbedno" zavisi od toga
    // gde je kralj STVARNO pobegao).
    if (step.kind === 'puzzle' && step.requireLegalCheck) {
      if (hintsRef.current >= MAX_HINTS_PER_STEP) {
        await sendCoachMessage(
          "You've used both hints — look at the board, you'll spot the move."
        );
        return;
      }
      const queenSquare = (() => {
        try {
          const board = new Chess(currentChapter.displayFen).board();
          for (const row of board) {
            for (const sq of row) {
              if (sq && sq.type === 'q' && sq.color === step.orientation) {
                return sq.square as Square;
              }
            }
          }
        } catch {
          // ignore
        }
        return null;
      })();
      if (!queenSquare) return;

      const isFinalHint = hintsRef.current + 1 >= MAX_HINTS_PER_STEP;
      clearFeedback();
      setHintPieceSquare(queenSquare);

      if (isFinalHint) {
        // Skupo racunanje (moze potrajati par sekundi na prvi poziv u ovom
        // pokusaju) - setLiveHintLoading + setTimeout(0) da "Thinking..."
        // stvarno stigne da se renderuje pre nego sto glavna nit blokira.
        setLiveHintLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 0));
        try {
          const roundsRemaining = Math.max(
            1,
            Math.ceil((step.solution.length - progressRef.current) / 2)
          );
          const safe = findSafeCheckMove(
            currentChapter.displayFen,
            roundsRemaining
          );
          if (safe) {
            setHintArrowMap(buildSolutionArrow(safe.uci));
          }
        } finally {
          setLiveHintLoading(false);
        }
      }

      hintsRef.current += 1;
      totalHintsRef.current += 1;
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
    // Lesson.shuffleStepsFrom (Day 22) - forsira re-roll na svaki Repeat
    // (ne samo prvi put), citajuci null lessonId nikad ne poklapa pravi
    // lesson.id gore, pa ga taj if-blok odmah ponovo izracuna.
    if (lesson) {
      shuffledStepsRef.current = {
        lessonId: lesson.id,
        steps: shuffleFrom(lesson.steps, lesson.shuffleStepsFrom),
      };
    }
    return loadStep(0, {
      errors: 0,
      hints: 0,
      totalErrors: 0,
      totalHints: 0,
      score: 0,
      completed: false,
    });
  }, [loadStep, lesson]);

  /**
   * Lesson.testStepId (Day 28 "My First Opening with White — London") -
   * skace DIREKTNO na oznaceni korak (npr. "testiraj me opet na istoj
   * liniji, bez vodjenog dela"), isti reset brojaca kao Repeat, ali BEZ
   * vracanja na korak 0. Generican mehanizam, ne Day28-specifican.
   */
  const onTestOpening = useCallback(() => {
    if (!lesson?.testStepId) return;
    const index = steps.findIndex((s) => s.id === lesson.testStepId);
    if (index < 0) return;
    setWrongQuizSteps(new Set());
    return loadStep(index, {
      errors: 0,
      hints: 0,
      totalErrors: 0,
      totalHints: 0,
      score: 0,
      completed: false,
    });
  }, [lesson, steps, loadStep]);

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
    // Lesson.graduationTest.finalScreen (Day 31) - laka, URL-bazirana
    // potvrda "stigao sam ovde PREKO prolaza kroz prethodnu lekciju" (vidi
    // napomenu uz finalScreen u lessonDatabase.ts - nema backend/cross-
    // session cuvanje napretka u ovom repou). Postavlja se na SVAKI prelaz,
    // bezopasno za lekcije koje ga ne citaju.
    if (lesson) params.set('fromLessonId', lesson.id);
    window.location.href = `/room/new?${params.toString()}`;
  }, [nextLessonId, lesson]);

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

  // Popup serija (intro/preStepIntro/End Screen) - ISTA za Lesson.boardless
  // i standardne lekcije, pa se izvlaci jednom i deli ispod umesto
  // duplirana dva puta (vidi boardless granu).
  const dialogContainer = (
    <DailyLessonDialogContainer
      lesson={lesson}
      step={step}
      lessonState={lessonState}
      showIntro={showIntro}
      onStartLesson={async () => {
        setShowIntro(false);
        // step.preStepIntro na PRVOM koraku (npr. Day 22 "Material" - popup
        // 2, podsetnik vrednosti figura) - loadStep ovo vec provera za
        // SVAKI sledeci korak, ali prvi korak nikad ne prolazi kroz
        // loadStep (vec je ucitan pri mount-u), pa se ovde mora ponoviti
        // ista provera, inace se popup nikad ne prikaze.
        if (step?.preStepIntro) {
          setPreStepIntro(step.preStepIntro);
          return;
        }
        if (step) await beginStep(step);
      }}
      onDismissCelebration={onDismissCelebration}
      onRepeatLesson={onRepeatLesson}
      onNextStep={onNextStep}
      isLastStep={isLastStep}
      onNextLesson={nextLessonId ? onNextLesson : undefined}
      onGameReview={onGameReview}
      onTestOpening={onTestOpening}
      preStepIntro={preStepIntro}
      onDismissPreStepIntro={onDismissPreStepIntro}
      wrongQuizSteps={wrongQuizSteps}
    />
  );

  // Desna kolona (progress traka + chat/kviz) - ISTA za Lesson.boardless i
  // standardne lekcije, deli se ispod umesto duplirana.
  const widgetPanelColumn = (
    <div className="flex flex-col gap-2 h-[360px] md:h-full w-full flex-1 md:min-h-0 pb-4 md:pb-0">
      {lesson && (
        <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
          Day {lesson.day} · {lesson.title}
        </p>
      )}
      {/* kind:'freePlay' (Day 14) - prava partija, "1/1" segment nema smisla,
          pa traka ovde izostaje u potpunosti. */}
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
      {/* Lesson.graduationTest (Day 30) - "running score visible" iz
          acceptance kriterijuma, generican prikaz za svaki ocenjen test. */}
      {lesson?.graduationTest && (
        <p className="px-1 text-xs font-bold text-[#07DA63] tabular-nums">
          Score: {Math.round(lessonState.score * 100) / 100} /{' '}
          {lesson.graduationTest.maxScore}
        </p>
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
        onSelectMultiQuizAnswer={onSelectMultiQuizAnswer}
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
  );

  // Lesson.boardless (Day 23 "Bridge") - bez table nigde, kviz/chat kartica
  // puna-ekrana preko dekorativne (NE-interaktivne) pozadine, umesto
  // standardnog split layout-a (ResizableDesktopLayout ispod). Popup serija
  // (dialogContainer) ostaje identicna - vec je sopstveni full-screen
  // overlay, nezavisan od layout-a ispod njega.
  if (lesson?.boardless) {
    return (
      <div className="relative w-full h-full min-h-[100dvh] overflow-hidden bg-[#0b0f17]">
        {/* Dekorativna pozadina - NAMERNO nije stvarna tabla (korisnicin
            zahtev - "nema potrebe da je bude"), samo diskretan motiv da
            ekran ne bude prazan. */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none"
        >
          <span style={{ fontSize: 'min(65vw, 65vh)', lineHeight: 1 }}>
            {lesson.piece.glyph}
          </span>
        </div>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/0 via-black/0 to-black/50"
        />
        {dialogContainer}
        <div className="relative z-10 flex flex-col h-full min-h-[100dvh] w-full max-w-[480px] mx-auto px-4 py-4 md:py-8">
          {widgetPanelColumn}
        </div>
      </div>
    );
  }

  return (
    <ResizableDesktopLayout
      rightSideSize={RIGHT_SIDE_SIZE_PX}
      mainComponent={({ boardSize }) => (
        <div>
          {dialogContainer}

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
                // wrongMarkedSquare (Day 27 "Chess Notation" Part B) - polje
                // koje je korisnik POGRESNO obelezio na prvom promasaju,
                // ostaje vidljivo: plavi okvir + crvena (ne plava) tackica -
                // korisnica eksplicitno trazila da njena greska bude jasno
                // oznacena, umesto strelica duz reda/kolone.
                const isWrongMarked = wrongMarkedSquare === square;
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer',
                      ...(isWrongMarked
                        ? { boxShadow: `inset 0 0 0 3px ${MARK_SELECT_COLOR}` }
                        : hintMark
                          ? hintMark.fill
                            ? { background: hintMark.color }
                            : {
                                boxShadow: `inset 0 0 0 3px ${hintMark.color}`,
                              }
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
                    {/* hintMark.dot (Day 27) - ista plava tackica kao
                        korisnikova sopstvena oznaka ispod, DODATNO preko
                        fill-a kad hint/otkrivanje to trazi. isWrongMarked -
                        ISTA tackica, ali crvena, na polju koje je korisnik
                        pogresno obelezio. */}
                    {(isMarked || hintMark?.dot || isWrongMarked) && (
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
                            background: isWrongMarked
                              ? '#f2358d'
                              : MARK_SELECT_COLOR,
                            boxShadow: `0 0 6px 2px ${
                              isWrongMarked ? '#f2358d' : MARK_SELECT_COLOR
                            }88`,
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
              // wrongMarkedSquare na kviz koraku (Day 27 "Chess Notation" Part
              // A/C) - polje koje korisnik POGRESNO izabrao kroz tekstualnu
              // opciju (ne klikom na tablu, vidi onSelectQuizAnswer), isti
              // vizuelni jezik kao markSquares ispod: plavi okvir + crvena
              // tackica. Nezavisno od quizMark - to polje obicno NEMA
              // sopstveni unos u quizHighlightSquares (samo tacno polje ima).
              const isWrongQuizMarked =
                step?.kind === 'quiz' && wrongMarkedSquare === square;
              if (quizMark || isWrongQuizMarked) {
                // quizMark.fill (Day 27 "Chess Notation") - puna obojena
                // pozadina umesto tankog okvira, bolje se vidi na praznoj
                // tabli - vidi LessonStep.quizBoardHighlight.squares[].fill.
                // quizMark.dot - DODATNA nasa plava tackica na sredini (isti
                // vizuelni jezik kao markSquares korisnikova sopstvena
                // oznaka ispod), jos jedan sloj kontrasta preko fill-a.
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      ...(isWrongQuizMarked
                        ? { boxShadow: `inset 0 0 0 3px ${MARK_SELECT_COLOR}` }
                        : quizMark!.fill
                          ? { background: quizMark!.color }
                          : {
                              boxShadow: `inset 0 0 0 3px ${quizMark!.color}`,
                            }),
                    }}
                  >
                    {children}
                    {(quizMark?.dot || isWrongQuizMarked) && (
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
                            background: isWrongQuizMarked
                              ? '#f2358d'
                              : MARK_SELECT_COLOR,
                            boxShadow: `0 0 6px 2px ${
                              isWrongQuizMarked ? '#f2358d' : MARK_SELECT_COLOR
                            }88`,
                          }}
                        />
                      </div>
                    )}
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

              // Bez ikakvog aktivnog oznacavanja - standardno polje.
              // NAMERNO null (ne `children` direktno) - react-chessboard
              // samo (squareRenderer?.(...) || defaultniDiv) i taj default
              // div nosi `squareStyles[squareId]` (npr. "last move" highlight,
              // premove boja) - `return children` bi to tiho izgubio za
              // VECINU polja (probano i vraceno, stvarni bag za nevidljivu
              // figuru u Part C bio je NEGDE DRUGDE - vidi ChessFENBoard.
              // validateFenString u util-kit, popravljeno u lessonDatabase.ts
              // FEN-ovima, ne ovde).
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
          {revealAnimation && (
            <NotationConvergeAnimation
              key={revealAnimation.nonce}
              square={revealAnimation.square}
              pieceLetter={revealAnimation.pieceLetter}
              sizePx={boardSize}
              orientation={currentChapter.orientation}
              onDone={() => setRevealAnimation(null)}
            />
          )}
          </div>
        </div>
      )}
      rightComponent={widgetPanelColumn}
    />
  );
};
