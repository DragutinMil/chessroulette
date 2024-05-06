import type { Meta, StoryObj } from '@storybook/react';
import {
  ChessFENBoard,
  FenBoardPromotionalPieceSymbol,
  pieceSanToFenBoardPieceSymbol,
} from '@xmatter/util-kit';
import { useEffect, useState } from 'react';
import useInstance from '@use-it/instance';
import { Freeboard } from './Freeboard';

const meta: Meta<typeof Freeboard> = {
  component: Freeboard,
  title: 'Freeboard',
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        // pathname: '/profile',
        // query: {
        //   theme: 'op',
        // },
      },
    },
  },
  // args: {
  //   //👇 Now all Button stories will be primary.
  //   sizePx: 500,
  //   fen: ChessFENBoard.STARTING_FEN,
  // },
};

export default meta;
type Story = StoryObj<typeof Freeboard>;

export const Main: Story = {
  args: {
    sizePx: 500,
    fen: ChessFENBoard.STARTING_FEN,
    // boardTheme: themes.chessroulette.board,
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
      <Freeboard
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
