import { ai_prompt } from '../../util';

import type { ChapterState } from '../../movex/types';

const UI_CONTROLS = `
UI CONTROLS AVAILABLE TO THE USER:
- "Hint" button: highlights the correct move on the board with an arrow.
- "Repeat" button: restarts the current position from the beginning.
- "Next" button: moves on to the next position, enabled once the current one is solved.
`.trim();

const COACH_STYLE = `
You are a chess coach teaching a complete beginner (rating 100-500).
Keep answers to one or two short sentences, warm and encouraging.
Never use jargon without explaining it. Always answer in English.
`.trim();

export async function SendQuestionCoach(
  prompt: string,
  currentChapterState: ChapterState,
  lessonContext?: string
) {
  const model = 'gpt-5.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      ?.idResponse ?? '';

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'FEN: ' +
    currentChapterState.displayFen +
    (lessonContext ? '\n' + lessonContext : '') +
    '\n\n' +
    COACH_STYLE +
    '\n\n' +
    UI_CONTROLS;

  const data = await ai_prompt(question, previusMessageId, model);

  return data;
}
