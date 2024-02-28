import React from 'react';
import { PreviewChessboard, PreviewChessboardProps } from './PreviewChessboard';
import { useBoardTheme } from '../Chessboard/useBoardTheme';

export const PreviewChessboardContainer = (props: PreviewChessboardProps) => {
  const boardTheme = useBoardTheme();

  return (
    <PreviewChessboard
      darkSquareColor={boardTheme.darkSquare}
      lightSquareColor={boardTheme.lightSquare}
      {...props}
    />
  );
};
