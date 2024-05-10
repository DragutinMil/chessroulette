import React, { useEffect, useState } from 'react';
import { useGameActions } from 'apps/chessroulette-web/modules/room/activities/Play/providers/useGameActions';
import { objectKeys } from '@xmatter/util-kit';
import { OfferType } from 'apps/chessroulette-web/modules/room/activities/Play/movex';
import { Dialog } from 'apps/chessroulette-web/components/Dialog/Dialog';
import { Text } from 'apps/chessroulette-web/components/Text';
import { RoomSideMenu } from 'apps/chessroulette-web/modules/room/components/RoomSideMenu';

type Props = {
  onAcceptOffer: ({ offer }: { offer: OfferType }) => void;
  onDenyOffer: () => void;
  onRematchRequest: () => void;
  onCancelOffer: () => void;
  roomId: string;
};

export const GameStateDialog: React.FC<Props> = ({
  onRematchRequest,
  onAcceptOffer,
  onDenyOffer,
  onCancelOffer,
  roomId,
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);
  const { lastOffer, gameState, players, clientUserId } = useGameActions();

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [gameState.state]);

  const content = (() => {
    if (gameState.state === 'pending' && objectKeys(players || {}).length < 2) {
      return (
        <Dialog
          title="Waiting for Opponent"
          content={
            <div>
              <RoomSideMenu activity="play" roomId={roomId} />
            </div>
          }
        />
      );
    }
    if (
      gameState.state === 'complete' &&
      !gameResultSeen &&
      (!lastOffer || lastOffer.status !== 'pending')
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
          onClose={() => {
            setGameResultSeen(true);
          }}
          buttons={[
            {
              children: 'Offer Rematch',
              onClick: () => onRematchRequest(),
              type: 'primary',
              bgColor: 'blue',
            },
          ]}
        />
      );
    }

    if (lastOffer) {
      if (gameState.state === 'complete' && !gameResultSeen) {
        setGameResultSeen(true);
      }
      if (lastOffer.offerType === 'rematch') {
        if (lastOffer.status === 'pending') {
          if (lastOffer.byPlayer === clientUserId) {
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
        if (lastOffer.status === 'denied') {
          if (lastOffer.byPlayer === clientUserId) {
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

      if (lastOffer.offerType === 'draw' && lastOffer.status === 'pending') {
        if (lastOffer.byPlayer === clientUserId) {
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

      if (lastOffer.offerType === 'takeback') {
        if (lastOffer.status === 'pending') {
          if (lastOffer.byPlayer === clientUserId) {
            return (
              <Dialog
                title="Takeback ?"
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
              title="Takeback ?"
              content={
                <div className="flex justify-center content-center">
                  You have asked to approve a takeback.
                </div>
              }
              buttons={[
                {
                  children: 'Accept',
                  bgColor: 'green',
                  onClick: () => {
                    onAcceptOffer({ offer: 'takeback' });
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
        if (lastOffer.status === 'denied') {
          if (lastOffer.byPlayer === clientUserId) {
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
    }

    return null;
  })();

  if (!content) {
    return null;
  }

  return (
    <div className="absolute w-full h-full top-0 left-0 z-50 flex justify-center content-center items-center bg-black bg-opacity-30">
      <div className="flex bg-black rounded-lg p-2 shadow-2xl shadow-black">
        {content}
      </div>
    </div>
  );
};
