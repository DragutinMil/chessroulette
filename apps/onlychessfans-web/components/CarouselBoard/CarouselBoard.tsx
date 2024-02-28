'use client';

import { ChessFEN, pgnToFens } from 'apps/onlychessfans-web/lib/util';
import {
  PreviewChessboard,
  PreviewChessboardProps,
} from '../PreviewChessboard/PreviewChessboard';
import { useEffect, useState } from 'react';
import { useInterval } from './useInterval';

type Props = Omit<PreviewChessboardProps, 'fen'> & {
  fens: ChessFEN[];
  interval?: number;
};

export const CarouselBoard = ({ fens, interval = 500 }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useInterval(
    () => {
      setCurrentIndex((prev) => prev + 1);
    },
    currentIndex + 1 < fens.length ? interval : undefined
  );

  // useEffect(() => {
  //   const fens = ;

  //   console
  // }, []);

  // useEffect(() => {
  //   setTimeout(() => {
  //     if (currentIndex < props.fens)
  //   }, 2 * 1000);
  // }, [currentIndex, props.fens])

  return (
    <PreviewChessboard
      fen={fens[currentIndex]}
      darkSquareColor="rgba(0, 163, 255, .4)"
    />
  );
};
