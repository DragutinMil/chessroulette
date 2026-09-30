import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Dialog } from '@app/components/Dialog';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { Icon } from '@app/components/Icon/Icon';
import { dailyLesson } from '../movex';
import { Lesson, LessonStep } from '../lessonDatabase';

/**
 * Mini tabla na kojoj figura klizi po tabli - samo za uvod. `movement`
 * bira putanju: 'straight' (top - ivice table) ili 'diagonal' (lovac).
 */
const PieceIntroAnimation = ({
  glyph,
  movement,
}: {
  glyph: string;
  movement: 'straight' | 'diagonal';
}) => (
  <div className="relative mx-auto my-3 h-[128px] w-[128px] rounded-md overflow-hidden">
    <div className="grid grid-cols-4 grid-rows-4 h-full w-full">
      {Array.from({ length: 16 }, (_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const isLight = (row + col) % 2 === 0;
        return (
          <div key={i} className={isLight ? 'bg-[#E8EDF9]' : 'bg-[#7C93B1]'} />
        );
      })}
    </div>
    {/*
      Pun glif (npr. ♜/♝), ne suplji (♖/♗) - suplji je beo i nestaje na
      svetlim poljima. Svetli obris drzi kontrast i na tamnim poljima.
    */}
    <div
      className={`dl-piece-${movement} absolute left-0 top-0 h-8 w-8 flex items-center justify-center text-[30px] leading-none text-[#14181F]`}
      style={{ textShadow: '0 1px 2px rgba(255,255,255,0.45)' }}
    >
      {glyph}
    </div>
    <style>{`
      @keyframes dl-piece-straight {
        0%   { transform: translate(0, 0); }
        25%  { transform: translate(96px, 0); }
        50%  { transform: translate(96px, 96px); }
        75%  { transform: translate(0, 96px); }
        100% { transform: translate(0, 0); }
      }
      @keyframes dl-piece-diagonal {
        0%   { transform: translate(0, 0); }
        50%  { transform: translate(96px, 96px); }
        100% { transform: translate(0, 0); }
      }
      .dl-piece-straight { animation: dl-piece-straight 4s ease-in-out infinite; }
      .dl-piece-diagonal { animation: dl-piece-diagonal 3s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .dl-piece-straight, .dl-piece-diagonal { animation: none; }
      }
    `}</style>
  </div>
);

export type DailyLessonDialogContainerProps = {
  lesson: Lesson | null;
  step: LessonStep | null;
  lessonState: dailyLesson;
  showIntro: boolean;
  isLastStep: boolean;
  onStartLesson: () => void;
  onDismissCelebration: () => void;
  onRepeatLesson: () => void;
  onNextStep: () => void;
};

export const DailyLessonDialogContainer = ({
  lesson,
  step,
  lessonState,
  showIntro,
  isLastStep,
  onStartLesson,
  onDismissCelebration,
  onRepeatLesson,
  onNextStep,
}: DailyLessonDialogContainerProps) => {
  const firedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lessonState.popup || !step) return;
    // Konfeti puca jednom po koraku, ne na svaki re-render dok je popup otvoren.
    if (firedForRef.current === step.id) return;
    firedForRef.current = step.id;

    confetti({
      startVelocity: 50,
      particleCount: 150,
      spread: 170,
      origin: { y: 0.6 },
    });
  }, [lessonState.popup, step]);

  useEffect(() => {
    if (!lessonState.popup) firedForRef.current = null;
  }, [lessonState.popup]);

  if (showIntro && lesson) {
    return (
      <Dialog
        title={
          <span className="text-white font-bold">{lesson.intro.title}</span>
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center">
            <PieceIntroAnimation
              glyph={lesson.piece.glyph}
              movement={lesson.piece.movement}
            />
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              {lesson.intro.text}
            </p>
            <ButtonGreen
              size="lg"
              icon="PlayIcon"
              iconKind="outline"
              className="w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={onStartLesson}
            >
              &nbsp;Let's start
            </ButtonGreen>
          </div>
        }
      />
    );
  }

  if (lessonState.popup && step) {
    const isLessonDone = lessonState.completed;
    return (
      <Dialog
        title={
          <span className="text-[#07DA63] font-bold animate-pulse">
            {isLessonDone ? 'Lesson complete! 🎉' : 'Checkmate! 🎉'}
          </span>
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center">
            <p className="text-slate-300 text-sm text-center leading-relaxed">
              {step.doneText}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Icon name="LightBulbIcon" kind="outline" className="h-4 w-4" />
                {lessonState.hints} hint
                {lessonState.hints !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="XMarkIcon" kind="outline" className="h-4 w-4" />
                {lessonState.errors} error
                {lessonState.errors !== 1 ? 's' : ''}
              </span>
            </div>

            {isLessonDone ? (
              <>
                <p className="text-slate-400 text-xs text-center mt-3">
                  You mastered the {lesson?.piece.name ?? 'piece'} today. Come
                  back tomorrow for the next lesson!
                </p>
                <ButtonGreen
                  icon="PlayIcon"
                  iconKind="outline"
                  size="lg"
                  className="w-full text-[16px] h-[44px] rounded-[22px]"
                  style={{ marginTop: 20 }}
                  onClick={() => {
                    window.location.href =
                      'https://app.outpostchess.com/online-list';
                  }}
                >
                  &nbsp;Play
                </ButtonGreen>
                <ButtonGreen
                  icon="ArrowPathIcon"
                  iconKind="outline"
                  size="lg"
                  className="w-full text-[16px] h-[44px] rounded-[22px]"
                  style={{ marginTop: 12 }}
                  onClick={() => {
                    onDismissCelebration();
                    onRepeatLesson();
                  }}
                >
                  &nbsp;Repeat
                </ButtonGreen>
              </>
            ) : (
              <ButtonGreen
                icon="ArrowRightIcon"
                iconKind="outline"
                size="lg"
                className="w-full text-[16px] h-[44px] rounded-[22px]"
                style={{ marginTop: 20 }}
                disabled={isLastStep}
                onClick={() => {
                  onDismissCelebration();
                  onNextStep();
                }}
              >
                &nbsp;Next
              </ButtonGreen>
            )}
          </div>
        }
      />
    );
  }

  return null;
};
