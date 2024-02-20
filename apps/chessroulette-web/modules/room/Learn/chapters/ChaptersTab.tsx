import { ChessFENBoard, noop } from '@xmatter/util-kit';
import { Chapter, ChapterState } from '../../activity/reducer';
import { useEffect, useMemo, useState } from 'react';
import { objectKeys } from 'movex-core-util';
import { ChapterItem } from './ChapterItem';
import { Button, IconButton } from 'apps/chessroulette-web/components/Button';
import { useCurrentRoomLinks } from '../../hooks/useCurrentLinks';
import { useSearchParams } from 'next/navigation';
import { CreateChapteViewProps, CreateChapterView } from './CreateChapterView';
import { TabsNav } from 'apps/chessroulette-web/components/Tabs';
import { EditChapterView } from './EditChapterView';

export type ChaptersTabProps = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number; // The number of chapters in the whole state
  className?: string;
  onUseChapter: (id: Chapter['id']) => void;
  onDeleteChapter: (id: Chapter['id']) => void;
  // onCreateChapter: CreateChapteViewProps['onCreate'];
  onCreateChapter: (state: ChapterState) => void;
  tabsNav: TabsNav;
};

export const ChaptersTab = ({
  onUseChapter,
  onCreateChapter,
  onDeleteChapter,
  chaptersMapIndex,
  chaptersMap,
  className,
  tabsNav,
}: ChaptersTabProps) => {
  const currentRoomLinks = useCurrentRoomLinks();
  // const chaptersCount = Object.keys(chaptersMap).length;

  const chaptersList = useMemo(
    () => objectKeys(chaptersMap).map((id) => chaptersMap[id]),
    [chaptersMap]
  );

  const searchParams = useSearchParams();
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
                    chapter={chapter}
                    onLoadClick={() => onUseChapter(chapter.id)}
                    onEditClick={() => {
                      setEditChapterId(chapter.id);
                      tabsNav.stackTo(2);
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
            </Button>
          </>,
          <div className="flex-1 flex overflow-scroll">
            <CreateChapterView
              boardFen={ChessFENBoard.STARTING_FEN}
              defaultChapterName={`Chapter ${chaptersMapIndex + 1}`}
              // onCreate={onCreateChapter}
              onUpdateFen={() => {}}
              onClearArrowsAndCircles={() => {}}
              renderSubmit={(nextState) => (
                <div className="flex gap-2">
                  <IconButton
                    // size="sm"
                    type="secondary"
                    onClick={tabsNav.stackBack}
                    icon="ArrowLeftIcon"
                  />
                  <Button
                    className="flex-1"
                    // size="sm"
                    onClick={() => {
                      // TODO: Bring back
                      onCreateChapter(nextState);
                      // onClearArrowsAndCircles();
                    }}
                    icon="PlusIcon"
                  >
                    Create Chapter
                  </Button>
                </div>
              )}
            />
          </div>,

          <>
            {editChapterId && chaptersMap[editChapterId] && (
              <EditChapterView
                boardState={{
                  ...chaptersMap[editChapterId],
                  fen: chaptersMap[editChapterId].startingFen,
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
                      onClick={() => tabsNav.stackPop()}
                      icon="ArrowLeftIcon"
                    />
                    <Button
                      className="flex-1"
                      // size="sm"
                      onClick={() => {
                        // TODO: Bring back
                        // onCreateChapter(nextState.state);
                        // onClearArrowsAndCircles();
                      }}
                      icon="PlusIcon"
                    >
                      Create Chapter
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
