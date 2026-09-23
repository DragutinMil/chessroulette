import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MovexBoundResourceFromConfig } from 'movex-react';
import { Chess, Square } from 'chess.js';
import { noop, ShortChessMove } from '@xmatter/util-kit';
import { PanelResizeHandle } from 'react-resizable-panels';
import movexConfig from '@app/movex.config';
import { ResizableDesktopLayout } from '@app/templates/ResizableDesktopLayout';
import { ArrowsMap } from '@app/components/Chessboard/types';
import { getProductLabel } from '@app/modules/User';

import { useDailyLessonActivitySettings } from './hooks/useDailyLessonActivitySettings';
import { enqueueMovexUpdate, getSubscribeInfo } from './util';
import { DailyLessonDialogContainer } from './DialogContainer/DailyLessonDialogContainer';
import {
  DailyLessonActivityState,
  dailyLesson,
  findLoadedChapter,
  initialDefaultChapter,
} from './movex';
import { findLesson, LessonStep } from './lessonDatabase';
import {
  buildSolutionArrow,
  hasMoreUserMoves,
  movesMatch,
  pieceLegalTargets,
  resolveOpponentReply,
  uciToMove,
} from './lessonEngine';
import { WidgetPanel } from './components/WidgetPanel';
import { DailyLessonBoard } from './components/DailyLessonBoard';
import { LessonProgressBar } from './components/LessonProgressBar';
import { RIGHT_SIDE_SIZE_PX } from '../../constants';

