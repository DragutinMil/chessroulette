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
  scoreCP?: any,
  includeFullPgn?: boolean
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
  const actualPGN = moveNum === -1 ? '' : slicePgn(pgn, moveNum, submoveNum);
  const evaluation = (scoreCP / 100) * -1;
  const opponentName =
    currentChapterState.chessAiMode.opponentName || 'opponent';
  const gameResult = pgn?.match(/1-0|0-1|1\/2-1\/2/)?.[0] ?? 'unknown';
  const normalizedReview = currentChapterState?.chessAiMode?.review?.map(
    (m, index, arr) => {
      const previous = arr[index - 1];
      return {
        moveNum: m.moveNum,
        color: m.moveCalc % 2 == 0 ? 'black' : 'white',
        move: m.move,
        evaluation: m.eval,
        diff: parseFloat(m.diff),
        // ako postoji prethodni objekat, uzmi njegov prvi bestMoves
        bestMove:
          previous && Array.isArray(previous.bestMoves)
            ? previous.bestMoves[0]
            : null,
        fen: m.fen,
      };
    }
  );

  const question =
    'QUESTION:\n' +
    prompt +
    '\n\n' +
    'CONTEXT:\n' +
    (includeFullPgn ? 'whole match pgn:\n ' + pgn + '\n' : '') +
    'pgn actual position:' +
    actualPGN +
    '\n' +
    'fen actual position:' +
    fen +
    '\n' +
    'user pieces color:' +
    userColor +
    '\n' +
    'opponent name:' +
    opponentName +
    '\n' +
    'game result:' +
    gameResult +
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
