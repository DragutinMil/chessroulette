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

import opGame1JSON from './data/op_game1.json';

export const OpGame1: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={opGame1JSON as Data} />;
  },
};


import opGame2JSON from './data/op_game2.json';

export const OpGame2: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={opGame2JSON as Data} />;
  },
};

import opGame3JSON from './data/op_game3.json';

export const OpGame3: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={opGame3JSON as Data} />;
  },
};

import opGame4JSON from './data/op_game4.json';

export const OpGame4: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={opGame4JSON as Data} />;
  },
};

import localGame1JSON from './data/local_game1.json';

export const LocalGame1: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={localGame1JSON as Data} />;
  },
};

import localGame2JSON from './data/local_game2.json';

export const LocalGame2: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={localGame2JSON as Data} />;
  },
};

import localGame4JSON from './data/local_game4.json';

export const LocalGame4: Story = {
  args: {},
  render: () => {
    return <MainTimeLeft data={localGame4JSON as Data} />;
  },
};
