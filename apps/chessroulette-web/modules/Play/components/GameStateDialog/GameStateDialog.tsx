import React, { useEffect, useState } from 'react';
import { invoke, objectKeys } from '@xmatter/util-kit';
import { Dialog } from 'apps/chessroulette-web/components/Dialog';
import { Text } from 'apps/chessroulette-web/components/Text';
import { useGameActionsContext } from '../../providers/useGameActions';
import { GameOffer } from '../../store';

type Props = {
  onAcceptOffer: ({ offer }: { offer: GameOffer['type'] }) => void;
  onDenyOffer: () => void;
  onRematchRequest: () => void;
  onCancelOffer: () => void;
  // roomId: string;
};

export const GameStateDialog: React.FC<Props> = ({
  onRematchRequest,
  onAcceptOffer,
  onDenyOffer,
  onCancelOffer,
  // roomId,
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);
  const {
    lastOffer,
    game: gameState,
    players,
    playerId,
  } = useGameActionsContext();

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [gameState.status]);

  return invoke(() => {
    if (
      gameState.status === 'pending' &&
      objectKeys(players || {}).length < 2
    ) {
      return (
        <Dialog
          title="Waiting for Opponent"
          content={
            <div>
              {/* // TODO: Fix this */}
              {/* <RoomSideMenu activity="play" roomId={roomId} /> */}
              TODO: Show invite Link
            </div>
          }
        />
      );
    }

    if (
      gameState.status === 'complete' &&
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
      if (gameState.status === 'complete' && !gameResultSeen) {
        setGameResultSeen(true);
      }
      if (lastOffer.type === 'rematch') {
        if (lastOffer.status === 'pending') {
          if (lastOffer.byPlayer === playerId) {
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
          if (lastOffer.byPlayer === playerId) {
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

      if (lastOffer.type === 'draw' && lastOffer.status === 'pending') {
        if (lastOffer.byPlayer === playerId) {
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

      if (lastOffer.type === 'takeback') {
        if (lastOffer.status === 'pending') {
          if (lastOffer.byPlayer === playerId) {
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

        if (lastOffer.status === 'denied' && !gameResultSeen) {
          if (lastOffer.byPlayer === playerId) {
            return (
              <Dialog
                title="Offer Denied"
                content={
                  <div className="flex justify-center content-center">
                    Takeback offer has been denied.
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
  });
};
