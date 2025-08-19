import { getToken } from '../../util';

import type { ChapterState } from '../../movex/types';

export async function SendQuestion(
  prompt: string,
  currentChapterState: ChapterState,
  stockfishMovesInfo: string,
  bestline: string
) {
  const model = 'gpt-4.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;

  const piecesUserColor =
    currentChapterState.orientation == 'w' ? 'white' : 'black';

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

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'Best Moves: ' +
    stockfishMovesInfo +
    '\n' +
    'FEN: ' +
    currentChapterState.displayFen +
    '\n' +
    'Stockfish best line: ' +
    bestline +
    '\n' +
    'User color pieces: ' +
    piecesUserColor +
    '\n' +
    'Last move: ' +
    lastMoveSan;
  +'\n' + 'CP score stockfich: ' + currentChapterState.evaluation.newCp;

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

  console.log('question in send question', question);
  try {
    const token = await getToken();

    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB +
        `ai_prompt_v2r?prompt=${question}&previous_response_id=${previusMessageId}&model=${model}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
