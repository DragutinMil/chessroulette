import React, { useState } from 'react';
import { objectKeys } from '@xmatter/util-kit';
import { Dialog } from '@app/components/Dialog';
import { SelectInput } from '@app/components/SelectInput';
import { Button } from '@app/components/Button';
// import { GameTimeClass, chessGameTimeLimitMsMap } from '@app/modules/Play';
import { GameTimeClass, gameTimeClassRecord } from '@app/modules/Game/io';
import { chessGameTimeLimitMsMap } from '../../constants';
// import {
//   GameTimeClass,
//   chessGameTimeLimitMsMap,
// } from '../../types';
// import { gameTimeClassRecord } from '../../io';

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
