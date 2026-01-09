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
  UciFormat?: string[],
  botColor?: string
) {
  const previusMessageId = messages[messages.length - 1]?.responseId;

  const question = 'QUESTION:\n' + prompt;
  +'\n' +
    'pgn: ' +
    pgn +
    '\n' +
    'UCI moves: ' +
    UciFormat +
    '\n' +
    'color oponent: ' +
    botColor;

  console.log('send question', question);
  const data = await ai_prompt(question, previusMessageId, activeBotName);

  return data;
}
