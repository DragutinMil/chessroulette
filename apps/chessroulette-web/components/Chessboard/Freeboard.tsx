import { ChessFENBoard } from '@xmatter/util-kit';
import {
  ChessboardContainerWithSize,
  ChessboardContainerWithSizeProps,
} from './ChessboardContainerWithSize';

type Props = ChessboardContainerWithSizeProps;

export const Freeboard = ({
  fen = ChessFENBoard.STARTING_FEN,
  ...props
}: Props) => <ChessboardContainerWithSize fen={fen} {...props} />;
