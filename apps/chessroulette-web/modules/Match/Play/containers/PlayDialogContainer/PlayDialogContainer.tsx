import { useCallback } from 'react';
import { GameOffer } from '@app/modules/Game';
import { PlayDialog } from './PlayDialog';
import { usePlayActionsDispatch } from '../../hooks';
import Cookies from 'js-cookie';
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
      } else if (offer === 'rematch') {
       // console.log(offer);
        const token: string | undefined = Cookies.get('sessionToken');
       // console.log('token', token);
        const newRematch = async () => {
          const response = await fetch(
            process.env.NEXT_PUBLIC_API_WEB + 'challenge_rematch',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                match_id: matchId,
              }),
            }
          );
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          const data = await response.json();
          console.log('response data', data);

          dispatch({
            type: 'play:acceptOfferRematch',
            payload: {
              target_url: data.target_url,
              initiator_url: data.initiator_url,
            },
          });
        };
        newRematch();
      } else if (offer === 'takeback') {
        dispatch({ type: 'play:acceptTakeBack' });
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
