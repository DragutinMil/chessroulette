import {
  FreeBoardNotation,
  FreeBoardNotationProps,
} from '@app/components/FreeBoardNotation';
import { TabsRef } from '@app/components/Tabs';

import {
  Chapter,
  ChapterState,
  MovePiece,
  Message,
  aiLearn,
} from '../../movex';
import { PgnInputBoxProps } from '@app/components/PgnInputBox/PgnInputBox';
import { ChaptersTabProps } from '../../chapters/ChaptersTab';
import React from 'react';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { LearnAiWidgetPanel } from './LearnAiWidgetPanel';
import type { UserData } from '../../movex/types';
type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;
  historyBackToStart: () => void;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  onMessage: (message: Message) => void;
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  userData: UserData;
  addLearnAi: (data: aiLearn) => void;
  onCanPlayChange: (canPlay: boolean) => void;
  playerNames: Array<string>;
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
      historyBackToStart,
      onImport,
      addLearnAi,
      onQuickImport,
      onHistoryNotationDelete,
      onCircleDraw,
      onArrowsChange,
      onTakeBack,
      onMessage,
      onMove,
      onCanPlayChange,
      playerNames,

      userData,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    return (
      <LearnAiWidgetPanel
        userData={userData}
        addLearnAi={addLearnAi}
        playerNames={playerNames}
        onHistoryNotationDelete={onHistoryNotationDelete}
        onHistoryNotationRefocus={onHistoryNotationRefocus}
        onMessage={onMessage}
        currentChapterState={currentChapterState}
        currentLoadedChapterId={currentLoadedChapterId}
        onQuickImport={onQuickImport}
        onCircleDraw={onCircleDraw}
        onArrowsChange={onArrowsChange}
        onCanPlayChange={onCanPlayChange}
        onMove={onMove}
        onTakeBack={onTakeBack}
        historyBackToStart={historyBackToStart}
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
