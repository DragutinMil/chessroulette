import { Button } from 'apps/chessroulette-web/components/Button';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from 'apps/chessroulette-web/components/FreeBoardNotation';
import { Tabs } from 'apps/chessroulette-web/components/Tabs';
import {
  Chapter,
  ChapterState,
  LearnActivityState,
} from '../../activity/reducer';
import { FenPreview } from './FenPreview';
import { useLearnActivitySettings } from '../useLearnActivitySettings';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from 'apps/chessroulette-web/components/PgnInputBox';
import { ChaptersTab, ChaptersTabProps } from '../chapters/ChaptersTab';
import { ChessFEN } from '@xmatter/util-kit';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { CreateChapteViewProps } from '../chapters/CreateChapterView';

type Props = {
  // state: LearnActivityState['activityState'];
  fen: ChessFEN;
  notation: ChapterState['notation'];
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;

  onImport: PgnInputBoxProps['onChange'];
  onUseChapter: ChaptersTabProps['onUseChapter'];
  onCreateChapter: ChaptersTabProps['onCreateChapter'];
  onDeleteChapter: ChaptersTabProps['onDeleteChapter'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
};

export const WidgetPanel = ({
  // state: { history, chaptersMap, fen },
  // state: { chaptersMap, hi },
  // fen,
  // notation,
  // state: {},
  chaptersMap,
  chaptersMapIndex,
  onImport,
  onHistoryNotationDelete,
  onHistoryNotationRefocus,
  onUseChapter,
  onCreateChapter,
  onDeleteChapter,
}: Props) => {
  const settings = useLearnActivitySettings();
  const updateableSearchParams = useUpdateableSearchParams();

  if (settings.isInstructor) {
    return (
      <Tabs
        containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 soverflow-hidden rounded-lg shadow-2xl"
        headerContainerClassName="flex gap-3 pb-3 border-b border-slate-500"
        contentClassName="flex-1 flex min-h-0"
        currentIndex={Number(updateableSearchParams.get('tab') || 0)}
        onTabChange={(tabIndex) => {
          updateableSearchParams.set((prev) => ({
            ...prev,
            tab: String(tabIndex),
          }));
        }}
        renderContainerHeader={({ tabs }) => (
          <div className="flex flex-row gap-3 pb-3 border-b border-slate-500">
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
                Chapter Notation
              </Button>
            ),
            renderContent: () => (
              <div className="flex flex-col flex-1 gap-2 bg-slate-700 min-h-0">
                {/* TODO: bring back */}
                {/* <FreeBoardNotation
                history={history.moves}
                focusedIndex={history.focusedIndex}
                onDelete={onHistoryNotationDelete}
                onRefocus={onHistoryNotationRefocus}
              />
              <FenPreview fen={fen} /> */}
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
          settings.isInstructor
            ? {
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
                    className="min-h-0"
                    onUseChapter={onUseChapter}
                    onCreateChapter={onCreateChapter}
                    onDeleteChapter={onDeleteChapter}
                    tabsNav={p.nav}
                  />
                ),
              }
            : undefined,
        ]}
      />
    );
  }

  return (
    <div className={`flex flex-col w-full`}>
      <div className="min-h-0 overflow-scroll">
        {/* <FreeBoardNotation
          history={notation?.history}
          focusedIndex={notation?.focusedIndex}
          onDelete={onHistoryNotationDelete}
          onRefocus={onHistoryNotationRefocus}
        />
        <FenPreview fen={fen} /> */}
      </div>
    </div>
  );
};
