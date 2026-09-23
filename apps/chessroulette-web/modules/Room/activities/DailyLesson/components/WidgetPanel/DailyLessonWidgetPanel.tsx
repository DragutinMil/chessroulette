import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { useExtraBottomGap } from '@app/hooks/useExtraBottomGap';
import type { ChapterState, Message, UserData, dailyLesson } from '../../movex';
import type { Lesson, LessonStep } from '../../lessonDatabase';
import Conversation from './Conversation';
import { SendQuestionCoach } from './SendQuestionCoach';

export type DailyLessonWidgetPanelProps = {
  userData: UserData;
  currentChapterState: ChapterState;
  lesson: Lesson | null;
  step: LessonStep | null;
  lessonState: dailyLesson;
  isStepComplete: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  isInstructor: boolean;
  onHint: () => void;
  /** Vraca celu lekciju na prvi korak. */
  onRepeatLesson: () => void;
  onNextStep: () => void;
  onMessage: (message: Message) => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
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
  onHint,
  onRepeatLesson,
  onNextStep,
  onMessage,
  onHistoryNotationRefocus,
}: DailyLessonWidgetPanelProps) => {
  const [question, setQuestion] = useState('');
  const [isFocusedInput, setIsFocusedInput] = useState(false);
  const [pulseDot, setPulseDot] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [smallMobile, setSmallMobile] = useState(false);
  const [showMobileChatInput, setShowMobileChatInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatLimitPaywallVisible, setChatLimitPaywallVisible] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const extraBottomGap = useExtraBottomGap();

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
      onMessage({
        content:
          answerText ||
          'Something went wrong. Please try again or ask something else.',
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
      <div className="flex-1 min-h-0 min-w-0 flex flex-col border bg-op-widget border-conversation-100 pb-2 px-2 md:px-2 md:pb-4 rounded-lg">
        <div
          className="flex flex-col flex-1 min-h-0 overflow-hidden no-scrollbar md:pb-0"
          style={
            isMobile && !showMobileChatInput
              ? { paddingBottom: extraBottomGap }
              : undefined
          }
        >
          <div className="flex order-1 md:order-2 gap-3 flex-shrink-0 pt-2 pb-2 md:my-[20px] justify-around sticky top-[-4px] z-10 bg-op-widget">
            <ButtonGreen
              onClick={onHint}
              icon="LightBulbIcon"
              iconKind="outline"
              size="md"
              className="md:max-w-[110px] max-w-[110px] px-4"
              style={{ maxWidth: smallMobile ? '76px' : '' }}
              disabled={isBusy || isStepComplete}
            >
              <p>Hint</p>
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

            {lessonDone ? (
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
            ) : (
              <ButtonGreen
                onClick={onNextStep}
                icon="ArrowRightIcon"
                iconKind="outline"
                size="md"
                className="md:max-w-[130px] max-w-[130px] px-4"
                style={{
                  maxWidth: smallMobile ? '90px' : '',
                  ...(isStepComplete
                    ? { backgroundColor: 'rgba(7, 218, 99)', color: '#000000' }
                    : {}),
                }}
                disabled={isBusy || !isStepComplete || isLastStep}
              >
                <p className="whitespace-nowrap">Next</p>
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
              onHistoryNotationRefocus={onHistoryNotationRefocus}
              notationHistoryLength={
                currentChapterState.notation?.history?.length ?? 0
              }
              chatLimitPaywallVisible={chatLimitPaywallVisible}
              onCloseChatLimitPaywall={() => setChatLimitPaywallVisible(false)}
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
          />
        </div>
      </div>
    </div>
  );
};
