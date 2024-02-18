import { Chapter } from '../../activity/reducer';
import { noop } from '@xmatter/util-kit';

export type Props = {
  chapter: Chapter;
  onUse: () => void;
};

export const ChapterItem = ({ chapter, onUse = noop }: Props) => {
  return (
    <div
      key={chapter.id}
      className="flex flex-1 flex-col gap-2 pt-2 hover:cursor-pointer hover:bg-slate-600 p-2 py-3 border-b last:border-0 border-slate-400"
      onClick={onUse}
    >
      {chapter.name}
    </div>
  );
};
