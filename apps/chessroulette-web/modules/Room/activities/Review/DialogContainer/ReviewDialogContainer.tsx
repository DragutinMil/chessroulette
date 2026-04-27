import React, { useEffect, useState } from 'react';
import { Dialog } from '@app/components/Dialog';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type ReviewDialogContainerProps = {
  currentChapter: any;
};

export const ReviewDialogContainer: React.FC<ReviewDialogContainerProps> = ({
  currentChapter,
}) => {
  const [removePopup, setRemovePopup] = useState(false);

  if (
    (currentChapter.chessAiMode.mode == 'popup' ||
      currentChapter.chessAiMode.mode == 'checkmate') &&
    !removePopup
  ) {
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
              className=" w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={() => {
                window.location.href =
                  'https://app.outpostchess.com/online-users';
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
