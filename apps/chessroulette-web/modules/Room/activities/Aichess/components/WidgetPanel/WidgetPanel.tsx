import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { TabsRef } from '@app/components/Tabs';
import {
  Chapter,
  ChapterState,
  MovePiece,
  chessAiMode,
  Message,
} from '../../movex';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import { ChaptersTabProps } from '../../chapters/ChaptersTab';
import React from 'react';

import { EngineData } from '../../../../../ChessEngine/lib/io';
import { AiChessWidgetPanel } from './AiChessWidgetPanel';

type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;

  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onPuzzleMove: (move: MovePiece) => void;
  onTakeBack: () => void;
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  puzzleOrientation: () => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];

  // Mode
  isInstructor: boolean;

  // Engine
  showEngine?: boolean;
  engine?: EngineData;
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

export const WidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      currentLoadedChapterId,
      currentChapterState,
      showEngine,
      engine,
      isInstructor,
      onImport,
      onQuickImport,
      onHistoryNotationDelete,
      onPuzzleMove,
      onTakeBack,
      addChessAi,
      onMessage,
      puzzleOrientation,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    return (
      <AiChessWidgetPanel
        onHistoryNotationDelete={onHistoryNotationDelete}
        onHistoryNotationRefocus={onHistoryNotationRefocus}
        puzzleOrientation={puzzleOrientation}
        addChessAi={addChessAi}
        onMessage={onMessage}
        currentChapterState={currentChapterState}
        currentLoadedChapterId={currentLoadedChapterId}
        onQuickImport={onQuickImport}
        onPuzzleMove={onPuzzleMove}
        onTakeBack={onTakeBack}
        onImport={onImport}
        chaptersMap={chaptersMap}
        chaptersMapIndex={chaptersMapIndex}
        showEngine={showEngine}
        ref={tabsRef}
        {...chaptersTabProps}
      />
    );
  }
);
