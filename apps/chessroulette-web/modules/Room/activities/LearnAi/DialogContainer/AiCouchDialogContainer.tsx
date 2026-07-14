import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dialog } from '@app/components/Dialog';
import {  Message } from '../movex';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

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
    if (currentChapter.aiLearn.popup === true && !removePopup && errors === 0 && hints === 0) {
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
    return (
      <Dialog
        title={
          errors === 0 && hints === 0 ? (
            <span className="text-white font-bold">Congratulations! 🎉</span>
          ) : errors + hints < 3 ? (
            <span className="text-white font-bold">Almost There! 💪</span>
          ) : errors + hints < 5 ? (
            <span className="text-white font-bold">Not Bad! 👍</span>
          ) : (
            <span className="text-white font-bold">Keep Practicing! 📖</span>
          )
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center backgroung-[#272727]">
            <p className="text-slate-300 text-md mt-1">
              {errors === 0 && hints === 0 ? (
                <>🎯&nbsp;&nbsp; Perfect score! No mistakes.</>
              ) : errors > 0 && hints === 0 ? (
                <>❌&nbsp;&nbsp; You made {errors} mistake{errors > 1 ? 's' : ''}.</>
              ) : errors === 0 && hints > 0 ? (
                <> No mistakes, but you used {hints} 💡.</>
              ) : (
                <>❌&nbsp;&nbsp; You made {errors} mistake{errors > 1 ? 's' : ''} and used {hints} hint{hints > 1 ? 's' : ''}.</>
              )}
            </p>
            <ButtonGreen
              icon="ArrowPathIcon"
              size="lg"
              className="w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              disabled={errors === 0 && hints ===0}
              onClick={() => {
                onTestAgain?.();
              }}
            >
               &nbsp;Test Again
            </ButtonGreen>

            <ButtonGreen
              icon="Squares2X2Icon"
              size="lg"
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
              size="lg"
              className=" w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={() => {
                window.location.href = 'https://app.outpostchess.com/online-list';
              }}
            >
                    Lobby
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
