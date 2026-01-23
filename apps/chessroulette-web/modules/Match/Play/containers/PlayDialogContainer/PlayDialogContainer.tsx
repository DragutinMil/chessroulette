import { useCallback } from 'react';
import { GameOffer } from '@app/modules/Game';
import { PlayDialog } from './PlayDialog';
import { usePlayActionsDispatch } from '../../hooks';
import { newRematchRequest, newRematchRequestInitiate } from '../../../utilsOutpost';
import { useMatchViewState } from '../../../hooks/useMatch';
import { useMovexBoundResourceFromRid } from 'movex-react';
import movexConfig from '@app/movex.config';
import { useMovexClient } from 'movex-react';
import { movexSubcribersToUserMap } from '@app/providers/MovexProvider';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';


export type PlayDialogContainerContainerProps = {
  inviteLink: string | undefined;
};

export const PlayDialogContainer = ({
  inviteLink,
}: PlayDialogContainerContainerProps) => {
  const dispatch = usePlayActionsDispatch();

  const params = useParams<{ roomId?: string }>();
  const pathParts = window.location.pathname.split('/');
  const matchId = pathParts[pathParts.length - 1];
  
  const { match } = useMatchViewState();
  const userId = useMovexClient(movexConfig)?.id;

  const roomId = params.roomId || matchId || match?.challengee?.id;
  
  // Pristupimo movex resource-u za room da bismo proverili participants
  // Napomena: roomId mora biti validan room ID, ne match ID
  // Možda treba izvući room ID iz URL-a na drugačiji način
  const roomRid = roomId ? `room:${roomId}` : null;
  const movexResource = useMovexBoundResourceFromRid(
    movexConfig, 
    roomRid as any
  );
  
  const participants = useMemo(
    () => movexSubcribersToUserMap(movexResource?.subscribers || {}),
    [movexResource?.subscribers]
  );

const isOpponentInRoom = useMemo(() => {
  // Rana provera - ako nemamo osnovne podatke, oba igrača nisu u sobi
  if (!match || !participants || typeof participants !== 'object') {
    return false;
  }
  
  // Proveri da li imamo validne challenger i challengee podatke
  const challengerId = match.challenger?.id;
  const challengeeId = match.challengee?.id;

  if (!challengerId || !challengeeId) {
    return false;
  }
  
  // Proveri da li su OBA igrača u participants listi
  const challengerConnected = challengerId in participants;
  const challengeeConnected = challengeeId in participants;

  return challengerConnected && challengeeConnected;
}, [match, participants]);

const onAcceptOffer = useCallback(
  ({ offer }: { offer: GameOffer['type'] }) => {
    if (offer === 'draw') {
      dispatch({ type: 'play:acceptOfferDraw' });
    } else if (offer === 'takeback') {
      dispatch({ type: 'play:acceptTakeBack' });
    } else if (offer === 'rematch') {
      const handleRematch = async () => {
        try {
          // Ako protivnik NIJE u sobi, šalji zahtev na platformu
          if (!isOpponentInRoom) {
            console.log('Opponent not in room - sending rematch request to platform');
            await newRematchRequestInitiate(matchId);
            // Ne treba dispatch jer se šalje preko socket notifikacije
            // Protivnik će dobiti notifikaciju i moći će da je prihvati
          } else {
            // Ako su oba igrača u sobi, samo prihvati rematch direktno
            // Nema potrebe da se šalje zahtev na platformu
            console.log('Both players in room - accepting rematch directly (no platform request)');
            dispatch({
              type: 'play:acceptOfferRematch',
              payload: {
                target_url: '',
                initiator_url: '',
              },
            });
          }
        } catch (error) {
          console.error('Error handling rematch:', error);
        }
      };
      handleRematch();
    }
  },
  [dispatch, matchId, isOpponentInRoom]
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