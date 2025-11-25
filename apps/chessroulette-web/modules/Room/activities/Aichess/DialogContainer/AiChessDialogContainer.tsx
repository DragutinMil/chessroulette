import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
// import { BetweenGamesAborter } from './components/BetweenGamesAborter'
import { Button } from '../../../../../components/Button/Button';
import { Dialog } from '@app/components/Dialog';
import { getPuzzle, sendPuzzleUserRating } from '../util';
import { ChessFENBoard } from '@xmatter/util-kit';
import { chessAiMode, MovePiece, Message } from '../movex';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type AiChessDialogContainerProps = {
  currentChapter: any; // možeš zameniti `any` konkretnijim tipom kasnije
  addChessAi: (moves: chessAiMode) => void;
  onPuzzleMove: (move: MovePiece) => void;
  canFreePlay: boolean;
  newPuzzleRequest: () => void;
  onMessage: (message: Message) => void;
  //onQuickImport: PgnInputBoxProps['onChange'];
};

export const AiChessDialogContainer: React.FC<AiChessDialogContainerProps> = ({
  currentChapter,
  addChessAi,
  //onQuickImport,
  newPuzzleRequest,
  onMessage,
  canFreePlay,
  onPuzzleMove,
}) => {
  const [removePopup, setRemovePopup] = useState(false);
  const play = async () => {
    addChessAi({
      moves: [],
      movesCount: 0,
      badMoves: 0,
      goodMoves: 0,
      orientationChange: false,
      mode: 'play',
      ratingChange: 0,
      puzzleRatting: 0,
      userPuzzleRating: currentChapter.chessAiMode.userPuzzleRating,
      puzzleId: 0,
      prevUserPuzzleRating: 0,
      fen: currentChapter.displayFen,
      responseId: '',
      message: '',
    });
  };

  useEffect(() => {
    if (currentChapter.chessAiMode.mode === 'popup' && !removePopup) {
      confetti({
        startVelocity: 50,
        particleCount: 150,
        spread: 170,
        origin: { y: 0.6 },
      });
      sendPuzzleUserRating(
        currentChapter.chessAiMode.userPuzzleRating,
        currentChapter.chessAiMode.prevUserPuzzleRating,
        currentChapter.chessAiMode.puzzleId
      );
    }
  }, [currentChapter.chessAiMode.mode, removePopup]);

  if (
    (currentChapter.chessAiMode.mode == 'popup' ||
      currentChapter.chessAiMode.mode == 'checkmate') &&
    !removePopup
  ) {
    return (
      <Dialog
        // title="You finished the puzzle!"
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
              size="lg"
              className=" w-full text-[16px] h-[44px] rounded-[22px] "
              onClick={() => {
                newPuzzleRequest();
              }}
            >
              ✅ Next Puzzle
            </ButtonGreen>

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
