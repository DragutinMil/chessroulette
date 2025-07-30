import React, { useEffect, useState } from 'react';

// import { BetweenGamesAborter } from './components/BetweenGamesAborter'
import { Button } from '../../../../../components/Button/Button';
import { Dialog } from '@app/components/Dialog';
type AiChessDialogContainerProps = {
  currentChapter: any; // možeš zameniti `any` konkretnijim tipom kasnije
};

export const AiChessDialogContainer: React.FC<AiChessDialogContainerProps> = ({
  currentChapter,
}) => {
  const [removePopup, setRemovePopup] = useState(false);
  if (currentChapter.chessAiMode.mode == 'popup' && !removePopup) {
    return (
      <Dialog
        title="You finished the puzzle!"
        content={
          <div>
            <Button
              // icon="ArrowLeftIcon"
              bgColor="yellow"
              className=" w-full"
              style={{ marginTop: 12 }}
              onClick={() => {
                setRemovePopup(true);
                //router.push('https://app.outpostchess.com/online-list');
              }}
            >
              ✅ Next Puzzle
            </Button>
            <Button
              // icon="ArrowLeftIcon"
              bgColor="yellow"
              className="w-full"
              style={{ marginTop: 12 }}
              onClick={() => {
                setRemovePopup(true);
                //router.push('https://app.outpostchess.com/online-list');
              }}
            >
              ♟️ Free Play
            </Button>
            <Button
              // icon="ArrowLeftIcon"
              bgColor="yellow"
              className="w-full"
              style={{ marginTop: 12 }}
              onClick={() => {
                setRemovePopup(true);
                //router.push('https://app.outpostchess.com/online-list');
              }}
            >
              🏠 Home
            </Button>
            {/* <Button
              // icon="ArrowLeftIcon"
              bgColor="yellow"
              className="w-full"
              style={{ marginTop: 12 }}
              onClick={() => {
                setRemovePopup(true);
                //router.push('https://app.outpostchess.com/online-list');
              }}
            >
              Openings
            </Button> */}
          </div>
        }
      />
    );
  } // should there be something?

  if (!currentChapter) return null;
};

// TODO: Here we should just check the match.status
