import { ChessArrowId, ChessCircleId } from '@xmatter/util-kit';
import { Square } from 'chess.js';

export type ArrowDrawTuple = [from: Square, to: Square, hex?: string];
export type ArrowsMap = Record<ChessArrowId, ArrowDrawTuple>;

export type CircleDrawTuple = [at: Square, hex: string];
export type CirclesMap = Record<ChessCircleId, CircleDrawTuple>;

export type SquareMap = Record<Square, undefined>;
