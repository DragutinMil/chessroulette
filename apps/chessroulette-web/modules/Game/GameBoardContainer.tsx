import { DistributivePick } from '@xmatter/util-kit';
import { Playboard, PlayboardProps } from '@app/components/Boards';
import { useGame } from '@app/modules/Game/hooks';

export type GameBoardContainerProps = DistributivePick<
  PlayboardProps,
  'onLastMoveWasPromotionChange'
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

export const GameBoardContainer = (boardProps: GameBoardContainerProps) => {
  const { displayState } = useGame();

  return (
    <Playboard
      fen={displayState.fen}
      lastMove={displayState.lastMove}
      onLastMoveWasPromotionChange={boardProps.onLastMoveWasPromotionChange} // Dodajte ovo
      {...boardProps}
    />
  );
};
