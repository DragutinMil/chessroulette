import { ChessFENBoard, DistributiveOmit } from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  useBoardTheme,
} from '../../Chessboard';

type Props = DistributiveOmit<ChessboardContainerProps, 'boardTheme'>;

export const Freeboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  ...props
}: Props) => (
  <ChessboardContainer fen={fen} boardTheme={useBoardTheme()} {...props} />
);
