import { getToken } from '../../util';

import type { ChapterState } from '../../movex/types';
import { CheckPiece } from './CheckPiece';
import { Square } from 'chess.js';
export async function SendQuestion(
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
  //  JSON VARIANT
  // {
  //   question: promptQuestion,
  //   context: {
  //     bestMoves: stockfishMovesInfo,
  //     fen: currentChapterState.displayFen,
  //     stockfishBestLine: bestline,
  //     userColorPieces: piecesUserColor,
  //     lastMove: lastMoveSan
  //   }
  // };

  console.log('send question', question);
  try {
    const token = await getToken();

    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_v2r`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: question,
          previous_response_id: previusMessageId,
          model: model,
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return data?.message || `Error: ${response.status}`;
    }
    return data;
  } catch (error) {
    console.error('Fetch error', error);
  }
}
