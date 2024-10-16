import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import useInstance from '@use-it/instance';
import { themes } from 'apps/chessroulette-web/hooks/useTheme/defaultTheme';
import { ChessFENBoard } from '@xmatter/util-kit';
import { ChessboardContainer } from './ChessboardContainer';

const meta: Meta<typeof ChessboardContainer> = {
  component: ChessboardContainer,
  title: 'ChessboardContainer',
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
          try {
            chessFenBoardInstance.move(m);

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
