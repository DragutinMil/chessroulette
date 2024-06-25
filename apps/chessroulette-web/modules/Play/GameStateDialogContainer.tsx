import { DispatchOf } from '@xmatter/util-kit';
import { GameOffer, PlayActions } from './store';
import { UserId } from '../user/type';
import { useCallback } from 'react';
import { GameStateDialog } from './components/GameStateDialog';

export type GameStateDialogContainerProps = {
  // boardSizePx: number;
  // game: Game;
  dispatch: DispatchOf<PlayActions>;
  // players?: UsersMap; // TODO: this should be better defined
  playerId: UserId;
  // isBoardFlipped?: boolean;
  joinRoomLink: string | undefined;
};

/**
 * This must be used as a descendant of the GameProvider only
 *
 * @param param0
 * @returns
 */
export const GameStateDialogContainer = ({
  playerId,
  dispatch,
  joinRoomLink,
}: GameStateDialogContainerProps) => {
  // TODO: This should come from somewhere else

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

  const onRematchRequest = useCallback(() => {
    dispatch({
      type: 'play:sendOffer',
      payload: { byPlayer: playerId, offerType: 'rematch' },
    });
  }, [dispatch]);

  return (
    <GameStateDialog
      onRematchRequest={onRematchRequest}
      onAcceptOffer={onAcceptOffer}
      joinRoomLink={joinRoomLink}
      //TODO - at the moment nothing happens, later can decide if extra notifications when offer is cancelled
      onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
      onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
    />
  );
};
