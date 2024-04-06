import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import {
  ChessFENBoard,
  FenBoardPromotionalPieceSymbol,
  fenBoardPieceSymbolToPieceSymbol,
  pieceSanToFenBoardPieceSymbol,
  pieceToPieceSan,
} from '@xmatter/util-kit';
import { ChessboardContainer } from './ChessboardContainer';
import { themes } from 'apps/chessroulette-web/hooks/useTheme/defaultTheme';
import { useEffect, useState } from 'react';
import useInstance from '@use-it/instance';

const meta: Meta<typeof ChessboardContainer> = {
  component: ChessboardContainer,
  title: 'ChessboardContainer',
  // args: {
  //   //👇 Now all Button stories will be primary.
  //   sizePx: 500,
  //   fen: ChessFENBoard.STARTING_FEN,
  // },
};

export default meta;
type Story = StoryObj<typeof ChessboardContainer>;

export const Freeboard: Story = {
  args: {
    sizePx: 500,
    fen: ChessFENBoard.STARTING_FEN,
    boardTheme: themes.chessroulette.board,
    boardOrientation: 'b',
  },
  render: ({ fen: argFen, ...args }) => {
    const [fen, setFen] = useState(argFen);
    const chessFenBoardInstance = useInstance<ChessFENBoard>(
      new ChessFENBoard(fen)
    );

    useEffect(() => {
      setFen(argFen);
    }, [argFen]);

    return (
      <ChessboardContainer
        {...args}
        fen={fen}
        onMove={(m) => {
          // setState((prev) => prev + 1);

          try {
            chessFenBoardInstance.move(
              m.from,
              m.to,
              m.promoteTo
                ? (pieceSanToFenBoardPieceSymbol(
                    m.promoteTo
                  ) as FenBoardPromotionalPieceSymbol)
                : undefined
            );

            setFen(chessFenBoardInstance.fen);

            return true;
          } catch (e) {
            console.log('Move Error');

            return false;
          }
        }}
      />
    );
  },
};
