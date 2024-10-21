import { DispatchOf } from '@xmatter/util-kit';
import { PlayActions } from '../movex';
import { UserId } from '../../user/type';
import { useCallback } from 'react';
import { GameOffer } from '@app/modules/Game';
import { GameStateDialog } from '@app/modules/Game/components/GameStateDialog';
// import { GameStateDialog } from '../components/GameStateDialog';

export type GameStateDialogContainerProps = {
  dispatch: DispatchOf<PlayActions>;
  playerId: UserId;
  joinRoomLink: string | undefined;
};

/**
 * This must be used as a descendant of the GameProvider only
 *
 * @param param0
 * @returns
 */
export const GameStateDialogContainer = ({
  dispatch,
  joinRoomLink,
}: GameStateDialogContainerProps) => {
  const onAcceptOffer = useCallback(
    ({ offer }: { offer: GameOffer['type'] }) => {
      if (offer === 'draw') {
        dispatch({ type: 'play:acceptOfferDraw' });
      } else if (offer === 'rematch') {
        dispatch({ type: 'play:acceptOfferRematch' });
      } else if (offer === 'takeback') {
        dispatch({ type: 'play:acceptTakeBack' });
      }
    },
    [dispatch]
  );

  return (
    <GameStateDialog
      onAcceptOffer={onAcceptOffer}
      joinRoomLink={joinRoomLink}
      onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
      onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
    />
  );
};
