import { ai_prompt } from '../../util';

import type { ChapterState } from '../../movex/types';

const UI_CONTROLS = `
UI CONTROLS AVAILABLE TO THE USER:
- "Another Opening 📚" button: switches to different openings that offered on screen.
- "Next Variation ⭐" button: appears after completing the current variation, moves to the next variation within the same opening family. Suggest this if the user wants to explore more lines of the same opening.
- "Opening Test" button: lets the user test themselves by replaying the opening moves from memory without guidance. Suggest this when the user feels ready to practice recall after learning a variation.
- Colored move buttons (e.g. "Nf6 (Berlin Defense)", "d6 (Classical)"): appear at branch points where multiple variations diverge. The user clicks one to choose which line to follow.
`.trim();

export async function SendQuestionCoach(
  prompt: string,
  currentChapterState: ChapterState,
  uciMoves?: string,
  currentVariantName?: string | null,
  variantContext?: string
) {
  const model = 'gpt-5.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;

  const piecesUserColor =
    currentChapterState.orientation == 'w' ? 'white' : 'black';

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'FEN: ' +
    currentChapterState.displayFen +
    '\nUser color pieces: ' +
    piecesUserColor +
    '\nOpening name: ' +
    currentChapterState.aiLearn.name +
    (currentVariantName ? '\nVariation: ' + currentVariantName : '') +
    '\nMoves played (uci): ' +
    (uciMoves ?? '') +
    (variantContext ? '\n\n' + variantContext : '') +
    '\n\n' +
    UI_CONTROLS;

  console.log('send question', question);

  const data = await ai_prompt(question, previusMessageId, model);

  return data;
}
