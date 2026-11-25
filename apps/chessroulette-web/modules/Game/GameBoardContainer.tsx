import { useMemo } from 'react';
import { DistributivePick } from '@xmatter/util-kit';
import { Playboard, PlayboardProps } from '@app/components/Boards';
import { useGame } from '@app/modules/Game/hooks';
import { getCheckmateSquares } from '@app/modules/Game/lib';

export type GameBoardContainerProps = DistributivePick<
  PlayboardProps,
  | 'onLastMoveWasPromotionChange'
  | 'overlayComponent'
  | 'playingColor'
  | 'onMove'
  | 'canPlay'
  | 'turn'
  | 'sizePx'
  | 'rightSideSizePx'
  | 'rightSideClassName'
  | 'rightSideComponent'
  | 'boardOrientation'
>;

const isBulletTimeClass = (timeClass?: string) =>
  !!timeClass && timeClass.startsWith('bullet');

export const GameBoardContainer = (
  boardProps: GameBoardContainerProps,
  stopEngineMove?: boolean,
  botId?: string,
  userRating?: number,
  botType?: string
) => {
  const { displayState, committedState } = useGame();
  const disableAnimations = isBulletTimeClass(committedState.game.timeClass);

  // polja za '#' oznaku i pad kralja - samo kad tabla prikazuje matnu poziciju
  const checkmate = useMemo(
    () => getCheckmateSquares(displayState.fen, displayState.lastMove),
    [displayState.fen, displayState.lastMove]
  );

  return (
    <Playboard
      fen={displayState.fen}
      stopEngineMove={stopEngineMove}
      botId={botId}
      botType={botType}
      userRating={userRating}
      lastMove={displayState.lastMove}
      onLastMoveWasPromotionChange={boardProps.onLastMoveWasPromotionChange}
      disableAnimations={disableAnimations}
      checkmate={checkmate}
      {...boardProps}
    />
  );
};
