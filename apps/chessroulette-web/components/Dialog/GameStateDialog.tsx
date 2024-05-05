import React, { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Text } from '../Text';
import { useGameActions } from 'apps/chessroulette-web/modules/room/activities/Play/providers/useGameActions';
import { objectKeys } from '@xmatter/util-kit';
import { OfferType } from 'apps/chessroulette-web/modules/room/activities/Play/movex';

type Props = {
  onAcceptOffer: ({ offer }: { offer: OfferType }) => void;
  onDenyOffer: () => void;
  onRematchRequest: () => void;
  onCancelOffer: () => void;
};

export const GameStateDialog: React.FC<Props> = ({
  onRematchRequest,
  onAcceptOffer,
  onDenyOffer,
  onCancelOffer,
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);
  const { currentActiveOffer, gameState, participants, clientUserId } =
    useGameActions();

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [gameState.state]);

  const content = (() => {
    if (
      gameState.state === 'pending' &&
      objectKeys(participants || {}).length < 2
    ) {
      return <Dialog title="Waiting for Opponent" content={<div></div>} />;
    }
    if (
      gameState.state === 'complete' &&
      !gameResultSeen &&
      (!currentActiveOffer || currentActiveOffer.status !== 'pending')
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
      if (currentActiveOffer.offerType === 'rematch') {
        if (currentActiveOffer.status === 'pending') {
          if (currentActiveOffer.byParticipant === clientUserId) {
            return (
              <Dialog
                title="Rematch ?"
                content={
                  <div className="flex justify-center content-center">
                    Waiting for the other player to respond.
                  </div>
                }
                buttons={[
                  {
                    children: 'Cancel',
                    bgColor: 'red',
                    onClick: () => {
                      onCancelOffer();
                      setGameResultSeen(true);
                    },
                  },
                ]}
              />
            );
          }
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
                    onAcceptOffer({ offer: 'rematch' });
                    setGameResultSeen(true);
                  },
                },
                {
                  children: 'Deny',
                  bgColor: 'red',
                  onClick: () => {
                    onDenyOffer();
                    setGameResultSeen(true);
                  },
                },
              ]}
            />
          );
        }
        if (currentActiveOffer.status === 'denied') {
          if (currentActiveOffer.byParticipant === clientUserId) {
            return (
              <Dialog
                title="Offer Denied"
                content={
                  <div className="flex justify-center content-center">
                    Rematch offer has been denied.
                  </div>
                }
                buttons={[
                  {
                    children: 'Ok',
                    bgColor: 'blue',
                    onClick: () => {
                      setGameResultSeen(true);
                    },
                  },
                ]}
              />
            );
          }
        }
      }

      if (
        currentActiveOffer.offerType === 'draw' &&
        currentActiveOffer.status === 'pending'
      ) {
        if (currentActiveOffer.byParticipant === clientUserId) {
          return (
            <Dialog
              title="Draw ?"
              content={
                <div className="flex justify-center content-center">
                  Waiting for the other player to respond.
                </div>
              }
              buttons={[
                {
                  children: 'Cancel',
                  bgColor: 'red',
                  onClick: () => {
                    onCancelOffer();
                    setGameResultSeen(true);
                  },
                },
              ]}
            />
          );
        }
        return (
          <Dialog
            title="Draw ?"
            content={
              <div className="flex justify-center content-center">
                You've been send an offer for a draw ?
              </div>
            }
            buttons={[
              {
                children: 'Accept',
                bgColor: 'green',
                onClick: () => {
                  onAcceptOffer({ offer: 'draw' });
                  setGameResultSeen(true);
                },
              },
              {
                children: 'Deny',
                bgColor: 'red',
                onClick: () => {
                  onDenyOffer();
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
    <div className="absolute w-full h-full top-0 left-0 z-50 flex justify-center content-center items-center">
      <div className="flex bg-black rounded-lg p-2 shadow-2xl">{content}</div>
    </div>
  );
};
