import { ChessFENBoard, DistributiveOmit } from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
} from './ChessboardContainer';
import { useBoardTheme } from './useBoardTheme';

type Props = DistributiveOmit<ChessboardContainerProps, 'boardTheme'>;

export const Freeboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  ...props
}: Props) => (
  <ChessboardContainer fen={fen} boardTheme={useBoardTheme()} {...props} />
);
