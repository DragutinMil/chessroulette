import { useEffect, useRef, useMemo } from 'react';
import { useMovexBoundResourceFromRid } from 'movex-react';
import movexConfig from '@app/movex.config';
import { ResourceIdentifier } from 'movex-core-util';
import { useCurrentOrPrevMatchPlay } from '@app/modules/Match/Play/hooks';
import { useMatchActionsDispatch } from '@app/modules/Match/hooks';
import { useMatchViewState } from '@app/modules/Match/hooks/useMatch';
import { useRoomDetails } from '@app/modules/Room/hooks';

export const usePlayerAbandonDetection = () => {
  const play = useCurrentOrPrevMatchPlay();
  const dispatch = useMatchActionsDispatch();
  const { match } = useMatchViewState();
  const roomDetails = useRoomDetails();
  const hasDispatchedRef = useRef<Set<string>>(new Set());
  const bothPlayersWerePresentRef = useRef<boolean>(false);

  // Kreirati ResourceIdentifier samo ako postoji roomId
  const rid: ResourceIdentifier<'room'> | undefined = useMemo(() => {
    return roomDetails?.roomId ? `room:${roomDetails.roomId}` as ResourceIdentifier<'room'> : undefined;
  }, [roomDetails?.roomId]);
  
  // Pristup Movex resource-u za room - hook će vratiti undefined ako je rid undefined
  const movexResource = useMovexBoundResourceFromRid(
    movexConfig,
    rid!
  );

  useEffect(() => {
    // Reset dispatched set when game changes
    hasDispatchedRef.current.clear();
    bothPlayersWerePresentRef.current = false;
  }, [play.game?.startedAt]);

  useEffect(() => {
    // Proveri da li imamo sve potrebne podatke
    if (!rid || !movexResource?.subscribers || !play.hasGame || !match) {
      return;
    }

    const game = play.game;

    if (game.status === 'abandoned') {
        const subscriberIds = Object.keys(movexResource.subscribers);
        const playerIds = [game.players.w, game.players.b];
        
        // Proveri da li su oba igrača sada prisutna
        const bothPlayersPresent = playerIds.every(playerId => subscriberIds.includes(playerId));
        
        if (bothPlayersPresent) {
          // Igrač se vratio - nastavi igru
          console.log('[usePlayerAbandonDetection] Player returned, resuming game');
          
          // Dispatch akciju za nastavak igre
          dispatch({
            type: 'play:resumeAbandonedGame',
          });
          
          // Resetuj flag jer su oba igrača prisutna
          bothPlayersWerePresentRef.current = true;
          hasDispatchedRef.current.clear();
        }
        return;
      }
    
    // Može se abandonovati samo ongoing ili idling igra
    if (game.status !== 'ongoing' && game.status !== 'idling') {
        bothPlayersWerePresentRef.current = false;

      return;
    }

    if (!game.startedAt) {
        console.log('[usePlayerAbandonDetection] Game not started yet');
        return;
      }

    // Proveri da li su oba igrača prisutna u subscribers
    const subscriberIds = Object.keys(movexResource.subscribers);
    const playerIds = [game.players.w, game.players.b];
    
    console.log('[usePlayerAbandonDetection] Checking subscribers:', {
      subscriberIds,
      playerIds,
      gameStatus: game.status,
      gameStartedAt: game.startedAt,

    });
    
    const bothPlayersPresent = playerIds.every(playerId => subscriberIds.includes(playerId));
    
    // Ako su oba igrača prisutna, označi to
    if (bothPlayersPresent) {
      bothPlayersWerePresentRef.current = true;
      console.log('[usePlayerAbandonDetection] Both players are present');
      return;
    }
    
    // Tek ako su oba igrača BILA prisutna, a sada jedan nedostaje, aktivirati abandon
    if (!bothPlayersWerePresentRef.current) {
      console.log('[usePlayerAbandonDetection] Both players were not present yet, waiting...');
      return;
    }

    // Proveri da li neki od igrača nije više u subscribers
    const missingPlayers = playerIds.filter(playerId => !subscriberIds.includes(playerId));
    
    if (missingPlayers.length > 0) {
      missingPlayers.forEach(playerId => {
        // Proveri da li smo već dispatch-ovali za ovog igrača
        if (hasDispatchedRef.current.has(playerId)) {
          console.log('[usePlayerAbandonDetection] Already dispatched for player:', playerId);
          return;
        }

        hasDispatchedRef.current.add(playerId);
        
        console.log('[usePlayerAbandonDetection] Player missing from subscribers, dispatching abandonGame:', playerId);
        
        // Dispatch abandon akciju
        dispatch({
          type: 'play:abandonGame',
          payload: {
            playerId: playerId,
          },
        });
      });
    }

  }, [
    rid,
    movexResource?.subscribers, 
    play.hasGame, 
    play.game?.status, 
    play.game?.players, 
    match, 
    dispatch
  ]);
};