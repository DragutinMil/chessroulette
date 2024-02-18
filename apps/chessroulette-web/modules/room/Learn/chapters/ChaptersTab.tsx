import { noop } from '@xmatter/util-kit';
import { Chapter } from '../../activity/reducer';
import { useMemo } from 'react';
import { objectKeys } from 'movex-core-util';
import { ChapterItem } from './ChapterItem';
import { Button } from 'apps/chessroulette-web/components/Button';
import { useCurrentRoomLinks } from '../../hooks/useCurrentLinks';

export type ChaptersTabProps = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  className?: string;
  onUseChapter: (id: Chapter['id']) => void;
};

export const ChaptersTab = ({
  onUseChapter = noop,
  chaptersMap,
  className,
}: ChaptersTabProps) => {
  const currentRoomLinks = useCurrentRoomLinks();

  const chaptersList = useMemo(
    () => objectKeys(chaptersMap).map((id) => chaptersMap[id]),
    [chaptersMap]
  );

  return (
    <div className={`flex flex-col spt-4 w-full ${className}`}>
      <div className="flexs overflow-scroll">
        {chaptersList.map((chapter) => (
          <ChapterItem
            key={chapter.id}
            chapter={chapter}
            onUse={() => onUseChapter(chapter.id)}
          />
        ))}
      </div>
      {chaptersList.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          Wow, So Empty!
        </div>
      )}
      <Button
        size="sm"
        onClick={() => {
          // links.getRoomLink({
          //   id:
          // })
          currentRoomLinks.setForCurrentRoom({
            edit: true,
          });
        }}
      >
        Edit Chapters
      </Button>
    </div>
  );
};
