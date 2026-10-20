import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { useExtraBottomGap } from '@app/hooks/useExtraBottomGap';
import type { ChapterState, Message, UserData, dailyLesson } from '../../movex';
import type { Lesson, LessonStep } from '../../lessonDatabase';
import { MAX_HINTS_PER_STEP } from '../../lessonDatabase';
import Conversation from './Conversation';
import { SendQuestionCoach } from './SendQuestionCoach';
import { FreePlayControls } from './FreePlayControls';

/**
 * Koliko dugo Next dugme puni "pilulicu" pre nego sto samo ucita sledeci
 * primer - dovoljno da se pročita poruka trenera, ali ne toliko da deluje sporo.
 */
const AUTO_ADVANCE_MS = 6000;

export type DailyLessonWidgetPanelProps = {
  userData: UserData;
  currentChapterState: ChapterState;
  lesson: Lesson | null;
  step: LessonStep | null;
  lessonState: dailyLesson;
  isStepComplete: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  /** Next je spreman za klik - isti trenutak kad progress traka slavi zavrsen korak. */
  nextReady: boolean;
  isInstructor: boolean;
  onHint: () => void;
  /** LessonStep.liveHint (Day 20 Phase 2) - uzivo poziv u toku, prikazuje "Thinking..." i blokira dupli klik. */
  liveHintLoading?: boolean;
  /** Vraca celu lekciju na prvi korak. */
  onRepeatLesson: () => void;
  onNextStep: () => void;
  onMessage: (message: Message) => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  /** Kviz pitanje (kind:'quiz') - korisnik bira jedno od 4 ponudjena dugmeta. */
  onSelectQuizAnswer: (index: number) => void;
  /** step.suggestedMove (Day 17) - klik na potez u chatu, umesto prevlacenja. */
  onPlaySuggestedMove: (uci: string) => void;
  /** kind:'freePlay' (Day 14) - zamenjuju Next dugme, vidi FreePlayControls. */
  onDrawOffer: () => void;
  onTakeBack: () => void;
  onResign: () => void;
  /** Bar jedna cela runda (korisnik + Pawny) odigrana - ima sta da se vrati. */
  canTakeBack: boolean;
};

