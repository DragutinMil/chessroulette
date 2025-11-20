import { ai_prompt } from '../../util';

import type { ChapterState } from '../../movex/types';
import { CheckPiece } from './CheckPiece';
import { Square } from 'chess.js';
export async function SendQuestionPuzzle(
  prompt: string,
  scoreCP: number,
  currentChapterState: ChapterState,
  stockfishMovesInfo: string,
  bestline: string,
  currentRatingEngine: number | null,
  pgn?: string
) {
  const model = 'gpt-4.1-mini';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;

  const piecesUserColor =
    currentChapterState.orientation == 'w' ? 'white' : 'black';

  const from = stockfishMovesInfo.slice(0, 2);
  const bestMovePiece = await CheckPiece(
    from as Square,
    currentChapterState.displayFen
  );

  const lastMoveSan =
    currentChapterState.notation.history.length > 0
      ? currentChapterState.notation.history[
          currentChapterState.notation.history.length - 1
        ][
          currentChapterState.notation.history[
            currentChapterState.notation.history.length - 1
          ]?.length - 1
        ].san
      : '';
  const evaluationStockfish =
    currentChapterState.orientation == 'w'
      ? Number(scoreCP / 100)
      : Number(-(scoreCP / 100));

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'Best Move: ' +
    stockfishMovesInfo +
    ' ' +
    bestMovePiece +
    '\n' +
    'FEN: ' +
    currentChapterState.displayFen +
    '\n' +
    'Stockfish best line: ' +
    bestline +
    '\n' +
    'Evaluation stockfich: ' +
    evaluationStockfish +
    '\n' +
    'User color pieces: ' +
    piecesUserColor +
    '\n' +
    'Last move: ' +
    lastMoveSan +
    '\n' +
    'current rating engine: ' +
    currentRatingEngine;
  '\n' + 'pgn: ' + pgn;
  '\n' + 'starting fen position: ' + currentChapterState.notation.startingFen;

  console.log('send question', question);

  const data = await ai_prompt(question, previusMessageId, model);

  return data;
}
