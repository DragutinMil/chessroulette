import { useMemo } from 'react';
import { ChessFENBoard, toLongColor } from '@xmatter/util-kit';
import { ChapterState } from '../movex';

type Props = {
  chapter: ChapterState;
  className?: string;
};

export const ChapterDisplayView = ({ chapter, className }: Props) => {
  const turn = useMemo(
    () => toLongColor(new ChessFENBoard(chapter.displayFen).getFenState().turn),
    [chapter.displayFen]
  );

  return (
    <div className={`flex gap-2 ${className}`}>
      <span className="font-bold">{chapter.name}</span>
      <span className="capitalize">{turn} to move</span>
    </div>
  );
};
