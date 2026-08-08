import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dialog } from '@app/components/Dialog';
import { Message } from '../movex';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';
import { Icon } from '@app/components/Icon/Icon';

// Single source of truth for the errors+hints → result mapping, used by
// both the dialog title and the star rating below it, so they can never
// drift out of sync. 5 tiers so 2★ (not just 1.5/2.5) is reachable.
type ResultTier = { stars: number; label: string; emoji: string };

const getResultTier = (errors: number, hints: number): ResultTier => {
  const total = errors + hints;
  if (total === 0) return { stars: 3, label: 'Congratulations!', emoji: '🎉' };
  if (total === 1) return { stars: 2.5, label: 'Almost There!', emoji: '💪' };
  if (total === 2) return { stars: 2, label: 'Good Job!', emoji: '👍' };
  if (total <= 4) return { stars: 1.5, label: 'Not Bad!', emoji: '🙂' };
  return { stars: 1, label: 'Keep Practicing!', emoji: '📖' };
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  // Starts at 0 and is bumped to the real rating one tick after mount, so
  // the width change below is picked up by the CSS transition instead of
  // just appearing already-filled.
  const [animatedRating, setAnimatedRating] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimatedRating(rating));
    return () => cancelAnimationFrame(raf);
  }, [rating]);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map((n) => {
        const fill = Math.max(0, Math.min(1, animatedRating - (n - 1)));
        return (
          <div key={n} className="relative h-6 w-6 shrink-0">
            <Icon
              name="StarIcon"
              kind="outline"
              className="absolute inset-0 h-6 w-6 text-white/30"
            />
            <div
              className="absolute inset-0 overflow-hidden transition-all duration-500 ease-out"
              style={{
                width: `${fill * 100}%`,
                // Cascading left-to-right fill: each star's sweep starts
                // after the previous one's has (mostly) finished.
                transitionDelay: `${(n - 1) * 250}ms`,
              }}
            >
              <Icon
                name="StarIcon"
                kind="solid"
                className="h-6 w-6 text-yellow-400"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

type AiCouchDialogContainerProps = {
  currentChapter: any;
  canFreePlay: boolean;
  onMessage: (message: Message) => void;
  showCongratulations?: boolean;
  onNewOpening?: () => void;
  onDismissCongratulations?: () => void;
  onTestAgain?: () => void;
  onPlay?: () => void;
};

export const AiCouchDialogContainer: React.FC<AiCouchDialogContainerProps> = ({
  currentChapter,
  onMessage,
  canFreePlay,
  showCongratulations,
  onNewOpening,
  onDismissCongratulations,
  onTestAgain,
  onPlay,
}) => {
  const [removePopup, setRemovePopup] = useState(false);
  const play = async () => {};

  useEffect(() => {
    if (showCongratulations) {
      const errors: number = currentChapter?.aiLearn?.errors ?? 0;
      const hints: number = currentChapter?.aiLearn?.hints ?? 0;
      if (errors === 0 && hints === 0) {
        confetti({
          startVelocity: 50,
          particleCount: 150,
          spread: 170,
          origin: { y: 0.6 },
        });
      }
    }
  }, [showCongratulations]);

  useEffect(() => {
    const errors: number = currentChapter?.aiLearn?.errors ?? 0;
    const hints: number = currentChapter?.aiLearn?.hints ?? 0;
    if (
      currentChapter.aiLearn.popup === true &&
      !removePopup &&
      errors === 0 &&
      hints === 0
    ) {
      confetti({
        startVelocity: 50,
        particleCount: 150,
        spread: 170,
        origin: { y: 0.6 },
      });
    }
  }, [currentChapter.aiLearn.mode, removePopup]);

  if (showCongratulations) {
    const errors: number = currentChapter?.aiLearn?.errors ?? 0;
    const hints: number = currentChapter?.aiLearn?.hints ?? 0;
    const tier = getResultTier(errors, hints);
    return (
      <Dialog
        title={
          <span className="text-white font-bold">
            {tier.label} {tier.emoji}
          </span>
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center backgroung-[#272727]">
            <p className="text-slate-300 text-md mt-1">
              {hints} Hint{hints !== 1 ? 's' : ''}, {errors} Error
              {errors !== 1 ? 's' : ''}
            </p>
            <div className="mt-2">
              <StarRating rating={tier.stars} />
            </div>
            <ButtonGreen
              icon="ArrowPathIcon"
              iconKind="outline"
              size="lg"
              className="w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              disabled={errors === 0 && hints === 0}
              onClick={() => {
                onTestAgain?.();
              }}
            >
              &nbsp;Test Again
            </ButtonGreen>

            <ButtonGreen
              icon="Squares2X2Icon"
              size="lg"
              iconKind="outline"
              className="w-full text-[16px] h-[44px] rounded-[22px] whitespace-nowrap"
              style={{ marginTop: 20 }}
              onClick={() => {
                onDismissCongratulations?.();
                onNewOpening?.();
              }}
            >
              New Opening
            </ButtonGreen>

            <ButtonGreen
              icon="PlayIcon"
              iconKind="outline"
              size="lg"
              className="w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              disabled={canFreePlay == true}
              onClick={() => {
                onDismissCongratulations?.();
                onPlay?.();
              }}
            >
              Free Play
            </ButtonGreen>

            <ButtonGreen
              icon="ArrowLeftIcon"
              iconKind="outline"
              size="lg"
              className=" w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={() => {
                window.location.href =
                  'https://app.outpostchess.com/online-list';
              }}
            >
              Back to Lobby
            </ButtonGreen>
            {/* <ButtonGreen
              size="lg"
              className="w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={() => {
                window.location.href = 'https://app.outpostchess.com/puzzleAi';
              }}
            >
              🏠 Home
            </ButtonGreen> */}
          </div>
        }
      />
    );
  }

  // if (currentChapter.aiLearn.popup === true && !removePopup) {
  //   return (
  //     <Dialog
  //       title={
  //         currentChapter.chessAiMode.mode === 'checkmate' ? (
  //           <span className="text-green-400  font-bold animate-pulse">
  //             Checkmate!
  //           </span>
  //         ) : (
  //           ''
  //         )
  //       }
  //       content={
  //         <div className="flex flex-col px-4 py-2 items-center backgroung-[#272727]">
  //           <ButtonGreen
  //             size="lg"
  //             className="w-full text-[16px] h-[44px] rounded-[22px] "
  //             style={{ marginTop: 20 }}
  //             disabled={canFreePlay == false}
  //             onClick={() => {
  //               play();
  //             }}
  //           >
  //             ♟️ Free Play {canFreePlay}
  //           </ButtonGreen>
  //            <ButtonGreen
  //            icon="ArrowLeftIcon"
  //             size="lg"
  //             className=" w-full text-[16px] h-[44px] rounded-[22px]"
  //             style={{ marginTop: 20 }}
  //             onClick={() => {
  //               window.location.href = 'https://app.outpostchess.com/online-list';
  //             }}
  //           >
  //                   Lobby
  //           </ButtonGreen>

  //         </div>
  //       }
  //     />
  //   );
  // }

  if (!currentChapter) return null;
};

// TODO: Here we should just check the match.status
