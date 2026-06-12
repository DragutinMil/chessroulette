import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
// import { BetweenGamesAborter } from './components/BetweenGamesAborter'
import { Button } from '../../../../../components/Button/Button';
import { Dialog } from '@app/components/Dialog';
import {
  getPuzzle,
  sendPuzzleUserRating,
  getUserStreakPuzzle,
  getUserStreakPlay,
  patchUserStreakPlay,
} from '../util';
import { ChessFENBoard } from '@xmatter/util-kit';
import { chessAiMode, MovePiece, Message } from '../movex';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import { ButtonGreen } from '@app/components/Button/ButtonGreen';

let sessionStreakChecked = false;

type PuzzleDialogContainerProps = {
  currentChapter: any; // možeš zameniti `any` konkretnijim tipom kasnije
  addChessAi: (moves: chessAiMode) => void;
  onPuzzleMove: (move: MovePiece) => void;
  canFreePlay: boolean;
  newPuzzleRequest: () => void;
  onMessage: (message: Message) => void;
  //onQuickImport: PgnInputBoxProps['onChange'];
};

export const PuzzleDialogContainer: React.FC<PuzzleDialogContainerProps> = ({
  currentChapter,
  addChessAi,
  //onQuickImport,
  newPuzzleRequest,
  onMessage,
  canFreePlay,
  onPuzzleMove,
}) => {
  const [removePopup, setRemovePopup] = useState(false);
  const [checkmate, setCheckmate] = useState(false);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [animStage, setAnimStage] = useState(0);
  const [badgeNum, setBadgeNum] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);
  const [dialogReady, setDialogReady] = useState(false);

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
    if (streakDays === null) {
      setAnimStage(0);
      return;
    }
    setBadgeNum(streakDays);
    const t0 = setTimeout(() => setAnimStage(1), 50);
    const t1 = setTimeout(() => setAnimStage(2), 600);
    const t2 = setTimeout(() => setAnimStage(3), 1100);
    const t3 = setTimeout(() => {
      setBadgeNum(streakDays + 1);
      setBadgePulse(true);
      setTimeout(() => setBadgePulse(false), 400);
    }, 1600);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [streakDays]);

  useEffect(() => {
    const hasCheckmate = currentChapter.notation.history
      .at(-1)
      ?.at(-1)
      ?.san?.includes('#');
    if (hasCheckmate) {
      setCheckmate(true);
    } else if (checkmate) {
      setCheckmate(false);
    }
  }, [currentChapter.notation.history]);

  useEffect(() => {
    const mode = currentChapter.chessAiMode.mode;

    if (mode !== 'popup' && mode !== 'checkmate') {
      setStreakDays(null);
      setDialogReady(false);
      return;
    }

    if (removePopup) return;

    if (mode === 'checkmate') {
      setDialogReady(true);
      return;
    }

    confetti({
      startVelocity: 50,
      particleCount: 150,
      spread: 170,
      origin: { y: 0.6 },
    });

    const userPuzzleRating = currentChapter.chessAiMode.userPuzzleRating;
    const prevUserPuzzleRating = currentChapter.chessAiMode.prevUserPuzzleRating;
    const puzzleId = currentChapter.chessAiMode.puzzleId;

    if (!sessionStreakChecked) {
      sessionStreakChecked = true;
      const checkStreak = async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          // Fetchujemo stare vrednosti PRIJE puzzle_result
          const [streakResult, playResult] = await Promise.all([
            getUserStreakPuzzle(),
            getUserStreakPlay(),
          ]);
          // Tek sad šaljemo puzzle_result koji ažurira streak na serveru
          await sendPuzzleUserRating(userPuzzleRating, prevUserPuzzleRating, puzzleId);
          const consecutiveDays = parseInt(
            streakResult?.consecutive_days ?? '0',
            10
          );
          const puzzleCelebration = playResult?.puzzle_celebration
            ? new Date(playResult.puzzle_celebration).toISOString().split('T')[0]
            : null;
          if (puzzleCelebration !== today) {
            setStreakDays(consecutiveDays);
            patchUserStreakPlay({ puzzle_celebration: today });
          }
        } finally {
          setDialogReady(true);
        }
      };
      checkStreak();
    } else {
      sendPuzzleUserRating(userPuzzleRating, prevUserPuzzleRating, puzzleId);
      setDialogReady(true);
    }
  }, [currentChapter.chessAiMode.mode, removePopup]);

  if (
    (currentChapter.chessAiMode.mode == 'popup' ||
      currentChapter.chessAiMode.mode == 'checkmate') &&
    !removePopup &&
    dialogReady
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
            {streakDays === null && currentChapter.chessAiMode.mode === 'popup' && (
              <span className="text-green-400 font-bold text-lg uppercase tracking-widest mb-4">
                Puzzle Solved!
              </span>
            )}
            {streakDays !== null && (
              <div className="flex flex-row items-center gap-4 mb-5 w-full">
                <div
                  className="relative flex-shrink-0"
                  style={{
                    transition: 'opacity 0.5s ease, transform 0.5s ease',
                    opacity: animStage >= 1 ? 1 : 0,
                    transform: animStage >= 1 ? 'scale(1)' : 'scale(0.6)',
                  }}
                >
                  <img src="/flame.webp" alt="flame" className="w-18 h-22 object-contain" />
                  <span
                    className="absolute bottom-1 right-1 bg-cyan-400 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-[#1c1c1c]"
                    style={{
                      color: '#000000',
                      transition: 'transform 0.3s ease',
                      transform: badgePulse ? 'scale(1.5)' : 'scale(1)',
                    }}
                  >
                    {badgeNum}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span
                    className="text-green-400 font-bold text-xs uppercase tracking-widest"
                    style={{
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      opacity: animStage >= 2 ? 1 : 0,
                      transform: animStage >= 2 ? 'translateY(0)' : 'translateY(8px)',
                    }}
                  >
                    Puzzle Solved!
                  </span>
                  <span
                    className="text-white font-bold text-2xl leading-tight"
                    style={{
                      transition: 'opacity 0.5s ease, transform 0.5s ease',
                      opacity: animStage >= 3 ? 1 : 0,
                      transform: animStage >= 3 ? 'translateY(0)' : 'translateY(8px)',
                    }}
                  >
                    {badgeNum}-day streak!
                  </span>
                </div>
              </div>
            )}
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
              disabled={canFreePlay == false || checkmate}
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
