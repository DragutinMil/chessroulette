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
  historyBackToStart: () => void;
  puzzleCounter:number;
  // Board
  onImport: PgnInputBoxProps['onChange'];
  onQuickImport: PgnInputBoxProps['onChange'];
  onPuzzleMove: (move: MovePiece) => void;
  onMove: (move: MovePiece) => void;
  onTakeBack: FreeBoardNotationProps['onRefocus'];
  addChessAi: (moves: chessAiMode) => void;
  onMessage: (message: Message) => void;
  onCircleDraw: (tuple: CircleDrawTuple) => void;
  onArrowsChange: (tuple: ArrowsMap) => void;
  onHistoryNotationRefocus: FreeBoardNotationProps['onRefocus'];
  onHistoryNotationDelete: FreeBoardNotationProps['onDelete'];
  addGameEvaluation: (score: number) => void;
  userData: UserData;
  onCanPlayChange:(canPlay:boolean) => void;
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
      onQuickImport,
      onHistoryNotationDelete,
      onCircleDraw,
      onPuzzleMove,
      puzzleCounter,
      onArrowsChange,
      onTakeBack,
      addChessAi,
      onMessage,
      onMove,
      onCanPlayChange,
      playerNames,
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
        playerNames={playerNames}
        onHistoryNotationDelete={onHistoryNotationDelete}
        onHistoryNotationRefocus={onHistoryNotationRefocus}
        addChessAi={addChessAi}
        onMessage={onMessage}
        addGameEvaluation={addGameEvaluation}
        currentChapterState={currentChapterState}
        currentLoadedChapterId={currentLoadedChapterId}
        onQuickImport={onQuickImport}
        onCircleDraw={onCircleDraw}
        onArrowsChange={onArrowsChange}
        onPuzzleMove={onPuzzleMove}
        onCanPlayChange={onCanPlayChange}
        onMove={onMove}
        onTakeBack={onTakeBack}
        historyBackToStart={historyBackToStart}
        onImport={onImport}
        chaptersMap={chaptersMap}
        chaptersMapIndex={chaptersMapIndex}
        showEngine={showEngine}
        puzzleCounter={puzzleCounter}
        ref={tabsRef}
        {...chaptersTabProps}
      />
    );
  }
);
