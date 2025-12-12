import { PlayControls } from './PlayControls';
import { useCurrentOrPrevMatchPlay, usePlayActionsDispatch } from '../../hooks';
import { PENDING_UNTIMED_GAME } from '@app/modules/Game';
import { cons } from 'fp-ts/lib/ReadonlyNonEmptyArray';

import { useState, useEffect, useMemo } from 'react';
import { useMatchViewState } from '../../../hooks/useMatch';

const lastMoveWasPromotionCallbacks = new Set<(value: boolean) => void>();

type Props = {
  activeWidget: 'chat' | 'camera';
  setActiveWidget: (widget: 'chat' | 'camera') => void;
};

export const PlayControlsContainer = ({
  activeWidget,
  setActiveWidget,
}: Props) => {
  const dispatch = usePlayActionsDispatch();
  const { lastOffer, game, playersBySide, hasGame } =
    useCurrentOrPrevMatchPlay();
  const [lastMoveWasPromotion, setLastMoveWasPromotion] = useState(false);

  //  useEffect(() => {
  //   // Dodajte callback u set
  //   lastMoveWasPromotionCallbacks.add(setLastMoveWasPromotion);

  const { match } = useMatchViewState();

  // Izračunaj nepročitane poruke kada je chat enabled ali kamera aktivna
  const unreadMessagesCount = useMemo(() => {
    if (!match?.messages || activeWidget === 'chat') {
      return 0;
    }

    // Pronađi poslednju poruku koju je korisnik video
    const lastSeenMessageKey = `chessroulette-last-seen-message-${playersBySide?.home.id}`;
    const lastSeenTimestamp = localStorage.getItem(lastSeenMessageKey);

    if (!lastSeenTimestamp) {
      return match.messages.length;
    }

    const lastSeen = parseInt(lastSeenTimestamp, 10);
    return match.messages.filter((msg) => msg.timestamp > lastSeen).length;
  }, [match?.messages, activeWidget, playersBySide?.home.id]);

  // Ažuriraj last seen timestamp kada se aktivira chat
  useEffect(() => {
    if (activeWidget === 'chat' && match?.messages) {
      const lastMessage = match.messages[match.messages.length - 1];
      if (lastMessage) {
        const lastSeenMessageKey = `chessroulette-last-seen-message-${playersBySide?.home.id}`;
        localStorage.setItem(
          lastSeenMessageKey,
          lastMessage.timestamp.toString()
        );
      }
    }
  }, [activeWidget, match?.messages, playersBySide?.home.id]);

  if (!hasGame) {
    return <>WARN| Play Controls Container No Game</>;
  }

  return (
    <PlayControls
      activeWidget={activeWidget}
      setActiveWidget={setActiveWidget}
      homeColor={playersBySide.home.color}
      playerId={playersBySide.home.id}
      unreadMessagesCount={unreadMessagesCount}
      lastMoveWasPromotion={lastMoveWasPromotion}
      onDrawOffer={() => {
        dispatch({
          type: 'play:sendOffer',
          // payload: { byPlayer: playerId, offerType: 'draw' },

          // TODO: left it here - this should be by color and that's it!
          payload: { byPlayer: playersBySide.home.id, offerType: 'draw' },
        });
      }}
      onTakebackOffer={() => {
        dispatch((masterContext) => ({
          type: 'play:sendOffer',
          payload: {
            byPlayer: playersBySide.home.id, // TODO: Change this to the player color instead since they are per game!
            offerType: 'takeback',
            timestamp: masterContext.requestAt(),
          },
        }));
      }}
      onRematchOffer={() => {
        dispatch((masterContext) => ({
          type: 'play:sendOffer',
          payload: {
            byPlayer: playersBySide.home.id,
            offerType: 'rematch',
            timestamp: masterContext.requestAt(),
          },
        }));
      }}
      onResign={() => {
        dispatch({
          type: 'play:resignGame',
          payload: { color: playersBySide?.home.color },
        });
      }}
      game={game || PENDING_UNTIMED_GAME}
      lastOffer={lastOffer}
    />
  );
};
