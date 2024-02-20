import { useEffect, useState } from 'react';
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { ChapterState } from '../../activity/reducer';
import {
  ChessFEN,
  ChessFENBoard,
  FreeBoardHistory,
  noop,
} from '@xmatter/util-kit';
import { EditChapterStateView } from './EditChapterStateView';

// export type CreateChapterState = Pick<ChapterState, ''>

export type CreateChapteViewProps = {
  boardFen: ChessFEN;
  defaultChapterName: string;

  // onCreate: (state: ChapterState) => void;
  onUpdateFen: (fen: ChessFEN) => void;
  onClearArrowsAndCircles: () => void;

  renderSubmit: (state: ChapterState) => React.ReactNode;
};

export const CreateChapterView = ({
  boardFen,
  defaultChapterName,
  // onCreate,
  onUpdateFen,
  onClearArrowsAndCircles,
  renderSubmit,
}: CreateChapteViewProps) => {
  const [state, setState] = useState<ChapterState>({
    // fen: boardFen,
    startingFen: boardFen,
    name: defaultChapterName,
    notation: {
      // startingFen: boardFen,
      focusedIndex: FreeBoardHistory.getStartingIndex(),
      history: [],
    },
    arrowsMap: {},
    circlesMap: {},
    orientation: 'white', // TODO: This should come from outside
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      name: defaultChapterName,
      fen: boardFen,
    }));
  }, [boardFen, defaultChapterName]);

  return (
    <div className="flex flex-1 flex-col gap-3 pt-2 sborder-b border-slate-400 overflow-scroll">
      <EditChapterStateView
        state={state}
        onUpdate={(s) => {
          if (s.startingFen) {
            onUpdateFen(s.startingFen);
          } else if (s.name) {
            const { name } = s;
            setState((prev) => ({
              ...prev,
              name,
            }));
          }
        }}
      />
      {/* <div className="flex justify-end gap-2"> */}
      {renderSubmit(state)}
      {/* </div> */}
    </div>
  );
};
