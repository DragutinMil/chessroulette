import { Button } from 'apps/chessroulette-web/components/Button';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from 'apps/chessroulette-web/components/FreeBoardNotation';
import { Tabs } from 'apps/chessroulette-web/components/Tabs';
import { Chapter, ChapterState } from '../../activity/reducer';
import { FenPreview } from './FenPreview';
import { useLearnActivitySettings } from '../useLearnActivitySettings';
import { PgnInputBoxProps } from 'apps/chessroulette-web/components/PgnInputBox';
import { ChaptersTab, ChaptersTabProps } from '../chapters/ChaptersTab';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;
  currentLoadedChapterId: ChaptersTabProps['currentLoadedChapterId'];

  // Board
  onImport: PgnInputBoxProps['onChange'];

  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
} & Pick<
  ChaptersTabProps,
  | 'onLoadChapter'
  | 'onCreateChapter'
  | 'onDeleteChapter'
  | 'onUpdateChapter'
  | 'onUpdateInputModeState'
  | 'inputModeState'
  | 'onActivateInputMode'
  | 'onDeactivateInputMode'
>;

export const WidgetPanel = ({
  chaptersMap,
  chaptersMapIndex,
  currentLoadedChapterId,
  currentChapterState,
  onImport,
  onHistoryNotationDelete,
  onHistoryNotationRefocus,
  ...chapterTabsProps
}: Props) => {
  const settings = useLearnActivitySettings();
  const updateableSearchParams = useUpdateableSearchParams();

  // Instructor
  if (settings.isInstructor) {
    return (
      <Tabs
        containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 soverflow-hidden rounded-lg shadow-2xl"
        headerContainerClassName="flex gap-3 pb-3"
        contentClassName="flex-1 flex min-h-0"
        currentIndex={Number(updateableSearchParams.get('tab') || 0)}
        onTabChange={(tabIndex) => {
          updateableSearchParams.set((prev) => ({
            ...prev,
            tab: String(tabIndex),
          }));
        }}
        renderContainerHeader={({ tabs }) => (
          <div className="flex flex-row gap-3 pb-3 border-b border-slate-600">
            {tabs}
          </div>
        )}
        tabs={[
          {
            renderHeader: (p) => (
              <Button
                onClick={p.focus}
                size="sm"
                className={`bg-slate-600 font-bold hover:bg-slate-800 ${
                  p.isFocused && 'bg-slate-800'
                }`}
              >
                Notation
              </Button>
            ),
            renderContent: () => (
              <div className="flex flex-col flex-1 gap-2 min-h-0">
                <FreeBoardNotation
                  history={currentChapterState.notation?.history}
                  focusedIndex={currentChapterState.notation?.focusedIndex}
                  onDelete={onHistoryNotationDelete}
                  onRefocus={onHistoryNotationRefocus}
                />
                <FenPreview fen={currentChapterState.displayFen} />
              </div>
            ),
          },
          // settings.canImport
          //   ? {
          //       renderHeader: (p) => (
          //         <Button
          //           onClick={p.focus}
          //           size="sm"
          //           className={`bg-slate-600 font-bold hover:bg-slate-800 ${
          //             p.isFocused && 'bg-slate-800'
          //           }`}
          //         >
          //           Import
          //         </Button>
          //       ),
          //       renderContent: (p) => (
          //         <PgnInputBox
          //           containerClassName="flex-1 h-full"
          //           contentClassName="p-3 bg-slate-600 rounded-b-lg"
          //           onChange={(input, type) => {
          //             onImport(input, type);
          //             p.focus(0);
          //           }}
          //         />
          //       ),
          //     }
          //   : undefined,
          {
            renderHeader: (p) => (
              <Button
                onClick={p.focus}
                size="sm"
                className={`bg-slate-600 font-bold hover:bg-slate-800 ${
                  p.isFocused && 'bg-slate-800'
                }`}
              >
                Chapters ({Object.keys(chaptersMap).length})
              </Button>
            ),
            renderContent: (p) => (
              <ChaptersTab
                chaptersMap={chaptersMap}
                chaptersMapIndex={chaptersMapIndex}
                currentLoadedChapterId={currentLoadedChapterId}
                className="min-h-0"
                tabsNav={p.nav}
                {...chapterTabsProps}
              />
            ),
          },
        ]}
      />
    );
  }

  // Student
  return (
    <div className="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl">
      <FreeBoardNotation
        history={currentChapterState.notation?.history}
        focusedIndex={currentChapterState.notation?.focusedIndex}
        onDelete={onHistoryNotationDelete}
        onRefocus={onHistoryNotationRefocus}
      />
      <FenPreview fen={currentChapterState.displayFen} />
    </div>
  );
};
