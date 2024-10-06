import type { Meta, StoryObj } from '@storybook/react';
import {
  ChessColor,
  ChessFEN,
  ChessFENBoard,
  ShortChessColor,
  swapColor,
  toShortColor,
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
    const [state, setState] = useState<{
      fen: ChessFEN;
      turn: ShortChessColor;
    }>({
      fen: argFen,
      turn: 'w',
    });
    // const chessFenBoardInstance = useInstance<ChessFENBoard>(
    //   new ChessFENBoard(state.fen)
    // );

    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    return (
      <>
        <Playboard
          {...args}
          fen={state.fen}
          canPlay
          turn={state.turn}
          playingColor={state.turn}
          onMove={(_, nextFen) => {
            setState((prev) => ({
              ...prev,
              fen: nextFen,
              turn: toShortColor(swapColor(state.turn)),
            }));
          }}
        />
        <div className="pt-2" />
        <FenPreview fen={state.fen} className="pt-2" />
      </>
    );
  },
};

export const PlaySideBySide: Story = {
  args: {
    sizePx: 500,
    fen: ChessFENBoard.STARTING_FEN,
    // boardTheme: themes.chessroulette.board,
    // boardOrientation: 'w',
  },
  render: ({ fen: argFen, ...args }) => {
    const [state, setState] = useState<{
      fen: ChessFEN;
      turn: ShortChessColor;
    }>({
      fen: argFen,
      turn: 'w',
    });
    // const chessFenBoardInstance = useInstance<ChessFENBoard>(
    //   new ChessFENBoard(state.fen)
    // );

    useEffect(() => {
      setState((prev) => ({ ...prev, fen: argFen }));
    }, [argFen]);

    return (
      <div className="w-full h-full">
        <div className="flex flex-1 gap-4 contetnt-between">
          <Playboard
            {...args}
            fen={state.fen}
            canPlay
            playingColor="w"
            turn={state.turn}
            onMove={(_, nextFen) => {
              setState((prev) => ({
                ...prev,
                fen: nextFen,
                turn: swapColor(state.turn),
              }));
            }}
          />
          <Playboard
            {...args}
            fen={state.fen}
            playingColor="b"
            canPlay
            turn={state.turn}
            onMove={(_, nextFen) => {
              console.log('[story] on move???');
              setState((prev) => ({
                ...prev,
                fen: nextFen,
                turn: swapColor(state.turn),
              }));
            }}
          />
        </div>

        <div className="pt-2" />
        <div className="flex-1 flex items-center justify-center">
          <FenPreview fen={state.fen} className="pt-2" />
        </div>
      </div>
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
    const [state, setState] = useState<{
      fen: ChessFEN;
      turn: ShortChessColor;
    }>({
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
              turn: toShortColor(swapColor(state.turn)),
            }));
          }}
        />
        <div className="pt-2" />
        <FenPreview fen={state.fen} className="pt-2" />
      </>
    );
  },
};
