import { ChessFENBoard, DistributiveOmit } from '@xmatter/util-kit';
import {
  ChessboardContainer,
  ChessboardContainerProps,
  useBoardTheme,
} from '../../Chessboard';

type Props = DistributiveOmit<ChessboardContainerProps, 'boardTheme'>;

/**
 * This is a free board where there are no rules and magical moves are possible!
 *
 * @param param0
 * @returns
 */
export const Freeboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  ...props
}: Props) => (
  <ChessboardContainer fen={fen} boardTheme={useBoardTheme()} {...props} />
);
