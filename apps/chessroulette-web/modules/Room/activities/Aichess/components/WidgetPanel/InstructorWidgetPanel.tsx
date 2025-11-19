import React, { useCallback, useMemo } from 'react';
import { Button } from '@app/components/Button';
import { ChessFENBoard, isValidPgn } from '@xmatter/util-kit';
import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { Tabs, TabsRef } from '@app/components/Tabs';
import type { Chapter, ChapterState } from '../../movex/types';
import {
  PgnInputBox,
  PgnInputBoxProps,
} from '@app/components/PgnInputBox/PgnInputBox';
import { ChaptersTab, ChaptersTabProps } from '../../chapters/ChaptersTab';
import { useWidgetPanelTabsNavAsSearchParams } from '../useWidgetPanelTabsNav';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { useUpdateableSearchParams } from '@app/hooks/useSearchParams';
import { ChessEngineWithProvider } from '@app/modules/ChessEngine/ChesEngineWithProvider';
import { Switch } from '@app/components/Switch';
// import { generateGptResponse } from '../../../../../../server.js';
type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;

  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];

  // Engine
  showEngine?: boolean;
  // engine?: EngineData;
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
  | 'currentLoadedChapterId'
>;

export const InstructorWidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      // engine,
      showEngine,
      onImport,
      onQuickImport,
      onHistoryNotationDelete,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    // const settings = useAichessActivitySettings();
    const widgetPanelTabsNav = useWidgetPanelTabsNavAsSearchParams();
    const updateableSearchParams = useUpdateableSearchParams();

    const currentTabIndex = useMemo(
      () => widgetPanelTabsNav.getCurrentTabIndex(),
      [widgetPanelTabsNav.getCurrentTabIndex]
    );

    const onTabChange = useCallback(
      (p: { tabIndex: number }) => {
        widgetPanelTabsNav.setTabIndex(p.tabIndex);
      },
      [widgetPanelTabsNav.setTabIndex]
    );
   

    

    // Instructor
    return (
      <Tabs
        containerClassName="bg-slate-700 p-3 flex flex-col flex-1 min-h-0 rounded-lg shadow-2xl"
        headerContainerClassName="flex gap-3 pb-3"
        contentClassName="flex-1 flex min-h-0 pt-2"
        currentIndex={currentTabIndex}
        onTabChange={onTabChange}
        renderContainerHeader={({ tabs }) => (
          <div className="flex flex-row gap-3 pb-3 border-b border-slate-600">
            {tabs}
            {/* // Only show the Engine switch on the notation tab */}
            {currentTabIndex === 0 && (
              <span className="flex-1 flex justify-end">
                <Switch
                  label="Engine"
                  labelPosition="left"
                  labelClassName="text-slate-400"
                  title="Stockfish 15 Engine"
                  value={showEngine}
                  onUpdate={(s) =>
                    updateableSearchParams.set({ engine: Number(s) })
                  }
                />
              </span>
            )}
          </div>
        )}
        ref={tabsRef}
        tabs={[
          {
            id: 'notation',
            renderHeader: (p) => (
              <Button
                onClick={() => {
                  p.focus();
                  chaptersTabProps.onDeactivateInputMode();
                }}
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
                {showEngine && (
                  <ChessEngineWithProvider
                    gameId={currentLoadedChapterId}
                    fen={currentChapterState.displayFen}
                    canAnalyze
                    onToggle={(s) =>
                      updateableSearchParams.set({ engine: Number(s) })
                    }
                  />
                )}
                <FreeBoardNotation
                  history={currentChapterState.notation?.history}
                  focusedIndex={currentChapterState.notation?.focusedIndex}
                  onDelete={onHistoryNotationDelete}
                  onRefocus={onHistoryNotationRefocus}
                />
                {/* <FenPreview fen={currentChapterState.displayFen} /> */}
                <div className="flex flex-col sitems-center gap-3 hidden md:flex ">
                  <label className="font-bold text-sm text-gray-400">
                    {/* Quick Import */}
                  </label>
                  <Button
                    onClick={() => {
                      const input =
                        '1. e4 d6 2. d3 e5 3. Be3 Nc6 4. Be2 Be7 5. f3 Nf6 6. Nc3 Nb4 7. Qd2 b6 8. O-O-O Be6 9. a3 Nc6 10. Nb5 Nd4 11. Nxd4 exd4 12. Bxd4 c5 13. Bc3 b5 14. Qg5 Nxe4 15. Qxg7 Bf6 16. Qg3 Nxc3 17. bxc3 Bxc3 18. d4 Qf6 19. Bxb5+ Ke7 20. dxc5 Bb2+ 21. Kd2 Qc3+ 22. Ke2 Qxc2+ 23. Kf1 Qxd1+ 24. Qe1 Qxe1+ 25. Kxe1 Rab8 26. Bd3 dxc5 27. Ne2 c4 28. Be4 c3 29. Nxc3 Bxc3+ 30. Kf2 Rb2+ 31. Kg3 Be5+ 32. f4 Rb3+ 33. Bf3 Bc7 34. Re1 Rg8+ 35. Kf2 Bb6+ 36. Kf1 Kf6 37. Be4 Bc4+ 38. Re2 Bxe2+ 39. Kxe2 Re3+ 40. Kf2 Rxe4+ 41. Kf3 Rc4 42. g4 Rg7 43. g5+ Kf5';
                      // const input='r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
                      if (ChessFENBoard.validateFenString(input).ok) {
                        onQuickImport({ type: 'FEN', val: input });
                      } else if (isValidPgn(input)) {
                        onQuickImport({ type: 'PGN', val: input });
                      }
                    }}
                    size="sm"
                    className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                  >
                    Go pgn
                  </Button>
                  {/* <Button
                    onClick={() => {
                      conversation();
                    }}
                    size="sm"
                    className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                  >
                    POST Conversation
                  </Button> */}
                  {/* <Button
                    onClick={() => {
                      conversationGet();
                    }}
                    size="sm"
                    className={`bg-slate-600 font-bold hover:bg-slate-800 `}
                  >
                    GET Conversation
                  </Button> */}
                  {/* <Button
                onClick={() => {
                   sendQuestion()
                }}
                size="sm"
                className={`bg-slate-600 font-bold hover:bg-slate-800 `}
              >
                SEND Question to AI
              </Button> */}
                </div>
              </div>
            ),
          },
          {
            id: 'chapters',
            renderHeader: (p) => (
              <Button
                onClick={() => {
                  p.focus();
                  chaptersTabProps.onDeactivateInputMode();
                }}
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
                onImportInput={onImport}
                {...chaptersTabProps}
              />
            ),
          },
        ]}
      />
    );
  }
);
