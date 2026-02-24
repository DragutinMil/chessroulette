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

import React from 'react';
import { CircleDrawTuple, ArrowsMap } from '@app/components/Chessboard/types';
import { EngineData } from '../../../../../ChessEngine/lib/io';
import { PuzzleWidgetPanel } from './PuzzleWidgetPanel';
import type { UserData } from '../../movex/types';
type Props = {
  chaptersMap: Record<Chapter['id'], Chapter>;
  chaptersMapIndex: number;
  currentChapterState: ChapterState;
  historyBackToStart: () => void;
  puzzleCounter: number;
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
  userData: UserData;
  onCanPlayChange: (canPlay: boolean) => void;
  playerNames: Array<string>;
  // Mode
  isInstructor: boolean;

  // Engine
  showEngine?: boolean;
  engine?: EngineData;
};

export const WidgetPanel = React.forwardRef<TabsRef, Props>(
  (
    {
      chaptersMap,
      chaptersMapIndex,
      //   currentLoadedChapterId,
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
      userData,
      onHistoryNotationRefocus,
      ...chaptersTabProps
    },
    tabsRef
  ) => {
    return (
      <PuzzleWidgetPanel
        userData={userData}
        playerNames={playerNames}
        onHistoryNotationDelete={onHistoryNotationDelete}
        onHistoryNotationRefocus={onHistoryNotationRefocus}
        addChessAi={addChessAi}
        onMessage={onMessage}
        currentChapterState={currentChapterState}
        onCircleDraw={onCircleDraw}
        onArrowsChange={onArrowsChange}
        onPuzzleMove={onPuzzleMove}
        onCanPlayChange={onCanPlayChange}
        onMove={onMove}
        onTakeBack={onTakeBack}
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
