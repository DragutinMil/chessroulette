import type { Meta, StoryObj } from '@storybook/react';
import { InputRecord, MainTimeLeft, Data } from './MainTimeLeft';


const meta: Meta<typeof MainTimeLeft> = {
  component: MainTimeLeft,
  title: 'MainTimeLeft',
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
type Story = StoryObj<typeof MainTimeLeft>;

import one from './data/sep32024.json';

export const One: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={one as Data} />;
  },
};

import two from './data/2.json';

export const Two: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={two as Data} />;
  },
};
