import { useEffect, useState } from 'react';
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { ChapterState } from '../../../activity/reducer';
import {
  ChessFEN,
  ChessFENBoard,
  FreeBoardHistory,
  noop,
} from '@xmatter/util-kit';
import {
  EditChapterStateView,
  EditChapterStateViewProps,
} from './EditChapterStateView';

// export type CreateChapterState = Pick<ChapterState, ''>

export type CreateChapteViewProps = {
  // defaultChapterName: string;
  // onUpdateBoardFen: (fen: ChessFEN) => void;
  // onClearArrowsAndCircles: () => void;
  // renderSubmit: (state: ChapterState) => React.ReactNode;

  // Board Logic
  // boardFen: ChessFEN;
  onToggleBoardEditor: EditChapterStateViewProps['onToggleBoardEditor'];
  isBoardEditorShown: EditChapterStateViewProps['isBoardEditorShown'];

  state: EditChapterStateViewProps['state'];
  onUpdate: EditChapterStateViewProps['onUpdate'];
};

export const CreateChapterView = ({
  // boardFen,
  // defaultChapterName,
  // onToggleBoardEditor,
  // isBoardEditorShown,
  // renderSubmit,

  // Deprecate
  // onUpdateBoardFen,
  // onClearArrowsAndCircles,
  ...props
}: CreateChapteViewProps) => {
  // const [state, setState] = useState<ChapterState>({
  //   // fen: boardFen,
  //   startingFen: boardFen,
  //   name: defaultChapterName,
  //   notation: {
  //     // startingFen: boardFen,
  //     focusedIndex: FreeBoardHistory.getStartingIndex(),
  //     history: [],
  //   },
  //   arrowsMap: {},
  //   circlesMap: {},
  //   orientation: 'white', // TODO: This should come from outside
  // });

  // useEffect(() => {
  //   setState((prev) => ({
  //     ...prev,
  //     name: defaultChapterName,
  //     fen: boardFen,
  //   }));
  // }, [boardFen, defaultChapterName]);

  return (
    <EditChapterStateView
      // onToggleBoardEditor={() => props.o}
      // isBoardEditorShown={isBoardEditorShown}
      {...props}
      // state={state}
      // onUpdate={(s) => {
      //   if (s.startingFen) {
      //     onUpdateBoardFen(s.startingFen);
      //   } else if (s.name) {
      //     const { name } = s;
      //     setState((prev) => ({
      //       ...prev,
      //       name,
      //     }));
      //   }
      // }}
    />
    // {/* {renderSubmit(props.state)} */}
  );
};
