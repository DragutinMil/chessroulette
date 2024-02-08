import { LONG_HISTORY_WITH_HALF_LAST_TURN } from './specUtils';
import { FBHHistory } from '../types';
import { FreeBoardHistory as FBH } from '../FreeBoardHistory';

describe('Slice History', () => {
  test('Gets an empty history when the index is below starting', () => {
    const actual = FBH.slice(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [-1, 1]
    );

    expect(actual).toEqual([]);
  });

  test('gets only the first move when the index is Starting Index', () => {
    const actual = FBH.slice(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [0, 0]
    );

    expect(actual).toEqual([
      [
        {
          from: 'e2',
          to: 'e4',
          color: 'w',
          san: 'e4',
        },
      ],
    ]);
  });

  test('get the first turn when index is at the first full turn', () => {
    const actual = FBH.slice(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [0, 1]
    );

    expect(actual).toEqual([
      [
        {
          from: 'e2',
          to: 'e4',
          color: 'w',
          san: 'e4',
        },
        {
          from: 'e7',
          to: 'e6',
          color: 'b',
          san: 'e6',
        },
      ],
    ]);
  });

  test('at Half Turn Index ', () => {
    const actual = FBH.slice(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [1, 0]
    );

    expect(actual).toEqual([
      [
        {
          from: 'e2',
          to: 'e4',
          color: 'w',
          san: 'e4',
        },
        {
          from: 'e7',
          to: 'e6',
          color: 'b',
          san: 'e6',
        },
      ],
      [
        {
          from: 'd2',
          to: 'd4',
          color: 'w',
          san: 'd4',
        },
      ],
    ]);
  });

  test('at Full Turn Index ', () => {
    const actual = FBH.slice(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [1, 1]
    );

    expect(actual).toEqual([
      [
        {
          from: 'e2',
          to: 'e4',
          color: 'w',
          san: 'e4',
        },
        {
          from: 'e7',
          to: 'e6',
          color: 'b',
          san: 'e6',
        },
      ],
      [
        {
          from: 'd2',
          to: 'd4',
          color: 'w',
          san: 'd4',
        },
        {
          from: 'd7',
          to: 'd5',
          color: 'b',
          san: 'd5',
        },
      ],
    ]);
  });

  test('gets full history when Index longer than history length', () => {
    const actual = FBH.slice(
      LONG_HISTORY_WITH_HALF_LAST_TURN,
      [19, 1]
    );

    expect(actual).toEqual(LONG_HISTORY_WITH_HALF_LAST_TURN);
  });

  describe('Recursivity', () => {
    test('from first nested branch', () => {
      const nestedHistory = [
        [
          {
            from: 'd2',
            to: 'd4',
            san: 'd4',
            color: 'w',
            branchedHistories: [
              [
                [
                  {
                    isNonMove: true,
                    san: '...',
                    color: 'w',
                    // this: 'yess'
                  },
                  {
                    from: 'b7',
                    to: 'b5',
                    color: 'b',
                    san: 'b5',
                    branchedHistories: [
                      [
                        [
                          {
                            from: 'b2',
                            to: 'b4',
                            color: 'w',
                            san: 'b4',
                          },
                        ],
                      ],
                    ],
                  },
                ],
              ],
            ],
          },
          {
            from: 'd7',
            to: 'd5',
            san: 'd5',
            color: 'b',
          },
        ],
      ] satisfies FBHHistory;

      const actual = FBH.calculateLinearHistoryAtIndex(nestedHistory, [
        0,
        0,
        [[0, 1, [[0, 0]]]],
      ]);

      expect(actual).toEqual([
        {
          from: 'd2',
          to: 'd4',
          san: 'd4',
          color: 'w',
        },
        {
          from: 'b7',
          to: 'b5',
          color: 'b',
          san: 'b5',
        },
        {
          from: 'b2',
          to: 'b4',
          color: 'w',
          san: 'b4',
        },
      ]);
    });
  });
});
