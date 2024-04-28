import { Piece, PieceSymbol } from 'chess.js';
import { FenBoardPieceSymbol } from '../types';
import { PieceSan, ShortChessColor } from '../../Chess/types';

const isUpperCase = (s: string) => s === s.toUpperCase();

export const fenBoardPieceSymbolToDetailedChessPiece = (
  p: FenBoardPieceSymbol
): Piece => ({
  type: p.toLowerCase() as PieceSymbol,
  color: isUpperCase(p) ? 'w' : 'b',
});

export const fenBoardPieceSymbolToPieceSymbol = (
  p: FenBoardPieceSymbol
): PieceSymbol => p.toLowerCase() as PieceSymbol;

export const pieceSanToFenBoardPieceSymbol = (
  p: PieceSan
): FenBoardPieceSymbol => {
  const { color, type } = pieceSanToPiece(p);

  return (
    color === 'b' ? type.toLowerCase() : type.toUpperCase()
  ) as FenBoardPieceSymbol;
};

export const pieceSanToPieceSymbol = (p: PieceSan): PieceSymbol =>
  fenBoardPieceSymbolToPieceSymbol(pieceSanToFenBoardPieceSymbol(p));

export const pieceSanToPiece = (p: PieceSan): Piece => ({
  color: p[0] as ShortChessColor,
  type: p[1].toLowerCase() as PieceSymbol,
});

export const pieceToPieceSan = (p: Piece): PieceSan =>
  `${p.color[0]}${p.type.toLocaleUpperCase()}}` as PieceSan;

export const detailedPieceToPieceSymbol = () => {};
