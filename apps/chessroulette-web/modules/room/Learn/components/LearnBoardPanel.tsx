import { Button } from 'apps/chessroulette-web/components/Button';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from 'apps/chessroulette-web/components/FreeBoardNotation';
import { Tabs } from 'apps/chessroulette-web/components/Tabs';
import { LearnActivityState } from '../../activity/reducer';
import { FenPreview } from './FenPreview';
import { useLearnActivitySettings } from '../useLearnActivitySettings';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from 'apps/chessroulette-web/components/PgnInputBox';
import { ChaptersTab, ChaptersTabProps } from '../chapters/ChaptersTab';

type Props = {
  state: LearnActivityState['activityState'];
  onImport: PgnInputBoxProps['onChange'];
  onUseChapter: ChaptersTabProps['onUseChapter'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
};

export const LearnBoardPanel = ({
  state: { history, chaptersMap, fen },
  onImport,
  onHistoryNotationDelete,
  onHistoryNotationRefocus,
  onUseChapter,
}: Props) => {
  const settings = useLearnActivitySettings();

  return (
    <Tabs
      containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 soverflow-hidden rounded-lg shadow-2xl"
      headerContainerClassName="flex gap-3 pb-3 border-b border-slate-500"
      contentClassName="flex-1 flex min-h-0"
      currentIndex={0}
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
              Notation
            </Button>
          ),
          renderContent: () => (
            <div className="flex flex-col flex-1 gap-2 bg-slate-700 min-h-0">
              <FreeBoardNotation
                history={history.moves}
                focusedIndex={history.focusedIndex}
                onDelete={onHistoryNotationDelete}
                onRefocus={onHistoryNotationRefocus}
              />
              <FenPreview fen={fen} />
            </div>
          ),
        },
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
              renderContent: () => (
                <ChaptersTab
                  chaptersMap={chaptersMap}
                  className="min-h-0"
                  onUseChapter={onUseChapter}
                />
              ),
            }
          : undefined,
        settings.canImport
          ? {
              renderHeader: (p) => (
                <Button
                  onClick={p.focus}
                  size="sm"
                  className={`bg-slate-600 font-bold hover:bg-slate-800 ${
                    p.isFocused && 'bg-slate-800'
                  }`}
                >
                  Import
                </Button>
              ),
              renderContent: (p) => (
                <PgnInputBox
                  containerClassName="flex-1 h-full"
                  contentClassName="p-3 bg-slate-600 rounded-b-lg"
                  onChange={(input, type) => {
                    onImport(input, type);
                    p.focus(0);
                  }}
                />
              ),
            }
          : undefined,
      ]}
    />
  );
};
