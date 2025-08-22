import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
// import { BetweenGamesAborter } from './components/BetweenGamesAborter'
import { Button } from '../../../../../components/Button/Button';
import { Dialog } from '@app/components/Dialog';
import { getPuzzle, sendPuzzleUserRating } from '../util';
import { ChessFENBoard } from '@xmatter/util-kit';
import { chessAiMode, MovePiece } from '../movex';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

type AiChessDialogContainerProps = {
  currentChapter: any; // možeš zameniti `any` konkretnijim tipom kasnije
  addChessAi: (moves: chessAiMode) => void;
  onPuzzleMove: (move: MovePiece) => void;
  //onQuickImport: PgnInputBoxProps['onChange'];
};

export const AiChessDialogContainer: React.FC<AiChessDialogContainerProps> = ({
  currentChapter,
  addChessAi,
  //onQuickImport,
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
      responseId:'',
      message:''
    });
  };
  const newPuzzle = async () => {
    const data = await getPuzzle();
    if (ChessFENBoard.validateFenString(data.fen).ok) {
      const changeOrientation =
        currentChapter.orientation === data.fen.split(' ')[1];
      

      addChessAi({
        mode: 'puzzle',
        moves: data.solution,
        movesCount: data.solution.length / 2,
        badMoves: 0,
        goodMoves: 0,
        orientationChange: changeOrientation,
        puzzleRatting: data.rating,
        userPuzzleRating: currentChapter.chessAiMode.userPuzzleRating,
        ratingChange: 0,
        puzzleId: data.puzzle_id,
        prevUserPuzzleRating: currentChapter.chessAiMode.userPuzzleRating,
        fen: data.fen,
        responseId:'',
        message:''
      });

      //FIRST MOVE
      const from = data.solution[0].slice(0, 2);
      const to = data.solution[0].slice(2, 4);
      const first_move = { from: from, to: to };
      setTimeout(() => onPuzzleMove(first_move), 1200);
    }
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
            <span className="text-green-400 font-bold animate-pulse">
              Checkmate!
            </span>
          ) : (
            ''
          )
        }
        content={
          <div className="flex flex-col px-4 py-2 items-center">
            <ButtonGreen
              size="lg"
              className=" w-full text-[16px] h-[44px] rounded-[22px] "
              onClick={() => {
                newPuzzle();
              }}
            >
              ✅ Next Puzzle
            </ButtonGreen>
            
            <ButtonGreen
              // icon="ArrowLeftIcon"
              size="lg"
              className="w-full text-[16px] h-[44px] rounded-[22px] "
              style={{ marginTop: 20 }}
              onClick={() => {
                play();
              }}
            >
              ♟️ Free Play
            </ButtonGreen>
            
            
            <ButtonGreen
              // icon="ArrowLeftIcon"
              size="lg"
              className=" w-full text-[16px] h-[44px] rounded-[22px]"
              style={{ marginTop: 20 }}
              onClick={() => {
                setRemovePopup(true);
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
