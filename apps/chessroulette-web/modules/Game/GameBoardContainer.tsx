import { DistributivePick } from '@xmatter/util-kit';
import { Playboard, PlayboardProps } from '@app/components/Boards';
import { useGame } from '@app/modules/Game/hooks';

export type GameBoardContainerProps = DistributivePick<
  PlayboardProps,
  | 'overlayComponent'
  | 'playingColor'
  | 'onMove'
  | 'canPlay'
  | 'turn'
  | 'sizePx'
  | 'rightSideSizePx'
  | 'rightSideClassName'
  | 'rightSideComponent'
>;

export const GameBoardContainer = (boardProps: GameBoardContainerProps) => {
  const { displayState } = useGame();

  // TODO: This should come from somewhere else
  // const orientation = useMemo(
  //   () =>
  //     toShortColor(
  //       isBoardFlipped
  //         ? swapColor(committedState.game.orientation)
  //         : committedState.game.orientation
  //     ),
  //   [isBoardFlipped, committedState.game]
  // );

  return (
    <Playboard
      // sizePx={boardSizePx}
      // turn={toShortColor(committedState.turn)}
      // turn={turn}
      fen={displayState.fen}
      lastMove={displayState.lastMove}
      // canPlay={canPlay}
      // overlayComponent={overlayComponent}
      {...boardProps}
    />
  );
};
