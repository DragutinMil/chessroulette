import { useCallback } from 'react';
import { GameOffer } from '@app/modules/Game';
import { PlayDialog } from './PlayDialog';
import { usePlayActionsDispatch } from '../../hooks';
import { newRematchRequest } from '../../../utilsOutpost';
//import Cookies from 'js-cookie';
export type PlayDialogContainerContainerProps = {
  inviteLink: string | undefined;
};

export const PlayDialogContainer = ({
  inviteLink,
}: PlayDialogContainerContainerProps) => {
  const dispatch = usePlayActionsDispatch();
  const pathParts = window.location.pathname.split('/');
  const matchId = pathParts[pathParts.length - 1];

  const onAcceptOffer = useCallback(
    ({ offer }: { offer: GameOffer['type'] }) => {
      if (offer === 'draw') {
        dispatch({ type: 'play:acceptOfferDraw' });
      } else if (offer === 'takeback') {
        dispatch({ type: 'play:acceptTakeBack' });
      } else if (offer === 'rematch') {
        const handleRematch = async () => {
          const data = await newRematchRequest(matchId);

          dispatch({
            type: 'play:acceptOfferRematch',
            payload: {
              target_url: data.target_url,
              initiator_url: data.initiator_url,
            },
          });
        };
        handleRematch();
      }
    },
    [dispatch]
  );

  return (
    <PlayDialog
      onAcceptOffer={onAcceptOffer}
      onCancelOffer={() => dispatch({ type: 'play:cancelOffer' })}
      onDenyOffer={() => dispatch({ type: 'play:denyOffer' })}
      inviteLink={inviteLink}
    />
  );
};
