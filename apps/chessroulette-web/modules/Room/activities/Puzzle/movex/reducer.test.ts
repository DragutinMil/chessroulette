// prvo zajednicki activities modul - kao u app-u, inace kruzni import ostavi reducer undefined
import '../../movex';
import { ChessFENBoard, uciToChessMove } from '@xmatter/util-kit';
import { reducer } from './reducer';
import { initialDefaultChapter, initialPuzzleActivityState } from './state';
import type { PuzzleActivityState } from './types';

// pozicija iz puzzle play moda koja je oborila app - crni pesak na g2, engine igra g2g1n
const BEFORE_PROMOTION_FEN = '8/8/8/8/2P5/5K2/6pk/R7 b - - 0 59';

const createState = (displayFen: string): PuzzleActivityState => ({
  ...initialPuzzleActivityState,
  activityState: {
    ...initialPuzzleActivityState.activityState,
    chaptersMap: {
      [initialDefaultChapter.id]: {
        ...initialDefaultChapter,
        displayFen,
        orientation: 'w',
        notation: {
          ...initialDefaultChapter.notation,
          startingFen: displayFen,
        },
      },
    },
  },
});

const loadedChapter = (s: PuzzleActivityState) =>
  s.activityState.chaptersMap[s.activityState.loadedChapterId];

describe('Puzzle reducer - loadedChapter:addMove with promotion', () => {
  test('Engine knight underpromotion (g2g1n) gives a valid FEN with a black knight on g1', () => {
    const prev = createState(BEFORE_PROMOTION_FEN);

    const next = reducer(prev, {
      type: 'loadedChapter:addMove',
      payload: uciToChessMove('g2g1n', 'b'),
    }) as PuzzleActivityState;

    const { displayFen } = loadedChapter(next);
    expect(displayFen.split(' ')[0]).toBe('8/8/8/8/2P5/5K2/7k/R5n1');
    expect(() => new ChessFENBoard(displayFen)).not.toThrow();
  });

  test('Promotion move without a piece is rejected and never stores an invalid FEN', () => {
    const prev = createState(BEFORE_PROMOTION_FEN);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const next = reducer(prev, {
      type: 'loadedChapter:addMove',
      payload: { from: 'g2', to: 'g1' },
    });

    expect(next).toBe(prev);
    errorSpy.mockRestore();
  });
});
