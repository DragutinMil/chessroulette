import { useEffect, useState } from 'react';
import { Chapter, ChapterState } from '../../activity/reducer';
import { EditChapterStateView } from './views/EditChapterStateView';
import { ChessFEN } from '@xmatter/util-kit';
import { EditModeState } from '../types';
import { CreateChapteViewProps } from './views/CreateChapterView';

export type EditChapterItemProps = {
  chapter: Chapter;
  boardState: EditModeState;
  onUse: () => void;
  onDelete: () => void;
  onUpdate: (s: Partial<ChapterState>) => void;
  onUpdateFen: (fen: ChessFEN) => void;
  onClearArrowsAndCircles: () => void;
  className?: string;
  renderSubmit: (state: InputState) => React.ReactNode;

  onToggleBoardEditor: CreateChapteViewProps['onToggleBoardEditor'];
  isBoardEditorShown: CreateChapteViewProps['isBoardEditorShown'];
};

const toChapterState = (c: Chapter): ChapterState => {
  const { id, ...chapterState } = c;

  return chapterState;
};

const areChapterStatesEqual = (a: ChapterState, b: ChapterState) =>
  a.displayFen === b.displayFen &&
  a.name === b.name &&
  a.arrowsMap === b.arrowsMap &&
  a.circlesMap === b.circlesMap;
// TODO: should this involve more details in the comparison?

const calcUncommited = ({
  chapter,
  uncommited,
  nextPartial,
}: {
  chapter: ChapterState;
  uncommited: ChapterState;
  nextPartial: Partial<ChapterState>;
}) => {
  const nextState = {
    ...uncommited,
    ...nextPartial,
  };

  return {
    isChanged: !areChapterStatesEqual(nextState, chapter),
    state: nextState,
  };
};

type InputState = {
  isChanged: boolean;
  state: ChapterState;
};

export const EditChapterView = ({
  chapter,
  boardState,
  onUse,
  onUpdate,
  onDelete,
  onClearArrowsAndCircles,
  onUpdateFen,
  renderSubmit,
  className,
  ...props
}: EditChapterItemProps) => {
  const [uncommited, setUncommited] = useState<InputState>({
    isChanged: false,
    state: toChapterState(chapter),
  });

  useEffect(() => {
    setUncommited((prev) => {
      if (areChapterStatesEqual(uncommited.state, chapter)) {
        return {
          isChanged: false,
          state: toChapterState(chapter),
        };
      }

      return prev;
    });
  }, [chapter]);

  // Update the uncommited based on the given Board State
  useEffect(() => {
    setUncommited((prev) =>
      calcUncommited({
        nextPartial: boardState,
        chapter,
        uncommited: prev.state,
      })
    );
  }, [chapter, boardState]);

  return (
    <div className="flex flex-1 flex-col gap-3 pt-2 sborder-b border-slate-400 overflow-scroll">
      <EditChapterStateView
        state={uncommited.state}
        isBoardEditorShown={props.isBoardEditorShown}
        onToggleBoardEditor={props.onToggleBoardEditor}
        onUpdate={(nextPartialState) => {
          setUncommited(
            calcUncommited({
              nextPartial: nextPartialState,
              chapter,
              uncommited: uncommited.state,
            })
          );
        }}
      />
      {renderSubmit(uncommited)}
    </div>
  );
};
