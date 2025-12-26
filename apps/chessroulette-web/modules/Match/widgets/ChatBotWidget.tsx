import { ai_prompt } from '../utils';
import { ChatMessage } from '@app/modules/Match/movex/types';
//import type { ChapterState } from '../../movex/types';
// import { CheckPiece } from './CheckPiece';
//import { Square } from 'chess.js';
export async function ChatBotWidget(
  prompt: string,
  //   scoreCP: number,
  messages: ChatMessage[]
  //   stockfishMovesInfo: string,
  //   bestline: string,
  //   currentRatingEngine: number | null,
  //   pgn?: string
) {
  const previusMessageId = messages[messages.length - 1]?.responseId;

  const question = 'QUESTION:\n' + prompt;
  // +'\n' +
  // 'FEN: ' +
  // currentChapterState.displayFen +

  console.log('send question', question);

  const data = await ai_prompt(question, previusMessageId);

  return data;
}
