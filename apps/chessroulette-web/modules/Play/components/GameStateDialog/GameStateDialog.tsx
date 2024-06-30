import React, { useEffect, useState } from 'react';
import { invoke, objectKeys } from '@xmatter/util-kit';
import { Dialog } from 'apps/chessroulette-web/components/Dialog';
import { GameOffer } from '../../store';
import { ClipboardCopyButton } from 'apps/chessroulette-web/components/ClipboardCopyButton';
import Link from 'next/link';
import { useGame } from '../../providers/useGame';

export type GameStateDialogProps = {
  onAcceptOffer: ({ offer }: { offer: GameOffer['type'] }) => void;
  onDenyOffer: () => void;
  onCancelOffer: () => void;
  joinRoomLink: string | undefined;
};

export const GameStateDialog: React.FC<GameStateDialogProps> = ({
  onAcceptOffer,
  onDenyOffer,
  onCancelOffer,
  joinRoomLink,
}) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);
  const { lastOffer, realState, players, playerId } = useGame();

  const { game: gameState } = realState;

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
            <div className="w-full flex justify-center">
              {joinRoomLink && (
                <ClipboardCopyButton
                  buttonComponentType="Button"
                  value={joinRoomLink}
                  render={(copied) => (
                    <>
                      {copied ? (
                        <Link
                          href={joinRoomLink}
                          target="_blank"
                          className="bg-transparent"
                          onClick={(e) => e.preventDefault()}
                        >
                          <div className="bg-green-400 text-black p-3 rounded-xl">
                            Copied
                          </div>
                        </Link>
                      ) : (
                        <div className="bg-purple-400 p-3 text-black rounded-xl">
                          Copy Invite URL
                        </div>
                      )}
                    </>
                  )}
                  type="clear"
                  size="sm"
                />
              )}
            </div>
          }
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
