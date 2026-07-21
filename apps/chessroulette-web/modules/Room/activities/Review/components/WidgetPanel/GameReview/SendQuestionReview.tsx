import { ai_prompt } from '../../../util';
import type { ChapterState } from '../../../movex/types';
import type { EvaluationMove } from '../../../movex/types';
import { slicePgn } from './slicePgn';

function historyToPgn(
  history: ChapterState['notation']['history'],
  focusedIndex: ChapterState['notation']['focusedIndex']
): string {
  const [turnIdx, halfMove] = focusedIndex;
  const parts: string[] = [];
  for (let i = 0; i <= turnIdx && i < history.length; i++) {
    const turn = history[i];
    if (!turn) break;
    const [white, black] = turn;
    if (white && !white.isNonMove) parts.push(`${i + 1}. ${white.san}`);
    const includeBlack = i < turnIdx || (i === turnIdx && halfMove === 1);
    if (includeBlack && black && !black.isNonMove) parts.push(black.san);
  }
  return parts.join(' ');
}

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
  // const moveNum = currentChapterState.notation.focusedIndex[0];
  // const submoveNum = currentChapterState.notation.focusedIndex[1];
  const userColor =
    currentChapterState.chessAiMode.opponentColor == 'white'
      ? 'black'
      : 'white';
  // const actualPGN = moveNum === -1 ? '' : slicePgn(pgn, moveNum, submoveNum);
  const actualPGN = historyToPgn(
    currentChapterState.notation.history,
    currentChapterState.notation.focusedIndex
  );
  const evaluation = (scoreCP / 100) * 1; //ovde sam promenio za 1 sa -1 jer nije bio dobar rez
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
