import { getToken } from '../../../util';
import type { ChapterState } from '../../../movex/types';
import type {
  EvaluationMove,
} from '../../../movex/types';
export async function SendQuestionReview(
  prompt: string,
  currentChapterState: ChapterState,
  reviewData: EvaluationMove[]
) {
  const model = 'gpt-4.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'PGN:\n ' +
    currentChapterState.chessAiMode.fen 
    +'\n '+ 'REVIEW:\n ' + `
${reviewData
   .map((m, index) => {
    const previous = reviewData[index - 1]; // prethodni potez, undefined za prvi
    const previousBestMove = previous ? previous.bestMoves[0] : "N/A";

    return `Move ${m.moveNumber}: ${m.move} | Eval: ${m.eval} | Diff: ${m.diff} 
    )} | Recommended move : ${previousBestMove}`;
  })
  .join("\n")}`;

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
