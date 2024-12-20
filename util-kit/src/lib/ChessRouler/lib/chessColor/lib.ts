import {
  BlackColor,
  ChessColor,
  LongChessColor,
  ShortChessColor,
  WhiteColor,
} from './types';
import { getRandomInt } from '../../../misc';

export const isShortChessColor = (s: string): s is ShortChessColor =>
  s === 'b' || s === 'w';

export const isLongChessColor = (s: string): s is LongChessColor =>
  s === 'black' || s === 'white';

export const isChessColor = (
  s: string
): s is ShortChessColor | LongChessColor =>
  isShortChessColor(s) || isLongChessColor(s);

export const toShortColor = (
  c: ShortChessColor | LongChessColor
): ShortChessColor => c[0] as ShortChessColor;

export const toLongColor = (
  c: ShortChessColor | LongChessColor
): LongChessColor => (c === 'b' ? 'black' : 'white');

export const isWhiteColor = (c: ChessColor): c is WhiteColor =>
  toShortColor(c) === 'w';

export const isBlackColor = (c: ChessColor): c is BlackColor =>
  toShortColor(c) === 'b';

export const areColorsEqual = (a: ChessColor, b: ChessColor) =>
  toShortColor(a) === toShortColor(b);

export const getRandomColor = (): ShortChessColor =>
  (['w', 'b'] as const)[getRandomInt(0, 1)];
