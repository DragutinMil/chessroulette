'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { GameSelectDialog } from '../GameSelectDialog';
import { Button } from '@app/components/Button';
import { links } from '@app/modules/Room/links';

type Props = {};

export const PlaySetupButton: React.FC<Props> = (props) => {
  const [playModeDialog, showPlayModeDialog] = useState(false);
  const router = useRouter();

  return (
    <div className="">
      <Button
        onClick={() => showPlayModeDialog(true)}
        type="custom"
        bgColor="orange"
        className="font-bold w-full"
      >
        Start Play
      </Button>
      {playModeDialog && (
        <GameSelectDialog
          onSelect={({ gameTimeClass }) => {
            router.push(
              links.getOnDemandRoomCreationLink({
                activity: 'play',
                gameTimeClass,
                host: true,
              })
            );
            showPlayModeDialog(false);
          }}
          onCancel={() => showPlayModeDialog(false)}
        />
      )}
    </div>
  );
};
