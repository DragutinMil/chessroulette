import { ai_prompt } from '../utils';
import { ChatMessage } from '@app/modules/Match/movex/types';
//import type { ChapterState } from '../../movex/types';
// import { CheckPiece } from './CheckPiece';
//import { Square } from 'chess.js';
export async function ChatBotWidget(
  prompt: string,
  pgn: string,
  messages: ChatMessage[],
  activeBotName: string,
  oponentColor?: string,
  UciFormat?: string[]
) {
  const previusMessageId = messages[messages.length - 1]?.responseId;

  const question =
    'QUESTION:\n' +
    prompt +
    '\n' +
    'pgn: ' +
    pgn +
    '\n' +
    'UCI moves: ' +
    UciFormat +
    '\n' +
    'color oponent: ' +
    oponentColor;

  console.log('send question', question);
  let data;

  if (messages.length > 1) {
    data = await ai_prompt(question, activeBotName, previusMessageId);
  } else {
    {
      data = await ai_prompt(question, activeBotName);
    }
  }

  return data;
}
