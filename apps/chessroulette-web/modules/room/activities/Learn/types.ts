import { ChessColor, ChessFEN } from '@xmatter/util-kit';
import {
  ArrowsMap,
  CirclesMap,
} from 'apps/chessroulette-web/components/Chessboard/types';

export type LayoutContainerDimensions = {
  width: number;
  height: number;
  verticalPadding: number;
  horizontalPadding: number;
};

export type GenericLayoutExtendedDimensions = {
  container: LayoutContainerDimensions;
  top: LayoutContainerDimensions;
  main: LayoutContainerDimensions;
  bottom: LayoutContainerDimensions;
  center: LayoutContainerDimensions;
  left: LayoutContainerDimensions;
  right: LayoutContainerDimensions;
  isMobile: boolean;
};

export type EditModeState = {
  fen: ChessFEN;
  orientation: ChessColor;
  arrowsMap?: ArrowsMap;
  circlesMap?: CirclesMap;
};
