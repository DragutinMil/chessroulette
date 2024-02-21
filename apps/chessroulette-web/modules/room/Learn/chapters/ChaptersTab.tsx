import {
  Chapter,
  ChapterState,
  initialChapterState,
} from '../../activity/reducer';
import { useMemo, useState } from 'react';
import { objectKeys } from 'movex-core-util';
import { ChapterItem } from './ChapterItem';
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { CreateChapterView } from './CreateChapterView';
import { TabsNav } from 'apps/chessroulette-web/components/Tabs';
import { EditChapterView } from './EditChapterView';
import { EditChapterStateView } from './EditChapterStateView';

export type ChaptersTabProps = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number; // The number of chapters in the whole state
  currentLoadedChapterId: Chapter['id'] | undefined;
  className?: string;
  tabsNav: TabsNav;

  // Input Mode
  onActivateInputMode: (s: {
    isBoardEditorShown?: boolean;
    chapterState: ChapterState; // Create or Update Chapter but it will come here!
  }) => void;
  onDeactivateInputMode: () => void;
  onUpdateInputModeState: (
    s: Partial<{
      chapterState: ChapterState;
      isBoardEditorShown?: boolean;
    }>
  ) => void;
  inputModeState: { chapterState?: ChapterState; isBoardEditorShown?: boolean };

  // Chapters Logistics
  onCreateChapter: () => void;
  onUpdateChapter: (id: Chapter['id']) => void;
  onDeleteChapter: (id: Chapter['id']) => void;
  onLoadChapter: (id: Chapter['id']) => void;
};

