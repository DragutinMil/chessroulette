import type { Meta, StoryObj, StoryFn } from '@storybook/react';
import { Freeboard } from './Freeboard';

const meta: Meta<typeof Freeboard> = {
  component: Freeboard,
  title: 'Freeboard',
};

export default meta;
type Story = StoryObj<typeof Freeboard>;

export const Main: Story = {
  args: {
    sizePx: 500,
    // playingColor: 'black',
    // showAnnotations: true,
  },
};