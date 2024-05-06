import { Piece } from 'chess.js';
import {
  BlackColor,
  ChessColor,
  ChessMove,
  WhiteColor,
} from '../../Chess/types';
import { toShortColor } from '../../Chess/lib';

export const isPromotableMove = (m: ChessMove, piece: Piece) => {
  return (
    piece.type === 'p' && // is pawn
    ((piece.color === 'w' && m.to[1] === '8') || // when white is on the 8th rank
      (piece.color === 'b' && m.to[1] === '1')) // when black is on the 1st rank
  );
};

// I don't know why this needs to be typed like this
//  with a function declaration but if it's declared
//  as an anonymous function it throws a tsc error
export function swapColor<C extends ChessColor>(
  c: C
): C extends WhiteColor ? BlackColor : WhiteColor;
export function swapColor<C extends ChessColor>(c: C) {
  return toShortColor(c) === 'w' ? 'black' : 'white';
}
