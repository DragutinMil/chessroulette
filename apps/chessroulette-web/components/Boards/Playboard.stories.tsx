import type { Meta, StoryObj } from '@storybook/react';
import {
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  FenBoardPromotionalPieceSymbol,
  pieceSanToFenBoardPieceSymbol,
  swapColor,
} from '@xmatter/util-kit';
import { useEffect, useState } from 'react';
import useInstance from '@use-it/instance';
import { Playboard } from './Playboard';
import { FenPreview } from 'apps/chessroulette-web/modules/room/activities/Learn/components/FenPreview';

const meta: Meta<typeof Playboard> = {
  component: Playboard,
  title: 'Playboard',
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
};

export default meta;
type Story = StoryObj<typeof Playboard>;

export const Main: Story = {
  args: {
    sizePx: 500,
    fen: ChessFENBoard.STARTING_FEN,
    // boardTheme: themes.chessroulette.board,
    // boardOrientation: 'w',
  },
  render: ({ fen: argFen, ...args }) => {
    const [state, setState] = useState<{ fen: ChessFEN; turn: ChessColor }>({
      fen: argFen,
      turn: 'w',
    });
    const chessFenBoardInstance = useInstance<ChessFENBoard>(
      new ChessFENBoard(state.fen)
    );

    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    return (
      <>
        <Playboard
          {...args}
          fen={state.fen}
          playingColor={state.turn}
          onMove={(_, nextFen) => {
            setState((prev) => ({
              ...prev,
              fen: nextFen,
              turn: swapColor(state.turn),
            }));
          }}
        />
        <div className="pt-2" />
        <FenPreview fen={state.fen} className="pt-2" />
      </>
    );
  },
};

export const CheckPromotion: Story = {
  args: {
    sizePx: 500,
    fen: 'rnbqkbnr/ppp1ppPp/8/8/8/8/PPpPP1PP/RNBQKBNR w KQkq - 0 5',
    // boardTheme: themes.chessroulette.board,
    // boardOrientation: 'w',
  },
  render: ({ fen: argFen, ...args }) => {
    const [state, setState] = useState<{ fen: ChessFEN; turn: ChessColor }>({
      fen: argFen,
      turn: 'w',
    });

    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    return (
      <>
        <Playboard
          {...args}
          fen={state.fen}
          playingColor={state.turn}
          onMove={(_, nextFen) => {
            setState((prev) => ({
              ...prev,
              fen: nextFen,
              turn: swapColor(state.turn),
            }));
          }}
        />
        <div className="pt-2" />
        <FenPreview fen={state.fen} className="pt-2" />
      </>
    );
  },
};
