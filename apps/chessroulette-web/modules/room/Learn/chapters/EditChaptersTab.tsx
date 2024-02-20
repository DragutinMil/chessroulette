import { ChessFEN, objectKeys } from '@xmatter/util-kit';
import { Chapter, ChapterState } from '../../activity/reducer';
import { useMemo, useState } from 'react';
import { EditChapterView, EditChapterItemProps } from './EditChapterView';

export type EditChaptersTabProps = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  boardState: EditChapterItemProps['boardState'];
  onUse: (id: Chapter['id']) => void;
  onUpdate: (id: Chapter['id'], state: Partial<ChapterState>) => void;
  onUpdateFen: (fen: ChessFEN) => void;
  onDelete: (id: Chapter['id']) => void;
  onClearArrowsAndCircles: () => void;
};

export const EditChaptersTab = ({
  chaptersMap,
  boardState,
  onUse,
  onUpdate,
  onDelete,
  onUpdateFen,
  onClearArrowsAndCircles,
}: EditChaptersTabProps) => {
  const chaptersList = useMemo(
    () => objectKeys(chaptersMap).map((id) => chaptersMap[id]),
    [chaptersMap]
  );

  const [active, setActive] = useState<Chapter['id']>();

  return (
    <div className={`flex flex-col spt-4 w-full`}>
      <div className="flexs flex-0 overflow-scroll">
        {chaptersList.map((chapter) => (
          // <EditChapterView
          //   key={chapter.id}
          //   boardState={boardState}
          //   className="p-2 py-3 border-b border-slate-400"
          //   chapter={chapter}
          //   // expanded={active === chapter.id}
          //   // onExpand={() => setActive(chapter.id)}
          //   // onCollapse={() => setActive(undefined)}
          //   onUse={() => onUse(chapter.id)}
          //   onUpdate={(state) => onUpdate(chapter.id, state)}
          //   onDelete={() => {
          //     onDelete(chapter.id);
          //   }}
          //   onUpdateFen={onUpdateFen}
          //   onClearArrowsAndCircles={onClearArrowsAndCircles}
          // />
          null
        ))}
      </div>
    </div>
  );
};
