import { ChessFEN, ChessFENBoard } from '@xmatter/util-kit';
import {
  Chapter,
  ChapterState,
  LearnActivityState,
  initialChapterState,
} from '../../activity/reducer';
import { useMemo, useState } from 'react';
import { objectKeys } from 'movex-core-util';
import { ChapterItem } from './ChapterItem';
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { CreateChapteViewProps, CreateChapterView } from './CreateChapterView';
import { TabsNav } from 'apps/chessroulette-web/components/Tabs';
import { EditChapterView } from './EditChapterView';
import { InputState } from '../LearnActivity';

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
  onLoadChapter: (id: Chapter['id']) => void;
  onDeleteChapter: (id: Chapter['id']) => void;
  onCreateChapter: () => void;

  // Board Logic
  // onUpdateBoardFen: (fen: ChessFEN) => void;
  // onToggleBoardEditor: CreateChapteViewProps['onToggleBoardEditor'];
  // isBoardEditorShown: CreateChapteViewProps['isBoardEditorShown'];
};

export const ChaptersTab = ({
  onLoadChapter,
  onCreateChapter,
  onDeleteChapter,
  // onToggleBoardEditor,
  chaptersMapIndex,
  currentLoadedChapterId,
  chaptersMap,
  className,
  tabsNav,
  ...props
}: ChaptersTabProps) => {
  // const currentRoomLinks = useCurrentRoomLinks();
  // const chaptersCount = Object.keys(chaptersMap).length;

  const chaptersList = useMemo(
    () => objectKeys(chaptersMap).map((id) => chaptersMap[id]),
    [chaptersMap]
  );

  // const searchParams = useSearchParams();
  // const isNewChapterParamsSet = searchParams.get('newChapter') === '1';

  // useEffect(() => {
  //   console.log('nav', tabsNav.stackIndex);
  // }, [tabsNav]);

  const [editChapterId, setEditChapterId] = useState<string>();

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
                      setEditChapterId(chapter.id);
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
              Create New Chapter
            </Button>
          </>,
          <div className="flex-1 flex overflow-scroll">
            {props.inputModeState.chapterState && (
              <div className="flex flex-1 flex-col gap-3 pt-2 sborder-b border-slate-400 overflow-scroll">
                <CreateChapterView
                  // defaultChapterName={`Chapter ${chaptersMapIndex + 1}`}
                  // onToggleBoardEditor={onToggleBoardEditor}
                  // isBoardEditorShown={props.isBoardEditorShown}
                  // boardFen={ChessFENBoard.STARTING_FEN}
                  // onUpdateBoardFen={props.onUpdateBoardFen}
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
                  // onCreate={onCreateChapter}
                  // onUpdateFen={(s) => {
                  //   console.log('update', s)
                  // }}
                  // onClearArrowsAndCircles={() => {}}
                  // renderSubmit={(nextState) => (

                  // )}
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
                    // size="sm"
                    onClick={() => {
                      // TODO: Bring back
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

          <>
            {editChapterId && chaptersMap[editChapterId] && (
              <EditChapterView
                boardState={{
                  ...chaptersMap[editChapterId],
                  fen: chaptersMap[editChapterId].displayFen,
                }}
                isBoardEditorShown={!!props.inputModeState.isBoardEditorShown}
                onToggleBoardEditor={(show) => {
                  props.onUpdateInputModeState({
                    ...props.inputModeState,
                    isBoardEditorShown: show,
                  });
                }}
                className="p-2 py-3 border-b border-slate-400"
                chapter={chaptersMap[editChapterId]}
                // expanded={active === chapter.id}
                // onUse={() => onUse(chapter.id)}
                onUse={() => {}}
                // onUpdate={(state) => onUpdate(chapter.id, state)}
                onUpdate={(state) => {}}
                onDelete={() => {}}
                onUpdateFen={() => {}}
                onClearArrowsAndCircles={() => {}}
                renderSubmit={(nextState) => (
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
                        // TODO: Bring back
                        // onCreateChapter(nextState.state);
                        // onClearArrowsAndCircles();

                        props.onDeactivateInputMode();
                      }}
                      icon="PencilSquareIcon"
                    >
                      Update Chapter
                    </Button>
                  </div>
                )}
              />
            )}
          </>,
        ][tabsNav.stackIndex]
      }
      {/* <div className="flex flex-1 flex-col gap-2 pt-2 hover:cursor-pointer hover:bg-slate-600 p-2 py-3 border-b last:border-0 border-slate-400">
        <Button
          size="sm"
          onClick={() => {
            // links.getRoomLink({
            //   id:
            // })
            currentRoomLinks.setForCurrentRoom({
              newChapter: '1',
              // edit: true,
            });
          }}
        >
          Create Chapter
        </Button>
      </div> */}
      {/* <Button
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
      </Button> */}
      {/* {isNewChapterParamsSet ? ( */}
      {/* <div className="flex-1 flex overflow-scroll">
        <CreateChapterView
          boardFen={ChessFENBoard.STARTING_FEN}
          defaultChapterName={`Chapter ${chaptersCount + 1}`}
          onCreate={onCreateChapter}
          onUpdateFen={() => {}}
          onClearArrowsAndCircles={() => {}}
        />
      </div> */}
      {/* ) : (
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              // links.getRoomLink({
              //   id:
              // })
              currentRoomLinks.setForCurrentRoom({
                newChapter: '1',
                // edit: true,
              });
            }}
          >
            Create Chapter
          </Button>
        </div>
      )} */}
      {/* <Button
        size="md"
        className="mt-4"
        icon="PlusIcon"
        onClick={() => {
          // links.getRoomLink({
          //   id:
          // })
          // currentRoomLinks.setForCurrentRoom({
          //   newChapter: '1',
          //   // edit: true,
          // });
          tabsNav.stackPush();
        }}
      >
        Create New Chapter
      </Button> */}
    </div>
  );
};
