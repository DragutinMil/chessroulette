import z from 'zod';
export type GameState = 'pending' | 'ongoing' | 'complete';
export const gameTypeRecord = z.union([
  z.literal('blitz'),
  z.literal('rapid'),
  z.literal('untimed'),
  z.literal('flash'),
]);

export type GameType = z.infer<typeof gameTypeRecord>;

export type ChessGameTimeMap = {
  [k in GameType]: number;
};

//TODO - convert all to zod
export const chessGameTimeLimitMsMap: ChessGameTimeMap = {
  flash: 10000,
  blitz: 60000,
  rapid: 300000,
  untimed: -1,
};
