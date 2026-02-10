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

export async function ai_prompt(
  question: string,
  activeBotName?: string,
  previusMessageId?: string
) {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + `ai_prompt_agent_v2`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent_name: activeBotName,
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

export const findIfBots = (challengeeId: string, challengerId: string) => {
  const idsToCheck = [challengeeId, challengerId].filter(Boolean);

  const bot = chatBotList.find((b) => idsToCheck.includes(b.id));

  return bot;
};

export const chatBotList = [
  {
    id: '9yzBb59_POb9L000',
    name: 'Viola',
    lastName: 'Boticelli',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/3747491a-eb44-4f1e-b046-4676f55c9792.png',
  },
  {
    id: '9aEXYS0xwZS21000',
    name: 'Stella',
    lastName: 'Frustain',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/8c06180a-6fa8-49e8-a20c-c4077965d3d4.png',
  },
  {
    id: 'fH0667J9nJ1Ez000',
    name: 'Margareta',
    lastName: 'Boncwik',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/2f3a365a-9380-41dd-895d-baf773fe3320.png',
  },
  {
    id: '-BihTlRZ-SKTL000',
    name: 'Laura',
    lastName: 'Stein',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/a72abf21-7402-4803-be8d-dceae77287b1.png',
  },
  {
    id: 'Pjdw8gu5kpiRk000',
    name: 'Damian',
    lastName: 'Petersson',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/b0cd13dc-1388-4c15-8243-a55d14b7e915.png',
  },
  {
    id: '8WCVE7ljCQJTW020',
    name: 'Botsworth',
    lastName: 'Smith',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/1cbac9bd-fd34-4931-9a08-32f6487afc2d.png',
  },
  {
    id: 'NaNuXa7Ew8Kac002',
    name: 'Botvik',
    lastName: 'Johansen',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/96124b0e-0775-48e2-8017-59904373276f.png',
  },
  {
    id: 'O8kiLgwcKJWy9005',
    name: 'Botelia',
    lastName: 'Fernandez',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/fa245412-a7e2-4d29-b9d6-34f471df8d08.png',
  },
  {
    id: 'KdydnDHbBU1JY008',
    name: 'Botaraj',
    lastName: 'Singh',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/805cf0d7-e73f-4135-9837-733b31fa3e49.png',
  },
  {
    id: 'vpHH6Jf7rYKwN010',
    name: 'Botxiang',
    lastName: 'Li',
    picture:
      'https://outpostchess.fra1.digitaloceanspaces.com/4e5cf95f-e232-45cb-9c09-74354791db10.png',
  },
];
