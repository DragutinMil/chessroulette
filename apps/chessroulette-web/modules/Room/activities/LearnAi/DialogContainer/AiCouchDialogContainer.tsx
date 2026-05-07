import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
// import { BetweenGamesAborter } from './components/BetweenGamesAborter'
import { Button } from '../../../../../components/Button/Button';
import { Dialog } from '@app/components/Dialog';
import { ChessFENBoard } from '@xmatter/util-kit';
import { aiLearn, MovePiece, Message } from '../movex';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type AiCouchDialogContainerProps = {
  currentChapter: any;
  canFreePlay: boolean;
  onMessage: (message: Message) => void;
};

export const AiCouchDialogContainer: React.FC<AiCouchDialogContainerProps> = ({
  currentChapter,
  onMessage,
  canFreePlay,
}) => {
  const [removePopup, setRemovePopup] = useState(false);
  const play = async () => {};

  useEffect(() => {
    if (currentChapter.aiLearn.popup === true && !removePopup) {
      confetti({
        startVelocity: 50,
        particleCount: 150,
        spread: 170,
        origin: { y: 0.6 },
      });
    }
  }, [currentChapter.aiLearn.mode, removePopup]);

  if (currentChapter.aiLearn.popup === true && !removePopup) {
    return (
      <Dialog
        title={
          currentChapter.chessAiMode.mode === 'checkmate' ? (
            <span className="text-green-400  font-bold animate-pulse">
              Checkmate!
            </span>
          ) : (
            ''
          )
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center backgroung-[#272727]">
            <ButtonGreen
              // icon="ArrowLeftIcon"
              size="lg"
              className="w-full text-[16px] h-[44px] rounded-[22px] "
              style={{ marginTop: 20 }}
              disabled={canFreePlay == false}
              onClick={() => {
                play();
              }}
            >
              ♟️ Free Play {canFreePlay}
            </ButtonGreen>

            <ButtonGreen
              // icon="ArrowLeftIcon"
              size="lg"
              className=" w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={() => {
                window.location.href = 'https://app.outpostchess.com/puzzleAi';
              }}
            >
              🏠 Home
            </ButtonGreen>
          </div>
        }
      />
    );
  }

  if (!currentChapter) return null;
};

// TODO: Here we should just check the match.status
