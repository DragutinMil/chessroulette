import { ai_prompt } from '../../util';

import type { ChapterState } from '../../movex/types';
import { CheckPiece } from './CheckPiece';
import { Square } from 'chess.js';
export async function SendQuestionCoach(
  prompt: string,
  currentChapterState: ChapterState,

  bestline?: string,
  currentRatingEngine?: number | null,
  stockfishMovesInfo?: string,
  uciMoves?: string
) {
  const model = 'gpt-5.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;

  const piecesUserColor =
    currentChapterState.orientation == 'w' ? 'white' : 'black';

  // const from = stockfishMovesInfo.slice(0, 2);
  // const bestMovePiece = await CheckPiece(
  //   from as Square,
  //   currentChapterState.displayFen
  // );

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'FEN: ' +
    currentChapterState.displayFen +
    // '\n' +

    // 'User color pieces: ' +
    // piecesUserColor +
    // '\n' +
    // 'current rating engine: ' +
    // currentRatingEngine;
    '\n' +
    'Moves uci format: ' +
    uciMoves;

  console.log('send question', question);

  const data = await ai_prompt(question, previusMessageId, model);

  return data;
}
