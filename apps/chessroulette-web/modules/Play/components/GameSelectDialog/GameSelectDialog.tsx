import { objectKeys } from '@xmatter/util-kit';
import { Dialog } from 'apps/chessroulette-web/components/Dialog/Dialog';
import { SelectInput } from 'apps/chessroulette-web/components/SelectInput';
import React, { useState } from 'react';
import {
  GameTimeClass,
  chessGameTimeLimitMsMap,
  gameTimeClassRecord,
} from '../../types';
import { Button } from 'apps/chessroulette-web/components/Button';

type Props = {
  onSelect: ({
    cameraOn,
    gameTimeClass,
  }: {
    cameraOn: boolean;
    gameTimeClass: GameTimeClass;
  }) => void;
  onCancel: () => void;
};

export const GameSelectDialog: React.FC<Props> = (props) => {
  const [gameTimeClass, setGameTimeClass] = useState<GameTimeClass>('untimed');

  return (
    <Dialog
      title="Game Type"
      modalBG="light"
      content={
        <div className="flex flex-col gap-3">
          <div className="flex flex-row gap-3">
            <div>Choose Game type:</div>
            <SelectInput
              value={gameTimeClass}
              onSelect={(v) => {
                const validOption = gameTimeClassRecord.safeParse(v);
                if (!validOption.success) {
                  return;
                }
                setGameTimeClass(validOption.data);
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
                  gameTimeClass,
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
