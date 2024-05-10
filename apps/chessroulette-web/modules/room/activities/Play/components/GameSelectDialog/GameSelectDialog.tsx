import { objectKeys } from '@xmatter/util-kit';
import { Dialog } from 'apps/chessroulette-web/components/Dialog/Dialog';
import { SelectInput } from 'apps/chessroulette-web/components/SelectInput';
import React, { useState } from 'react';
import { GameType, chessGameTimeLimitMsMap, gameTypeRecord } from '../../types';
import { Button } from 'apps/chessroulette-web/components/Button';

type Props = {
  onSelect: ({
    cameraOn,
    gameType,
  }: {
    cameraOn: boolean;
    gameType: GameType;
  }) => void;
  onCancel: () => void;
};

export const GameSelectDialog: React.FC<Props> = (props) => {
  const [gameType, setGameType] = useState<GameType>('untimed');

  return (
    <Dialog
      title="Game Type"
      modalBG="light"
      content={
        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-3">
            <div>Choose Game type:</div>
            <SelectInput
              value={{ value: gameType, label: gameType }}
              onSelect={(v) => {
                console.log('vvvv', v);
                const validOption = gameTypeRecord.safeParse(v.value);
                console.log('valid', validOption);
                if (!validOption.success) {
                  return;
                }
                setGameType(validOption.data);
              }}
              options={objectKeys(chessGameTimeLimitMsMap)}
            />
          </div>
          <div className="flex flex-row justify-center gap-4">
            <Button
              type="custom"
              bgColor="blue"
              onClick={() => {
                props.onSelect({
                  cameraOn: true,
                  gameType,
                });
              }}
            >
              Start Game
            </Button>
            <Button onClick={props.onCancel} type="primary" bgColor="red">
              Cancel
            </Button>
          </div>
        </div>
      }
    />
  );
};