export const DailyLessonWidgetPanel = ({
  userData,
  currentChapterState,
  lesson,
  step,
  lessonState,
  isStepComplete,
  isLastStep,
  isBusy,
  nextReady,
  onHint,
  liveHintLoading,
  onRepeatLesson,
  onNextStep,
  onMessage,
  onHistoryNotationRefocus,
  onSelectQuizAnswer,
  onPlaySuggestedMove,
  onDrawOffer,
  onTakeBack,
  onResign,
  canTakeBack,
}: DailyLessonWidgetPanelProps) => {
  const [question, setQuestion] = useState('');
  // Koje dugme je user kliknuo na trenutnom kviz pitanju - lokalno, resetuje
  // se na svaki novi korak. Samo za vizuelno oznacavanje (tacno/netacno).
  const [quizSelectedIndex, setQuizSelectedIndex] = useState<number | null>(
    null
  );
  useEffect(() => {
    setQuizSelectedIndex(null);
  }, [step?.id]);
  const handleQuizAnswer = useCallback(
    (index: number) => {
      if (quizSelectedIndex !== null) return;
      setQuizSelectedIndex(index);
      onSelectQuizAnswer(index);
      // Day 15 Position 6 "Yes/No" trik - netacan odgovor ne zavrsava korak
      // (quizRetryOnWrong), pa dugmad vracamo posle kratke pauze (dovoljno
      // da se nagovestaj procita) da korisnik moze da proba ponovo.
      if (step?.quizRetryOnWrong && index !== step?.quizCorrectIndex) {
        setTimeout(() => setQuizSelectedIndex(null), 1600);
      }
    },
    [quizSelectedIndex, onSelectQuizAnswer, step]
  );
  // step.suggestedMove (Day 17) dugme - sakriva se ODMAH na klik (lokalno),
  // ne ceka se async dispatch/isStepComplete krug (isti princip kao
  // quizSelectedIndex iznad - inace bi dugme ostalo klikabilno jos jedan
  // render posle klika).
  const [suggestedMovePlayed, setSuggestedMovePlayed] = useState(false);
  useEffect(() => {
    setSuggestedMovePlayed(false);
  }, [step?.id]);
  const handlePlaySuggestedMove = useCallback(
    (uci: string) => {
      if (suggestedMovePlayed) return;
      setSuggestedMovePlayed(true);
      onPlaySuggestedMove(uci);
    },
    [suggestedMovePlayed, onPlaySuggestedMove]
  );
  const [isFocusedInput, setIsFocusedInput] = useState(false);
  const [pulseDot, setPulseDot] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [smallMobile, setSmallMobile] = useState(false);
  const [showMobileChatInput, setShowMobileChatInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatLimitPaywallVisible, setChatLimitPaywallVisible] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const extraBottomGap = useExtraBottomGap();

  // Next dugme samo puni "pilulicu" AUTO_ADVANCE_MS i onda samo ucita sledeci
  // primer ako user ne klikne pre toga - vazi samo dok je nextReady (korak
  // gotov, tabla slobodna), ne i za trenutni kratki bljesak zelene dok se
  // ceka protivnikov odgovor (isStepComplete && isBusy). CSS *animacija* (ne
  // transition) namerno - jedino animation-play-state ume da se PAUZIRA na
  // hover i nastavi tacno odakle je stala (transition nema pauzu), pa dok
  // korisnik hoveruje dugme, punjenje stane; cim mis ode, nastavlja dalje.
  const autoAdvanceFiredRef = useRef(false);

  useEffect(() => {
    autoAdvanceFiredRef.current = false;
  }, [nextReady]);

  const handleAutoAdvanceFillDone = useCallback(() => {
    if (autoAdvanceFiredRef.current) return;
    autoAdvanceFiredRef.current = true;
    onNextStep();
  }, [onNextStep]);

  const handleNextClick = useCallback(() => {
    // Spreci da naknadno zavrsena "pilulica" (koja je vec u toku) opet
    // pozove onNextStep posto je user vec rucno kliknuo.
    autoAdvanceFiredRef.current = true;
    onNextStep();
  }, [onNextStep]);

  useEffect(() => {
    setSmallMobile(window.innerWidth < 400);
    setIsMobile(window.innerWidth < 768);
  }, []);

  const addQuestion = useCallback(
    async (raw: string) => {
      const trimmed = raw?.trim() ?? '';
      if (!trimmed) return;

      const lastIdResponse =
        currentChapterState.messages[currentChapterState.messages.length - 1]
          ?.idResponse ?? '';

      onMessage({
        content: trimmed,
        participantId: userData?.user_id || 'user',
        idResponse: lastIdResponse,
      });
      setQuestion('');
      setPulseDot(true);

      const lessonContext = step
        ? `Lesson: ${lesson?.title ?? ''}. Current task: ${step.prompt}.`
        : '';

      const data = await SendQuestionCoach(
        trimmed,
        currentChapterState,
        lessonContext
      );
      setPulseDot(false);

      if (data === 'ai_daily_limit_reached') {
        setChatLimitPaywallVisible(true);
        return;
      }

      const answerText =
        typeof data?.answer === 'string' ? data.answer : data?.answer?.text;
      // Kviz korak nema Hint dugme (nista "tap Hint below" tu ne znaci), pa
      // dobija drugaciji, opustenji fallback - OK je pogresiti, odgovor se
      // bira iznad, objasnjenje stize bilo kako bilo. markSquares ima Hint
      // dugme (pokazuje tacna polja), pa ga pominjemo eksplicitno.
      const fallback =
        step?.kind === 'quiz'
          ? "Hmm, I couldn't quite catch that! Just try an answer above — right or wrong, I'll explain it. No pressure, mistakes are totally fine here 🙂"
          : step?.kind === 'markSquares'
            ? "Hmm, I couldn't quite catch that! Right-click (or press on mobile) on the squares you think are right to mark them — and tap Hint below if you want a pointer in the right direction 🙂"
            : "Hmm, I couldn't quite catch that! If you're stuck, tap Hint below and I'll help you out.";
      onMessage({
        content: answerText || fallback,
        participantId: 'chatGPT123456',
        idResponse: data?.id ?? '',
      });
    },
    [currentChapterState, lesson, step, onMessage, userData]
  );

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
  }, [addQuestion]);

  // Lekcija je gotova -> Next se krije, ostaju Play i Repeat.
  const lessonDone = lessonState.completed;

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full rounded-lg shadow-2xl">
      {nextReady && (
        <div className="fixed inset-0 z-[90] bg-black/70 pointer-events-none transition-opacity" />
      )}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-2 md:pb-4 rounded-lg">
        <div
          className="flex flex-col flex-1 min-h-0 overflow-hidden no-scrollbar md:pb-0"
          style={
            isMobile && !showMobileChatInput
              ? { paddingBottom: extraBottomGap }
              : undefined
          }
        >
          {/* Kviz pitanje ide u chatu (Conversation.tsx) kao normalna poruka,
              a dugmad sa odgovorima odmah ispod nje, u istom skrolujucem
              toku - ne u ovom odvojenom fiksiranom redu (taj mehanizam nije
              radio pouzdano jer se ovaj wrapper ne skroluje sam). Ovde ostaje
              samo standardan Hint/Next red. Hint je sakriven za kviz korake
              OSIM kad korak ima extraHintText (cisto tekstualan trag, npr.
              Day 9 Checkmate vs Stalemate). markSquares UVEK ima Hint -
              pokazuje tacna polja, korisnik ih i dalje sam klikce (vidi onHint). */}
          <div
            className={`flex order-1 md:order-2 gap-3 flex-shrink-0 pt-2 pb-2 md:my-[20px] justify-around sticky top-[-4px] ${
              nextReady ? 'z-[95]' : 'z-10 bg-op-widget'
            }`}
          >
            {/* step.liveHint (Day 20 Phase 2) renders Hint INSIDE
                FreePlayControls dole umesto ovde (isti vizuelni jezik kao
                Take Back, u mestu koje Draw/Resign oslobode) - ne duplirati. */}
            {step?.kind !== 'freePlay' &&
              (step?.kind !== 'quiz' || !!step?.extraHintText) && (
              <ButtonGreen
                onClick={onHint}
                icon="LightBulbIcon"
                iconKind="outline"
                size="md"
                className="md:max-w-[110px] max-w-[110px] px-4"
                style={{ maxWidth: smallMobile ? '76px' : '' }}
                disabled={
                  isBusy ||
                  isStepComplete ||
                  liveHintLoading ||
                  // step.liveHint (Day 20 Phase 2) - uvek dostupno, NIJE
                  // ograniceno MAX_HINTS_PER_STEP brojacem (vidi onHint).
                  (!step?.liveHint && lessonState.hints >= MAX_HINTS_PER_STEP)
                }
              >
                <p>{liveHintLoading ? 'Thinking...' : 'Hint'}</p>
              </ButtonGreen>
            )}

            {lessonDone ? (
                <>
                  <ButtonGreen
                    icon="PlayIcon"
                    iconKind="outline"
                    size="md"
                    className="md:max-w-[130px] max-w-[130px] px-4"
                    style={{ maxWidth: smallMobile ? '90px' : '' }}
                    onClick={() => {
                      window.location.href =
                        'https://app.outpostchess.com/online-list';
                    }}
                  >
                    <p className="whitespace-nowrap">Play</p>
                  </ButtonGreen>
                  <ButtonGreen
                    onClick={onRepeatLesson}
                    icon="ArrowPathIcon"
                    iconKind="outline"
                    size="md"
                    className="md:max-w-[130px] max-w-[130px] px-4"
                    style={{ maxWidth: smallMobile ? '90px' : '' }}
                    disabled={isBusy}
                    title="Restart the whole lesson"
                  >
                    <p className="whitespace-nowrap">Repeat</p>
                  </ButtonGreen>
                </>
              ) : step?.kind === 'freePlay' ? (
                <FreePlayControls
                  onDrawOffer={onDrawOffer}
                  onTakeBack={onTakeBack}
                  onResign={onResign}
                  // Resign/Draw/Take Back su UVEK aktivni, ne samo dok je
                  // korisnikov red - korisnik moze da ih pozove i dok Pawny
                  // "razmislja" (ranije je ovo bilo `isBusy`, gasilo sva 3
                  // dugmeta tacno tada). canTakeBack ispod ostaje jedino
                  // pravo ogranicenje (nema sta da se vrati).
                  disabled={false}
                  canTakeBack={canTakeBack}
                  hideDrawResign={!!step?.requireCheckmate}
                  showHint={!!step?.liveHint}
                  onHint={onHint}
                  hintLoading={liveHintLoading}
                />
              ) : (
                <ButtonGreen
                  onClick={handleNextClick}
                  icon="ArrowRightIcon"
                  iconKind="outline"
                  iconClassName="relative z-10"
                  size="md"
                  className={`md:max-w-[130px] max-w-[130px] px-4 transition-[filter,transform] duration-150 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] hover:[animation-play-state:paused] ${
                    nextReady ? 'animate-attentionPulse' : ''
                  }`}
                  style={{
                    maxWidth: smallMobile ? '90px' : '',
                    // Instant zelena samo dok je korak gotov ali jos busy (kratak
                    // bljesak dok se ceka protivnikov odgovor) - kad je nextReady,
                    // zelenu "puni" pilulica ispod, ne skoci odjednom.
                    ...(isStepComplete && !nextReady
                      ? { backgroundColor: 'rgba(7, 218, 99)', color: '#000000' }
                      : {}),
                  }}
                  disabled={isBusy || !isStepComplete || isLastStep}
                >
                  {nextReady && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                      <div
                        onAnimationEnd={handleAutoAdvanceFillDone}
                        className="dl-next-fill h-full group-hover:[animation-play-state:paused]"
                      />
                      <style>{`
                        @keyframes dl-next-fill { from { width: 0%; } to { width: 100%; } }
                        .dl-next-fill { background: rgba(7, 218, 99); animation: dl-next-fill ${AUTO_ADVANCE_MS}ms linear forwards; }
                        @media (prefers-reduced-motion: reduce) { .dl-next-fill { animation: none; width: 0%; } }
                      `}</style>
                    </div>
                  )}
                <p className="relative whitespace-nowrap">
                  {step?.nextButtonText ?? 'Next'}
                </p>
              </ButtonGreen>
            )}
          </div>

          <div className="order-2 md:order-1 min-w-0 flex-1 min-h-0 flex flex-col">
            <Conversation
              currentChapterState={currentChapterState}
              userData={userData}
              pulseDot={pulseDot}
              smallMobile={smallMobile}
              isMobile={isMobile}
              chatLimitPaywallVisible={chatLimitPaywallVisible}
              onCloseChatLimitPaywall={() => setChatLimitPaywallVisible(false)}
              nextReady={nextReady}
              step={step}
              quizSelectedIndex={quizSelectedIndex}
              onSelectQuizAnswer={handleQuizAnswer}
              suggestedMovePlayed={suggestedMovePlayed}
              onPlaySuggestedMove={handlePlaySuggestedMove}
              pawnyAvatarSrc={lesson?.pawnyAvatar}
            />
          </div>

          <div
            className="order-3"
            style={{
              paddingBottom:
                isMobile && showMobileChatInput ? '68px' : undefined,
            }}
          >
            {(!isMobile || showMobileChatInput) && (
              <div
                className={
                  isMobile
                    ? 'flex fixed bottom-0 left-0 right-0 z-30 bg-op-widget border-t border-conversation-100 px-2 pt-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] items-center gap-2'
                    : 'flex flex-shrink-0 mb-2 mt-2 px-1 md:mt-0 items-center gap-2'
                }
              >
                <input
                  type="text"
                  placeholder="Ask your coach..."
                  value={question}
                  autoFocus={isMobile}
                  style={{ boxShadow: '0px 0px 10px 0px #07DA6380' }}
                  className="w-full text-[16px] md:text-[14px] rounded-[20px] border border-conversation-100 bg-[#111111]/40 text-white placeholder-[#FFFFFF]/25 px-4 py-1 md:py-2 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-conversation-200 hover:border-conversation-300"
                  onChange={(e) => setQuestion(e.target.value)}
                  onFocus={() => setIsFocusedInput(true)}
                  onBlur={() => setIsFocusedInput(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      addQuestion(question);
                      if (isMobile) setShowMobileChatInput(false);
                    }
                  }}
                />
                <ButtonGreen
                  icon="MicrophoneIcon"
                  iconClassName="text-green-800"
                  iconKind="outline"
                  onClick={startVoiceInput}
                  className={`flex-shrink-0 p-2 rounded-full transition-colors ${
                    isListening
                      ? 'bg-red-500/80 text-white'
                      : 'bg-[#D9D9D9]/20 opacity-30 text-slate-300 hover:bg-slate-600 border border-conversation-100'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                />
                <ButtonGreen
                  size="md"
                  onClick={() => {
                    const isEmpty = question.trim() === '';
                    if (isMobile && isEmpty) {
                      setShowMobileChatInput(false);
                      return;
                    }
                    if (!isEmpty) {
                      addQuestion(question);
                      if (isMobile) setShowMobileChatInput(false);
                    }
                  }}
                  disabled={isMobile ? false : question.trim() === ''}
                  icon={
                    isMobile && question.trim() === ''
                      ? 'XMarkIcon'
                      : 'PaperAirplaneIcon'
                  }
                  iconKind="outline"
                  iconClassName="text-green-800"
                  className="flex-shrink-0 px-4 py-2 duration-200"
                />
              </div>
            )}
            {isMobile && !showMobileChatInput && (
              <ButtonGreen
                onClick={() => setShowMobileChatInput(true)}
                aria-label="Open chat"
                size="lg"
                icon="ChatBubbleOvalLeftEllipsisIcon"
                iconKind="outline"
                iconClassName="!h-7 !w-7 text-black"
                className="!fixed !bottom-4 !right-4 !z-30 !h-14 !w-14 !rounded-full !bg-[#07DA63] shadow-lg active:scale-95 transition-transform"
              />
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-shrink-0 md:h-[180px] mt-2 rounded-lg md:p-4 p-2 overflow-y-auto no-scrollbar">
          <FreeBoardNotation
            isMobile={isMobile}
            history={currentChapterState.notation?.history}
            playerNames={[]}
            focusedIndex={currentChapterState.notation?.focusedIndex}
            onRefocus={onHistoryNotationRefocus}
            // U lekciji se potezi ne brisu - notacija je samo za pregled.
            onDelete={() => {}}
            isFocusedInput={isFocusedInput}
            emptyContent="Play a move, make magic✨"
          />
        </div>
      </div>
    </div>
  );
};
