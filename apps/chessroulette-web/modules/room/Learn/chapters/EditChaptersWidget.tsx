import { Button } from 'apps/chessroulette-web/components/Button';
import { Tabs } from 'apps/chessroulette-web/components/Tabs';
import { CreateChapterView } from './CreateChapterView';
import { ChessFEN, noop } from '@xmatter/util-kit';
import { Chapter, ChapterState } from '../../activity/reducer';
import { EditChaptersTab, EditChaptersTabProps } from './EditChaptersTab';
import { EditChapterItemProps } from './EditChapterView';

type Props = {
  boardState: EditChapterItemProps['boardState'];
  className?: string;
  chaptersMap: Record<Chapter['id'], Chapter>;
  onCreate: (s: ChapterState) => void;
  onUpdateChapter: EditChaptersTabProps['onUpdate'];
  onDeleteChapter: EditChaptersTabProps['onDelete'];
  onUpdateFen: (fen: ChessFEN) => void;
  onUseChapter: (id: Chapter['id']) => void;
  onUseCurrentBoard: () => void;
  onExitEditMode: () => void;
  onClearArrowsAndCircles: () => void;
};

export const EditChaptersWidget = ({
  chaptersMap,
  boardState,
  className,
  onCreate,
  onUpdateFen,
  onUseChapter,
  onUseCurrentBoard = noop,
  onExitEditMode = noop,
  onDeleteChapter,
  onUpdateChapter,
  onClearArrowsAndCircles,
}: Props) => {
  const chaptersCount = Object.keys(chaptersMap).length;

  // console.log('EditChaptersWidget boardState', boardState.fen)

  return (
    <Tabs
      containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 soverflow-hidden rounded-lg shadow-2xl"
      headerContainerClassName="flex gap-3 pb-3 border-b border-slate-500"
      contentClassName="flex-1 flex min-h-0"
      currentIndex={0}
      renderContainerHeader={({ tabs, focus }) => (
        <div className="flex flex-row gap-3 pb-3 border-b border-slate-500">
          {tabs.map((c) => c)}
          <div className="flex-1" />
          <Button
            size="sm"
            type="clear"
            onClick={onExitEditMode}
          >
            Leave
          </Button>
          <Button
            size="sm"
            // type="clear"
            bgColor="green"
            type="custom"
            onClick={onUseCurrentBoard}
            // icon="InboxArrowDownIcon"
          >
            Use Current Board
          </Button>
        </div>
      )}
      tabs={[
        {
          renderHeader: (p) => {
            return (
              <Button
                onClick={p.focus}
                size="sm"
                type="secondary"
                isActive={p.isFocused}
              >
                Create
              </Button>
            );
          },
          renderContent: (p) => {
            return (
              <div className={`flex flex-col spt-4 w-full ${className}`}>
                <div className="flexs flex-0 overflow-scroll">
                  {/* <CreateChapterView
                    boardFen={boardState.fen}
                    defaultChapterName={`Chapter ${chaptersCount + 1}`}
                    onCreate={onCreate}
                    onUpdateFen={onUpdateFen}
                    onClearArrowsAndCircles={onClearArrowsAndCircles}
                  /> */}
                </div>
              </div>
            );
          },
        },
        {
          renderHeader: (p) => {
            return (
              <Button
                onClick={p.focus}
                size="sm"
                type="secondary"
                isActive={p.isFocused}
              >
                Saved Chapters ({chaptersCount})
              </Button>
            );
          },
          renderContent: () => (
            <EditChaptersTab
              chaptersMap={chaptersMap}
              boardState={boardState}
              onUse={onUseChapter}
              onUpdate={onUpdateChapter}
              onDelete={onDeleteChapter}
              onClearArrowsAndCircles={onClearArrowsAndCircles}
              onUpdateFen={onUpdateFen}
            />
          ),
        },
      ]}
    />
  );
};
