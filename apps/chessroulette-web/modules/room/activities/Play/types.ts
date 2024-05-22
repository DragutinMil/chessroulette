import z from 'zod';
export type GameState = 'pending' | 'ongoing' | 'complete';
export const gameTypeRecord = z.union([
  z.literal('blitz'),
  z.literal('rapid'),
  z.literal('untimed'),
  z.literal('testing'),
  z.literal('bullet'),
]);

export type GameType = z.infer<typeof gameTypeRecord>;

export type ChessGameTimeMap = {
  [k in GameType]: number;
};

//TODO - convert all to zod
export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  testing: 10000,
  bullet: 60000,
  blitz: 300000,
  rapid: 600000,
  untimed: -1,
};
