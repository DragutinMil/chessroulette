import Cookies from 'js-cookie';
export type ContainerDimensions = {
  width: number;
  height: number;
};

export type Dimensions = ContainerDimensions & {
  verticalPadding: number;
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
  console.log(userPuzzleRating, prevUserPuzzleRating, puzzleId);
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

    return response.json();
  } catch (error) {
    console.error('Fetch error', error);
  }
}
//GET TOKEN
export async function getToken() {
  const token = Cookies.get('sessionToken');
  return token;
}
