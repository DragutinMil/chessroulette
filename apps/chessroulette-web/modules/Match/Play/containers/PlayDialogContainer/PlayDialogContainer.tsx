import { useCallback } from 'react';
import { DispatchOf } from '@xmatter/util-kit';
import { GameOffer } from '@app/modules/Game';
import { UserId } from '@app/modules/User';
import { PlayActions } from '../../store';
import { PlayDialog } from './PlayDialog';

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
export const PlayDialogContainer = ({
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
    <PlayDialog
      onAcceptOffer={onAcceptOffer}
      joinRoomLink={joinRoomLink}
      onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
      onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
    />
  );
};
