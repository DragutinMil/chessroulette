import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { FreeBoardNotation } from './FreeBoardNotation';
import { useState } from 'react';
import {
  FBHHistory,
  FBHIndex,
  FreeBoardHistory as FBH,
} from '@xmatter/util-kit';

const meta: Meta<typeof FreeBoardNotation> = {
  component: FreeBoardNotation,
  title: 'FreeBoardNotation',
};

export default meta;
type Story = StoryObj<typeof FreeBoardNotation>;

const BASIC_HISTORY = FBH.pgnToHistory(
  '1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3 Qc7 6. Bd3 Nc6 7. h3'
);

export const LinearHistory: Story = {
  render: () => (
    <div style={{ width: '400px' }}>
      <FreeBoardNotation
        history={BASIC_HISTORY}
        onDelete={action('OnDelete')}
        onRefocus={action('OnRefocus')}
        focusedIndex={[0, 1]}
      />
    </div>
  ),
};

const historyWithOneGenBranch = [
  ...BASIC_HISTORY.slice(0, 1),
  [
    {
      ...BASIC_HISTORY[1][0],
      branchedHistories: [
        [
          [
            {
              isNonMove: true,
              san: '...',
              color: 'w',
            },
            {
              from: 'd7',
              to: 'd6',
              san: 'd6',
              color: 'b',
            },
          ],
        ] as FBHHistory,
      ],
    },
    {
      ...BASIC_HISTORY[1][1],
    },
  ],
  ...BASIC_HISTORY.slice(2, 4),
  [
    BASIC_HISTORY[4][0],
    {
      ...BASIC_HISTORY[4][1],
      branchedHistories: [
        FBH.pgnToHistory('1. e3 c5 2. Nf3 e6 3. d4 d6'),
        FBH.pgnToHistory('1. e4 c5 2. Nf3 e5 3. d3'),
      ],
    },
  ],
  ...BASIC_HISTORY.slice(5),
] as FBHHistory;

export const NestedHistory: Story = {
  render: () => {
    const [currentIndex, setCurrentIndex] = useState<FBHIndex>([0, 1]);

    return (
      <>
        <div className="p-2 border border-slate-600" style={{ width: '400px' }}>
          <FreeBoardNotation
            history={historyWithOneGenBranch}
            onDelete={(p) => {
              console.log('on delete', p);

              action('OnDelete')(p);
            }}
            onRefocus={(p) => {
              console.log('on focus', FBH.renderIndex(p));

              setCurrentIndex(p);
              action('OnRefocus')(p);
            }}
            focusedIndex={currentIndex}
          />
        </div>
        {FBH.renderIndex(currentIndex)}
        {/* {currentIndex.join(' ')} */}
      </>
    );
  },
};
