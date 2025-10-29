import z from 'zod';

export const gameTimeClassRecord = z.union([
  z.literal('blitz3'),
  z.literal('blitz3plus2'),
  z.literal('blitz'),
  z.literal('blitzplus2'),
  z.literal('bulletplus1'),
  z.literal('bullet2plus1'),
  z.literal('rapid'),
  z.literal('untimed'),
  z.literal('bullet'),
  z.literal('bullet2'),
]);

export type GameTimeClass = z.infer<typeof gameTimeClassRecord>;
