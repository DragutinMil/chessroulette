import React, { useEffect, useState } from 'react';

// import { BetweenGamesAborter } from './components/BetweenGamesAborter'
import { Button } from '../../../../../components/Button/Button';
import { Dialog } from '@app/components/Dialog';
import { getPuzzle } from '../util';
import { ChessFENBoard } from '@xmatter/util-kit';
import {
  chessAiMode,
  MovePiece
} from '../movex';
import {
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
type AiChessDialogContainerProps = {
  currentChapter: any; // možeš zameniti `any` konkretnijim tipom kasnije
  addChessAi: (moves: chessAiMode) => void;
  onPuzzleMove: (move: MovePiece) => void;
   onQuickImport: PgnInputBoxProps['onChange'];
   
};


export const AiChessDialogContainer: React.FC<AiChessDialogContainerProps> = ({
  currentChapter,
  addChessAi,
  onQuickImport,
  onPuzzleMove
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
          prevEvaluation: currentChapter.chessAiMode.prevEvaluation,
        });
      };
  const newPuzzle = async () => {
                      const data = await getPuzzle();
                      if (ChessFENBoard.validateFenString(data.fen).ok) {
                        const changeOrientation =
                          currentChapter.orientation === data.fen.split(' ')[1];
                        addChessAi({
                          moves: data.movez,
                          movesCount: data.move_count,
                          badMoves: 0,
                          goodMoves: 0,
                          orientationChange: changeOrientation,
                          mode: 'puzzle',
                          prevEvaluation: 0,
                        });
                        onQuickImport({ type: 'FEN', val: data.fen });
                        //FIRST MOVE
                        const from = data.movez[0].slice(0, 2);
                        const to = data.movez[0].slice(2, 4);
                        const first_move = { from: from, to: to };
                        setTimeout(() => onPuzzleMove(first_move), 1200);
                      }
         };
  if (currentChapter.chessAiMode.mode == 'popup' && !removePopup) {
    return (
      <Dialog
        title="You finished the puzzle!"
        content={
          <div>
            <Button
              bgColor="yellow"
              className=" w-full"
              style={{ marginTop: 12 }}
              onClick={() => {
                  newPuzzle()
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
               play()
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
              }}
            >
              🏠 Home
            </Button>
           
          </div>
        }
      />
    );
  } 

  if (!currentChapter) return null;
};

// TODO: Here we should just check the match.status
