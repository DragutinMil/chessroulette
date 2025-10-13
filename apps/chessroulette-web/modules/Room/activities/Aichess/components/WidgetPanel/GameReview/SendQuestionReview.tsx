import { getToken } from '../../../util';
import type { ChapterState } from '../../../movex/types';
import type { EvaluationMove } from '../../../movex/types';
export async function SendQuestionReview(
  prompt: string,
  currentChapterState: ChapterState,
  reviewData: EvaluationMove[]
) {
  const model = 'gpt-4.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;
  console.log('reviewData', reviewData);
  const normalizedReview = reviewData.map((m, index, arr) => {
    const previous = arr[index - 1];
    return {
      moveNumber: m.moveNumber,
      move: m.move,
      eval: m.eval,
      diff: parseFloat(m.diff),
      // ako postoji prethodni objekat, uzmi njegov prvi bestMoves
      bestMove:
        previous && Array.isArray(previous.bestMoves)
          ? previous.bestMoves[0]
          : null,
    };
  });
  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'pgn:\n ' +
    currentChapterState.chessAiMode.fen +
    '\n ' +
    'REVIEW:\n ' +
    ` 
${JSON.stringify(normalizedReview, null, 2)}
`;

  console.log('question review', question);
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
