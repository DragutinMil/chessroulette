
import  { getToken } from '../../util';

import type { ChapterState } from '../../movex/types';
  
export async function SendQuestion(
  prompt: string,
  currentChapterState: ChapterState,
  stockfishMovesInfo: any
) {
  const model = 'gpt-4.1';
  console.log('currentChapterState', currentChapterState.notation.history);
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;
      

      console.log('currentChapterState.notation.history.length',currentChapterState.notation.history)
  const question = currentChapterState.notation.history.length==0  ? (
    prompt 
  ):(
    prompt + '. Best Moves:' +  stockfishMovesInfo + 
    '. Fen:' + currentChapterState.displayFen  + '. Last Move: ' + 
    currentChapterState.notation.history[currentChapterState.notation.history.length -1][
      currentChapterState.notation.history[currentChapterState.notation.history.length -1]?.length-1 
    ].san
  )
    
 

    
  //console.log('question in send question', question);
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
