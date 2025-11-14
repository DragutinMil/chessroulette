import { getToken } from '../../../util';
import type { ChapterState } from '../../../movex/types';
import type { EvaluationMove } from '../../../movex/types';
export async function SendQuestionReview(
  prompt: string,
  currentChapterState: ChapterState,
  reviewData: EvaluationMove[]
) {
  const model = 'gpt-4.1-mini';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;
  console.log('reviewData', reviewData);
  const normalizedReview = reviewData.map((m, index, arr) => {
    const previous = arr[index - 1];
    return {
      moveNum: m.moveNum,
      color: m.moveCalc % 2 == 0 ? 'black' : 'white',
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
    '\n' +
    'played by:\n ' +
    (currentChapterState.orientation == 'b' ? 'white player' : 'black player') +
    '\n' +
    'REVIEW:\n' +
    ` 
${JSON.stringify(normalizedReview, null, 2)}
`;

  console.log('question review', question);
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
    return;
  }
}