export const ChaptersTab = ({
  onCreateChapter,
  onUpdateChapter,
  onDeleteChapter,
  onLoadChapter,

  chaptersMapIndex,
  currentLoadedChapterId,
  chaptersMap,
  className,
  tabsNav,
  ...props
}: ChaptersTabProps) => {
  const chaptersList = useMemo(
    () => objectKeys(chaptersMap).map((id) => chaptersMap[id]),
    [chaptersMap]
  );

  const [updatingChapterId, setUpdatingChapterId] = useState<Chapter['id']>();

  // TODO: The Tab system needs a refactoring!

  // Call this to cancel or after a submit to clean up the state
  // Maybe it shouldnt even be here but in the reducer but for now it's good
  // Not doing it for now b/c I need to do it at the end
  // const cleanUpAfterInputStateAndNavigation = () => {
  //   tabsNav.stackBack();

  //   props.onUpdateInputModeState({
  //     ...props.inputModeState,
  //     isBoardEditorShown: false,
  //   });

  //   props.onDeactivateInputMode();
  // }

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {
        [
          <>
            {chaptersList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Wow, So Empty!
              </div>
            ) : (
              <div className="flex-1 overflow-scroll">
                {chaptersList.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    isActive={currentLoadedChapterId === chapter.id}
                    chapter={chapter}
                    onLoadClick={() => onLoadChapter(chapter.id)}
                    onEditClick={() => {
                      setUpdatingChapterId(chapter.id);
                      tabsNav.stackTo(2);

                      props.onActivateInputMode({ chapterState: chapter });
                    }}
                    onDeleteClick={() => onDeleteChapter(chapter.id)}
                  />
                ))}
              </div>
            )}
            <Button
              size="md"
              className="mt-4"
              icon="PlusIcon"
              onClick={() => {
                tabsNav.stackPush();

                props.onActivateInputMode({
                  chapterState: {
                    ...initialChapterState,
                    name: `Chapter ${chaptersMapIndex + 1}`,
                  },
                });
              }}
            >
              Add New Chapter
            </Button>
          </>,

          // CREATE CHAPTER TAB
          <div className="flex-1 flex overflow-scroll">
            {props.inputModeState.chapterState && (
              <div className="flex flex-1 flex-col gap-3 pt-2 sborder-b border-slate-400 overflow-scroll">
                <CreateChapterView
                  onToggleBoardEditor={(show) =>
                    props.onUpdateInputModeState({
                      isBoardEditorShown: show,
                    })
                  }
                  isBoardEditorShown={!!props.inputModeState.isBoardEditorShown}
                  state={props.inputModeState.chapterState}
                  onUpdate={(nextChapterState) =>
                    props.onUpdateInputModeState({
                      chapterState: nextChapterState,
                    })
                  }
                />
                <div className="flex gap-2">
                  <IconButton
                    // size="sm"
                    type="secondary"
                    onClick={() => {
                      tabsNav.stackBack();

                      props.onUpdateInputModeState({
                        ...props.inputModeState,
                        isBoardEditorShown: false,
                      });

                      props.onDeactivateInputMode();
                    }}
                    icon="ArrowLeftIcon"
                  />
                  <Button
                    className="flex-1"
                    onClick={() => {
                      onCreateChapter();

                      // Go back
                      tabsNav.stackPop();

                      // this only if
                      // onToggleBoardEditor(false);
                      props.onUpdateInputModeState({
                        ...props.inputModeState,
                        isBoardEditorShown: false,
                      });

                      props.onDeactivateInputMode();
                      // onClearArrowsAndCircles();
                    }}
                    icon="PlusIcon"
                  >
                    Create Chapter
                  </Button>
                </div>
              </div>
            )}
          </div>,

          // UPDATE CHAPTER TAB
          <div className="flex-1 flex overflow-scroll">
            {updatingChapterId &&
              chaptersMap[updatingChapterId] &&
              props.inputModeState.chapterState && (
                <div className="flex flex-1 flex-col gap-3 pt-2 sborder-b border-slate-400 overflow-scroll">
                  <EditChapterStateView
                    onToggleBoardEditor={(show) =>
                      props.onUpdateInputModeState({
                        isBoardEditorShown: show,
                      })
                    }
                    isBoardEditorShown={
                      !!props.inputModeState.isBoardEditorShown
                    }
                    state={props.inputModeState.chapterState}
                    onUpdate={(nextChapterState) =>
                      props.onUpdateInputModeState({
                        chapterState: nextChapterState,
                      })
                    }
                  />
                  <div className="flex gap-2">
                    <IconButton
                      // size="sm"
                      type="secondary"
                      onClick={() => {
                        tabsNav.stackPop();
                        props.onDeactivateInputMode();
                      }}
                      icon="ArrowLeftIcon"
                    />
                    <Button
                      className="flex-1"
                      // size="sm"
                      onClick={() => {
                        onUpdateChapter(updatingChapterId)
                        // TODO: Bring back
                        // onCreateChapter(nextState.state);
                        // onClearArrowsAndCircles();
                        // Go back
                        tabsNav.stackPop();

                        // this only if
                        // onToggleBoardEditor(false);
                        props.onUpdateInputModeState({
                          ...props.inputModeState,
                          isBoardEditorShown: false,
                        });

                        props.onDeactivateInputMode();
                      }}
                      icon="PencilSquareIcon"
                    >
                      Update Chapter
                    </Button>
                  </div>
                </div>
                // <EditChapterView
                //   boardState={{
                //     ...chaptersMap[editChapterId],
                //     fen: chaptersMap[editChapterId].displayFen,
                //   }}
                //   isBoardEditorShown={!!props.inputModeState.isBoardEditorShown}
                //   onToggleBoardEditor={(show) => {
                //     props.onUpdateInputModeState({
                //       ...props.inputModeState,
                //       isBoardEditorShown: show,
                //     });
                //   }}
                //   className="p-2 py-3 border-b border-slate-400"
                //   chapter={chaptersMap[editChapterId]}
                //   onUse={() => {}}
                //   onUpdate={(state) => {}}
                //   onDelete={() => {}}
                //   onUpdateFen={() => {}}
                //   onClearArrowsAndCircles={() => {}}
                //   renderSubmit={(nextState) => (
                //     <div className="flex gap-2">
                //       <IconButton
                //         // size="sm"
                //         type="secondary"
                //         onClick={() => {
                //           tabsNav.stackPop();
                //           props.onDeactivateInputMode();
                //         }}
                //         icon="ArrowLeftIcon"
                //       />
                //       <Button
                //         className="flex-1"
                //         // size="sm"
                //         onClick={() => {
                //           // TODO: Bring back
                //           // onCreateChapter(nextState.state);
                //           // onClearArrowsAndCircles();

                //           props.onDeactivateInputMode();
                //         }}
                //         icon="PencilSquareIcon"
                //       >
                //         Update Chapter
                //       </Button>
                //     </div>
                //   )}
                // />
              )}
          </div>,
        ][tabsNav.stackIndex]
      }
    </div>
  );
};
