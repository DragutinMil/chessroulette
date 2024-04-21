import { PlayActivityState } from 'apps/chessroulette-web/modules/room/activities/Play/movex';
import React, { useEffect, useState } from 'react';
import { Dialog } from './Dialog';
import { Text } from '../Text';

type Props = {
  gameState: PlayActivityState['activityState']['game'];
  onRematch: () => void;
};

export const GameStateDialog: React.FC<Props> = ({ gameState, onRematch }) => {
  const [gameResultSeen, setGameResultSeen] = useState(false);

  useEffect(() => {
    // Everytime the game state changes, reset the seen!
    setGameResultSeen(false);
  }, [gameState.state]);

  const content = (() => {
    if (gameState.state === 'pending') {
      return <Dialog title="Waiting for Opponent" content={<div></div>} />;
    }
    if (gameState.state === 'complete' && !gameResultSeen) {
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
              onClick: () => onRematch(),
              type: 'primary',
              bgColor: 'blue',
            },
          ]}
        />
      );
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
