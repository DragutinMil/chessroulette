import { DistributivePick } from '@xmatter/util-kit';
import { Playboard, PlayboardProps } from '@app/components/Boards';
import { useGame } from '@app/modules/Game/hooks';

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
      {...boardProps}
    />
  );
};
