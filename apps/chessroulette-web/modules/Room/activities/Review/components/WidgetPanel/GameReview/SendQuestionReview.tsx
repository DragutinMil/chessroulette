import { ai_prompt } from '../../../util';
import type { ChapterState } from '../../../movex/types';
import type { EvaluationMove } from '../../../movex/types';
import { slicePgn } from './slicePgn';
export async function SendQuestionReview(
  prompt: string,
  currentChapterState: ChapterState,
  // reviewData: EvaluationMove[],
  moveSan?: string,
  moveLan?: string,
  scoreCP?: any
) {
  const model = 'gpt-5.1';
  const previusMessageId =
    currentChapterState.messages[currentChapterState.messages.length - 1]
      .idResponse;

  const pgn = currentChapterState.chessAiMode.fen;
  const fen = currentChapterState.displayFen;
  const moveNum = currentChapterState.notation.focusedIndex[0];
  const submoveNum = currentChapterState.notation.focusedIndex[1];
  const userColor =
    currentChapterState.chessAiMode.opponentColor == 'white'
      ? 'black'
      : 'white';
  const actualPGN = slicePgn(pgn, moveNum, submoveNum);
  const evaluation = (scoreCP / 100) * -1;
  const normalizedReview = currentChapterState?.chessAiMode?.review?.map(
    (m, index, arr) => {
      const previous = arr[index - 1];
      return {
        moveNum: m.moveNum,
        color: m.moveCalc % 2 == 0 ? 'black' : 'white',
        move: m.move,
        diff: parseFloat(m.diff),
        // ako postoji prethodni objekat, uzmi njegov prvi bestMoves
        bestMove:
          previous && Array.isArray(previous.bestMoves)
            ? previous.bestMoves[0]
            : null,
      };
    }
  );

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    'whole match pgn:\n ' +
    pgn +
    '\n' +
    'pgn actual position:' +
    actualPGN +
    '\n' +
    'fen actual position:' +
    fen +
    '\n' +
    'user pieces color:' +
    userColor +
    '\n' +
    'best move:' +
    moveSan +
    '\n' +
    'best move to proceed:' +
    moveLan +
    '\n' +
    'evaluation:' +
    evaluation +
    '\n' +
    'REVIEW:\n' +
    ` 
${JSON.stringify(normalizedReview, null, 2)}
`;

  console.log('question review', question);

  const data = await ai_prompt(question, previusMessageId, model);

  return data;
  // return {}
}