const COACH = 'chatGPT123456';
const OPPONENT_REPLY_DELAY_MS = 450;

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

  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const wrongMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  // Hint dugme - strelica na TACAN potez.
  const [hintArrowMap, setHintArrowMap] = useState<ArrowsMap | null>(null);
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
  const step: LessonStep | null = lesson?.steps[lessonState.stepIndex] ?? null;

  const totalSteps = lesson?.steps.length ?? 0;
  const isLastStep = !!lesson && lessonState.stepIndex === totalSteps - 1;

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

  if (awaitingResetRef.current) {
    // Reset je stigao kroz Movex tek kad se poklope i korak i progress.
    if (stepKey === stepKeyRef.current && lessonState.progress === 0) {
      awaitingResetRef.current = false;
    }
  } else if (stepKeyRef.current !== stepKey) {
    stepKeyRef.current = stepKey;
    progressRef.current = lessonState.progress;
  } else if (lessonState.progress > progressRef.current) {
    progressRef.current = lessonState.progress;
  }
  const progress = progressRef.current;

  const isStepComplete = !!step && progress >= step.solution.length;

  /**
   * Progress traka broji 5 delova, ne 9: svaki 'teach' korak je svoj deo, a
   * svih pet puzzli cine poslednji deo koji se puni kako se resavaju.
   */
  const segments = useMemo(() => {
    const steps = lesson?.steps ?? [];
    const teachCount = steps.filter((s) => s.kind === 'teach').length;
    const puzzleCount = steps.length - teachCount;
    const total = teachCount + (puzzleCount > 0 ? 1 : 0);
    const inPuzzles = lessonState.stepIndex >= teachCount;

    if (!inPuzzles) {
      return {
        total,
        current: lessonState.stepIndex,
        completed: lessonState.stepIndex,
        currentFraction: step ? progress / step.solution.length : 0,
      };
    }

    const solvedPuzzles =
      lessonState.stepIndex - teachCount + (isStepComplete ? 1 : 0);
    return {
      total,
      current: teachCount,
      completed: teachCount + (solvedPuzzles >= puzzleCount ? 1 : 0),
      currentFraction: puzzleCount ? solvedPuzzles / puzzleCount : 0,
    };
  }, [lesson, lessonState.stepIndex, step, progress, isStepComplete]);

  const sendCoachMessage = useCallback(
    (content: string) =>
      enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:writeMessage',
          payload: { content, participantId: COACH, idResponse: '' },
        })
      ),
    [dispatch]
  );

  /** Zadatak koraka ide boldom na pocetak trenerove uvodne poruke. */
  const sendStepIntro = useCallback(
    (target: LessonStep) =>
      sendCoachMessage(`**${target.prompt}**\n\n${target.introText}`),
    [sendCoachMessage]
  );

  const clearFeedback = useCallback(() => {
    if (wrongMoveTimeoutRef.current) clearTimeout(wrongMoveTimeoutRef.current);
    if (hintArrowTimeoutRef.current) clearTimeout(hintArrowTimeoutRef.current);
    if (wrongMoveHintTimeoutRef.current)
      clearTimeout(wrongMoveHintTimeoutRef.current);
    setWrongSquare(null);
    setHintArrowMap(null);
    setWrongMoveHint(null);
  }, []);

  /** Ucitava zadati korak na tablu i resetuje napredak u njemu. */
  const loadStep = useCallback(
    async (stepIndex: number, lessonPatch: Partial<dailyLesson> = {}) => {
      const target = lesson?.steps[stepIndex];
      if (!target) return;

      clearFeedback();
      setIsBusy(true);
      // Napredak vracamo odmah, a `awaitingReset` drzi tu nulu dok stari
      // remote progress ne bude zamenjen - vazi i za Repeat (isti korak) i
      // za Next (novi korak), jer oba do tad citaju zastareo state.
      progressRef.current = 0;
      stepKeyRef.current = `${lessonState.lessonId}:${stepIndex}`;
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
          payload: {
            ...lessonState,
            stepIndex,
            progress: 0,
            popup: false,
            ...lessonPatch,
          },
        })
      );
      await sendStepIntro(target);
      setIsBusy(false);
    },
    [lesson, lessonState, dispatch, clearFeedback, sendStepIntro]
  );

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
            move: { from: reply.from, to: reply.to },
            lesson: nextLesson,
          },
        })
      );
    },
    [dispatch]
  );

  const onWrongMove = useCallback(
    async (move: ShortChessMove) => {
      clearFeedback();
      setWrongSquare(move.to);
      wrongMoveTimeoutRef.current = setTimeout(() => setWrongSquare(null), 700);

      // Hint uvek pokazuje FIGURU KOJA TREBA DA IGRA (iz resenja koraka) i
      // njena stvarna moguca polja - ne polje koje je korisnik pogresno
      // pomerio. Ako korisnik npr. pomeri kralja umesto lovca, ovo i dalje
      // tacno pokazuje lovca i njegove dijagonale, ne kralja kao da je top.
      if (step) {
        const expectedUci = step.solution[progressRef.current];
        if (expectedUci) {
          const { from } = uciToMove(expectedUci);
          const targets = pieceLegalTargets(currentChapter.displayFen, from);
          setWrongMoveHint({ from, targets });
          wrongMoveHintTimeoutRef.current = setTimeout(
            () => setWrongMoveHint(null),
            2500
          );
        }
      }

      wrongMoveSoundRef.current!.currentTime = 0;
      wrongMoveSoundRef.current?.play().catch(() => {});

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: {
            ...lessonState,
            // progress iz ref-a, da ne vratimo napredak unazad ako Movex kasni
            progress: progressRef.current,
            errors: lessonState.errors + 1,
          },
        })
      );
      if (step) await sendCoachMessage(step.hintText);
    },
    [
      clearFeedback,
      currentChapter.displayFen,
      dispatch,
      lessonState,
      sendCoachMessage,
      step,
    ]
  );

  const onMove = useCallback(
    async (move: ShortChessMove) => {
      // Premove sistem (useMoves.ts) pozива ovaj isti onMove DIREKTNO cim
      // isMyTurn postane true - to se desi cim protivnikov potez stigne kroz
      // Movex, sto je obicno BRZE od naseg sopstvenog `setIsBusy(false)`
      // (koji ceka i dodatnih enqueueMovexUpdate 150ms). Zato se ovde NE
      // oslanjamo na `isBusy` (bio bi jos true i odbio bi potez koji je u
      // stvari vec legalan) - samo na progressRef, koji je uvek tacan jer se
      // azurira sinhrono pre bilo kog await-a.
      const currentProgress = progressRef.current;
      if (!step || currentProgress >= step.solution.length) return;

      const expectedUci = step.solution[currentProgress];
      if (!expectedUci || !movesMatch(expectedUci, move)) {
        await onWrongMove(move);
        return;
      }

      clearFeedback();
      setIsBusy(true);
      moveSoundRef.current?.play().catch(() => {});

      const moreUserMoves = hasMoreUserMoves(step, currentProgress);
      // U 'teach' koracima korisnik igra vise poteza zaredom, pa potez
      // vracamo njemu; u puzzle koracima na redu je protivnik.
      const forceTurn =
        step.kind === 'teach' && moreUserMoves ? step.orientation : undefined;

      const progressAfterUserMove = currentProgress + 1;
      // Odmah pomeramo lokalni napredak - sledeci potez ne sme da ceka Movex.
      progressRef.current = progressAfterUserMove;
      const lessonAfterUserMove: dailyLesson = {
        ...lessonState,
        progress: progressAfterUserMove,
      };

      await enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:addDailyLessonMove',
          payload: {
            move: { from: move.from, to: move.to },
            forceTurn,
            lesson: lessonAfterUserMove,
          },
        })
      );

      const replyUci = step.solution[progressAfterUserMove];

      if (step.kind === 'puzzle' && replyUci) {
        // Poziciju posle korisnikovog poteza racunamo lokalno, da bismo za
        // ANY_LEGAL_REPLY mogli da izvucemo legalne protivnicke poteze.
        let fenAfterUserMove = currentChapter.displayFen;
        try {
          const chess = new Chess(currentChapter.displayFen);
          chess.move({ from: move.from, to: move.to, promotion: 'q' });
          fenAfterUserMove = chess.fen();
        } catch {
          // ostaje pozicija pre poteza - resolveOpponentReply ce vratiti null
        }

        progressRef.current = progressAfterUserMove + 1;
        await playOpponentReply(fenAfterUserMove, replyUci, {
          ...lessonState,
          progress: progressAfterUserMove + 1,
        });
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
        await sendCoachMessage(step.doneText);
        if (step.celebrate || isLastStep) {
          await enqueueMovexUpdate(() =>
            dispatch({
              type: 'loadedChapter:setDailyLesson',
              payload: {
                ...lessonState,
                progress: step.solution.length,
                popup: true,
                completed: isLastStep,
              },
            })
          );
        }
      } else if (step.successText) {
        await sendCoachMessage(step.successText);
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
      clearFeedback,
      dispatch,
      currentChapter.displayFen,
      playOpponentReply,
      sendCoachMessage,
      isLastStep,
    ]
  );

  const onHint = useCallback(async () => {
    if (!step || isStepComplete) return;
    const expectedUci = step.solution[progress];
    if (!expectedUci) return;

    clearFeedback();
    setHintArrowMap(buildSolutionArrow(expectedUci));
    hintArrowTimeoutRef.current = setTimeout(() => setHintArrowMap(null), 3000);

    await enqueueMovexUpdate(() =>
      dispatch({
        type: 'loadedChapter:setDailyLesson',
        payload: {
          ...lessonState,
          progress: progressRef.current,
          hints: lessonState.hints + 1,
        },
      })
    );
    await sendCoachMessage(step.hintText);
  }, [
    step,
    isStepComplete,
    progress,
    lessonState,
    clearFeedback,
    dispatch,
    sendCoachMessage,
  ]);

  /** Repeat uvek vraca celu lekciju na prvi korak, ne samo tekuci. */
  const onRepeatLesson = useCallback(
    () =>
      loadStep(0, {
        errors: 0,
        hints: 0,
        completed: false,
      }),
    [loadStep]
  );

  const onNextStep = useCallback(() => {
    if (isLastStep) return;
    return loadStep(lessonState.stepIndex + 1);
  }, [isLastStep, loadStep, lessonState.stepIndex]);

  const onDismissCelebration = useCallback(
    () =>
      enqueueMovexUpdate(() =>
        dispatch({
          type: 'loadedChapter:setDailyLesson',
          payload: { ...lessonState, popup: false },
        })
      ),
    [dispatch, lessonState]
  );

  const boardArrows = useMemo(
    () =>
      hintArrowMap
        ? ({ ...currentChapter.arrowsMap, ...hintArrowMap } as ArrowsMap)
        : currentChapter.arrowsMap,
    [currentChapter.arrowsMap, hintArrowMap]
  );

  const canPlay = !showIntro && !isBusy && !isStepComplete;

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
              if (step) await sendStepIntro(step);
            }}
            onDismissCelebration={onDismissCelebration}
            onRepeatLesson={onRepeatLesson}
            onNextStep={onNextStep}
            isLastStep={isLastStep}
          />

          <DailyLessonBoard
            sizePx={boardSize}
            displayFen={currentChapter.displayFen}
            orientation={currentChapter.orientation}
            circlesMap={currentChapter.circlesMap}
            notation={currentChapter.notation}
            arrowsMap={boardArrows}
            hintSquares={wrongMoveHint?.targets as Square[] | undefined}
            hintFromSquare={wrongMoveHint?.from as Square | undefined}
            canPlay={canPlay}
            squareRenderer={({ square, children }) => {
              if (wrongSquare !== square)
                return null as unknown as React.JSX.Element;
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
        </div>
      )}
      rightComponent={
        <div className="flex flex-col gap-2 h-[360px] md:h-full w-full flex-1 md:min-h-0 pb-4 md:pb-0">
          {lesson && (
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              Day {lesson.day} · {lesson.title}
            </p>
          )}
          <LessonProgressBar
            total={segments.total}
            current={segments.current}
            completed={segments.completed}
            currentFraction={segments.currentFraction}
            onRepeatLesson={onRepeatLesson}
          />
          <WidgetPanel
            userData={userData}
            currentChapterState={currentChapter}
            lesson={lesson}
            step={step}
            lessonState={lessonState}
            isStepComplete={isStepComplete}
            isLastStep={isLastStep}
            isBusy={isBusy}
            isInstructor={settings.isInstructor}
            onHint={onHint}
            onRepeatLesson={onRepeatLesson}
            onNextStep={onNextStep}
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
