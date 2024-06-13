import z from 'zod';

export type GameStatus = 'pending' | 'ongoing' | 'complete';

export const gameTimeClassRecord = z.union([
  z.literal('blitz'),
  z.literal('rapid'),
  z.literal('untimed'),
  z.literal('bullet'),
]);

export type GameTimeClass = z.infer<typeof gameTimeClassRecord>;

export type ChessGameTimeMap = {
  [k in GameTimeClass]: number;
};

//TODO - convert all to zod
export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  bullet: 60000,
  blitz: 300000,
  rapid: 600000,
  untimed: -1,
};
