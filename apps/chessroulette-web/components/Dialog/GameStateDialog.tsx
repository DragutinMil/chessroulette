import {
  Offer,
  PlayActivityState,
} from 'apps/chessroulette-web/modules/room/activities/Play/movex';
import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from './Dialog';
import { Text } from '../Text';
import { useGameActions } from 'apps/chessroulette-web/modules/room/activities/Play/providers/useGameActions';

type Props = {
  gameState: PlayActivityState['activityState']['game'];
  onAcceptOffer: (payload: Pick<Offer, 'id'>) => void;
  onDenyOffer: (payload: Pick<Offer, 'id'>) => void;
  onRematchRequest: () => void;
};

export const GameStateDialog: React.FC<Props> = ({
  gameState,
  onRematchRequest,
  onAcceptOffer,
  onDenyOffer,
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);
  const gameActions = useGameActions();

  const currentActiveOffer = useMemo(
    () => gameActions?.currentActiveOffer,
    [gameActions]
  );

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [gameState.state]);

  useEffect(() => {
    console.log('currentActiveOffer changed ==> ', currentActiveOffer);
  }, [currentActiveOffer]);

  const content = (() => {
    console.log('currentActiveOffer => ', currentActiveOffer);

    if (gameState.state === 'pending') {
      return <Dialog title="Waiting for Opponent" content={<div></div>} />;
    }
    if (
      gameState.state === 'complete' &&
      !gameResultSeen &&
      !currentActiveOffer
    ) {
      return (
        <Dialog
          title="Game Ended"
          content={
            <div className="flex justify-center content-center text-center">
              {gameState.winner &&
                (gameState.winner === '1/2' ? (
                  <Text>Game Ended in a Draw</Text>
                ) : (
                  <Text className="capitalize">{gameState.winner} Won!</Text>
                ))}
            </div>
          }
          hasCloseButton
          onClose={() => {
            setGameResultSeen(true);
          }}
          buttons={[
            {
              children: 'Rematch',
              onClick: () => onRematchRequest(),
              type: 'primary',
              bgColor: 'blue',
            },
          ]}
        />
      );
    }

    if (currentActiveOffer) {
      console.log('YES OFFER AVAILABLE!');
      const { id } = currentActiveOffer; //TODO -currently not using it, only 1 active offer at a time
      if (
        currentActiveOffer.offerType === 'rematch' &&
        currentActiveOffer.status === 'pending'
      ) {
        return (
          <Dialog
            title="Rematch ?"
            content={
              <div className="flex justify-center content-center">
                You have been invited for a rematch.
              </div>
            }
            buttons={[
              {
                children: 'Accept',
                bgColor: 'green',
                onClick: () => {
                  onAcceptOffer({ id });
                  setGameResultSeen(true);
                },
              },
              {
                children: 'Deny',
                bgColor: 'red',
                onClick: () => {
                  onDenyOffer({ id });
                  setGameResultSeen(true);
                },
              },
            ]}
          />
        );
      }
    }

    return null;
  })();

  if (!content) {
    return null;
  }

  return (
    <div className="flex bg-black rounded-lg p-2 shadow-2xl">{content}</div>
  );
};
