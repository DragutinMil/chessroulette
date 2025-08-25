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
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { AiChessWidgetPanel } from './AiChessWidgetPanel';
import type { UserData } from '../../movex/types';
type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;

  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onPuzzleMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  puzzleOrientation: () => void;
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  addGameEvaluation: (score: number) => void;
  userData: UserData;
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
      onCircleDraw,
      onPuzzleMove,
      onArrowsChange,
      onTakeBack,
      addChessAi,
      onMessage,
      puzzleOrientation,
      addGameEvaluation,
      userData,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    return (
      <AiChessWidgetPanel
        userData={userData}
        onHistoryNotationDelete={onHistoryNotationDelete}
        onHistoryNotationRefocus={onHistoryNotationRefocus}
        puzzleOrientation={puzzleOrientation}
        addChessAi={addChessAi}
        onMessage={onMessage}
        addGameEvaluation={addGameEvaluation}
        currentChapterState={currentChapterState}
        currentLoadedChapterId={currentLoadedChapterId}
        onQuickImport={onQuickImport}
        onCircleDraw={onCircleDraw}
        onArrowsChange={onArrowsChange}
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
