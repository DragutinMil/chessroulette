import { getToken } from '../../../util';
import type { ChapterState } from '../../../movex/types';
export async function SendQuestionReview(
  prompt: string,
  currentChapterState: ChapterState
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
    'PGN: ' +
    currentChapterState.chessAiMode.fen;

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
