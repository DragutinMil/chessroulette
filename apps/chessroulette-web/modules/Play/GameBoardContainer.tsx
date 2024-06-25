import { DispatchOf, swapColor } from '@xmatter/util-kit';
import { Game, PlayActions } from './store';
import { UserId, UsersMap } from '../user/type';
import { Playboard } from 'apps/chessroulette-web/components/Boards';
import { useMemo } from 'react';
import { RIGHT_SIDE_SIZE_PX } from '../room/activities/Learn/components/LearnBoard';
import { PanelResizeHandle } from 'react-resizable-panels';
import { useCanPlay } from './hooks/useCanPlay';
import { useGame } from './providers/useGame';
import { ChessboardContainerProps } from 'apps/chessroulette-web/components/Chessboard';

type Props = {
  boardSizePx: number;
  game: Game;
  dispatch: DispatchOf<PlayActions>;
  players?: UsersMap; // TODO: this should be better defined
  playerId: UserId;
  isBoardFlipped?: boolean;
  joinRoomLink: string | undefined;
} & Pick<ChessboardContainerProps, 'overlayComponent'>;

/**
 * This must be used as a descendant of the GameProvider only
 *
 * @param param0
 * @returns
 */
export const GameBoardContainer = ({
  game,
  isBoardFlipped,
  boardSizePx,
  players,
  playerId,
  dispatch,
  overlayComponent,
}: Props) => {
  // TODO: This should come from somewhere else
  const orientation = useMemo(
    () => (isBoardFlipped ? swapColor(game.orientation) : game.orientation),
    [isBoardFlipped, game.orientation]
  );

  const { displayState } = useGame();

  const canPlay = useCanPlay(game, players, playerId);

  return (
    <Playboard
      sizePx={boardSizePx}
      fen={displayState.fen}
      lastMove={displayState.lastMove}
      canPlay={canPlay}
      overlayComponent={overlayComponent}
      playingColor={orientation}
      onMove={(payload) => {
        // console.log('on move', payload, dispatch);
        dispatch({
          type: 'play:move',
          payload: {
            ...payload,
            moveAt: new Date().getTime(),
          },
        });

        // TODO: This can be returned from a more internal component
        return true;
      }}
      // TODO: Move this into the Play Acticity or somewhere inside the Room only
      rightSideSizePx={RIGHT_SIDE_SIZE_PX}
      rightSideClassName="flex flex-col"
      rightSideComponent={
        <>
          <div className="flex-1" />
          <div className="relative flex flex-col items-center justify-center">
            <PanelResizeHandle
              className="w-1 h-20 rounded-lg bg-slate-600"
              title="Resize"
            />
          </div>
          <div className="flex-1" />
        </>
      }
    />
  );
};
