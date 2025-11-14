import Cookies from 'js-cookie';
export type ContainerDimensions = {
  width: number;
  height: number;
};

export type Dimensions = ContainerDimensions & {
  verticalPadding: number;
};
export type EvaluationMove = {
  moveNum: number;
  move: string;
  moveCalc: number;
  eval: number;
  diff: string;
  bestMoves: string[];
};

export type Ratios = {
  leftSide: number;
  mainArea: number;
  rightSide: number;
};

export const getMaxKey = <O extends { [k: string]: number }>(obj: O) =>
  Object.keys(obj).reduce(
    (prev, next) => (obj[next] > obj[prev] ? next : prev),
    Object.keys(obj)[0] as keyof O
  );

export const normalizeRatios = (r: Ratios): Ratios => {
  const maxKey = getMaxKey(r);
  const maxVal = r[maxKey];

  return {
    leftSide: r.leftSide / maxVal,
    rightSide: r.rightSide / maxVal,
    mainArea: r.mainArea / maxVal,

    // Replace the maxKey with 1
    [maxKey]: 1,
  };
};

// GAME REVIEW

export const reviewAnalitics = (moves: EvaluationMove[]) => {
  const stats = {
    white: {
      blunders: 0,
      badMoves: 0,
      goodMoves: 0,
      excellentMoves: 0,
      firstLine: 0,
      secondLine: 0,
      thirdLine: 0,
    },
    black: {
      blunders: 0,
      badMoves: 0,
      goodMoves: 0,
      excellentMoves: 0,
      firstLine: 0,
      secondLine: 0,
      thirdLine: 0,
    },
  };

  let prevBestMoves: string[] | null = null;

  moves.forEach((m) => {
    const colorStats = m.moveCalc % 2 !== 0 ? stats.white : stats.black;
    const diff = Number(m.diff);

    // Diff evaluacija
    if (m.moveCalc % 2 !== 0) {
      if (diff < -2) colorStats.blunders++;
      else if (diff <= -0.5) colorStats.badMoves++;
      else if (diff > 0.3 && diff <= 1) colorStats.goodMoves++;
      else if (diff > 1) colorStats.excellentMoves++;
    } else {
      if (diff > 2) colorStats.blunders++;
      else if (diff >= 0.5) colorStats.badMoves++;
      else if (diff < -0.3 && diff >= -1) colorStats.goodMoves++;
      else if (diff < -1) colorStats.excellentMoves++;
    }

    // Stockfish linije iz prethodnog poteza
    if (prevBestMoves) {
      if (m.move === prevBestMoves[0]) colorStats.firstLine++;
      else if (m.move === prevBestMoves[1]) colorStats.secondLine++;
      else if (m.move === prevBestMoves[2]) colorStats.thirdLine++;
    }

    // Sačuvaj trenutni bestMoves za sledeću iteraciju
    prevBestMoves = m.bestMoves;
  });

  const result = [
    ...Object.values(stats.white),
    ...Object.values(stats.black),
  ].join('/');

  return result;
};

export const getLayoutSizes = (
  containerDimensions: ContainerDimensions,
  ratios: Ratios
): {
  leftSide: number;
  mainArea: number;
  rightSide: number;
  remaining: number;
} => {
  const normalizedRatios = normalizeRatios(ratios);
  const ratio =
    normalizedRatios.mainArea +
    normalizedRatios.leftSide +
    normalizedRatios.rightSide;
  const maxWidth = containerDimensions.height * ratio;
  const diff = containerDimensions.width - maxWidth;

  if (diff >= 0) {
    return {
      leftSide: Math.floor(normalizedRatios.leftSide * (maxWidth / ratio)),
      mainArea: Math.floor(normalizedRatios.mainArea * (maxWidth / ratio)),
      rightSide: Math.floor(normalizedRatios.rightSide * (maxWidth / ratio)),
      remaining: diff,
    };
  }

  const nextContainerHeight =
    containerDimensions.height - Math.abs(diff / ratio);
  return getLayoutSizes(
    {
      ...containerDimensions,
      height: nextContainerHeight,
    },
    ratios
  );
};

export const isMobile = (dimensions: ContainerDimensions) =>
  dimensions.width < 601;

//OPENINGS
export async function getOpenings() {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'opening_random',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
//PUZZLE
export async function getPuzzle(category?: string) {
  const token = Cookies.get('sessionToken');
  const puzzleCategory = category !== undefined ? `?theme=${category}` : '';
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB +
        'puzzle_random_by_theme' +
        puzzleCategory,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(data.message || `HTTP Error ${response.status}`);
      (err as any).status = response.status;
      (err as any).errorCode = data.errorCode;
      throw err;
    }

    return data;
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message // 👈 sada će biti "puzzle_daily_limit_reached"
          : 'Unknown error',
    };
  }
}
export async function getMatch(matchId: string) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB +
        `challenge_by_match_id?match_id=${matchId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
///SEND USER PUZZLE RATING
export async function sendPuzzleUserRating(
  userPuzzleRating: number,
  prevUserPuzzleRating: number,
  puzzleId: number
) {
  const token = Cookies.get('sessionToken');
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'puzzle_result',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_puzzle_rating_new: userPuzzleRating,
          user_puzzle_rating_old: prevUserPuzzleRating,
          puzzle_id: puzzleId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
  } catch (error) {
    console.error('Fetch error', error);
  }
}
//GET TOKEN
export async function getToken() {
  const token = Cookies.get('sessionToken');

  return token;
}

export async function getUserInfo() {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_info',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
export async function getSubscribeInfo() {
  const token = Cookies.get('sessionToken');

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_WEB + 'current_user_subscription',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
//
let movexUpdateQueue = Promise.resolve();

export function enqueueMovexUpdate<T>(
  updateFn: () => Promise<T> | void
): Promise<void> {
  movexUpdateQueue = movexUpdateQueue
    .then(async () => {
      await updateFn();
    })
    .catch((err) => console.error('Error in Movex update:', err));

  return movexUpdateQueue;
}
