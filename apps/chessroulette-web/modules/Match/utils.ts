import { ChessColor } from '@xmatter/util-kit';
import Cookies from 'js-cookie';
export function getMovesDetailsFromPGN(pgn: string): {
  totalMoves: number;
  lastMoveBy: ChessColor | undefined;
} {
  if (pgn.length === 0) {
    return {
      totalMoves: 0,
      lastMoveBy: undefined,
    };
  }

  // algorithm logic by chatGPT
  const tokens = pgn
    .split(/\s+/)
    .filter(
      (token) =>
        !/^\d+\.$/.test(token) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(token)
    );

  return {
    totalMoves: Math.ceil(tokens.length / 2),
    lastMoveBy: tokens.length % 2 === 0 ? 'b' : 'w',
  };
}

let movexUpdateQueue = Promise.resolve();
export function enqueueMovexUpdatePlay<T>(
  updateFn: () => Promise<T> | void
): Promise<void> {
  movexUpdateQueue = movexUpdateQueue
    .then(async () => {
      await updateFn();
    })
    .catch((err) => console.error('Error in Movex update:', err));

  return movexUpdateQueue;
}

export async function ai_prompt(question: string, previusMessageId?: string) {
  const token = Cookies.get('sessionToken');
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_agent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_name: 'Laura',
          prompt: question,
          previous_response_id: previusMessageId || '',
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return data?.message || `Error: ${response.status}`;
    }
    return data;
  } catch (error) {
    console.error('Fetch error', error);
  }
}
export const chatBotList = ['-BihTlRZ-SKTL'];
