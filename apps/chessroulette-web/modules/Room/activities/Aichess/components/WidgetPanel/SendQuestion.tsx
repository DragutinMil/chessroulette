import type { ChapterState } from '../../movex/types';

export async function SendQuestion(
  prompt: string,
  currentChapterState: ChapterState,
  stockfishMovesInfo: any
) {
  const model = 'gpt-4.1';
  console.log('stockfishMovesInfo', stockfishMovesInfo);
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;
  const question =
    prompt +
    '. Fen:' +
    currentChapterState.displayFen + '  '
    '.Best Moves: ' +
    stockfishMovesInfo;
  console.log('question in send question', question);
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB +
        `ai_prompt_v2r?prompt=${question}&previous_response_id=${previusMessageId}&model=${model}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
