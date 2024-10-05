'use client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { GameSelectDialog } from '../GameSelectDialog';
import { Button, ButtonProps } from 'apps/chessroulette-web/components/Button';
import { links } from 'apps/chessroulette-web/modules/room/links';
import { Dialog } from 'apps/chessroulette-web/components/Dialog';
import Link from 'next/link';

type Props = Omit<ButtonProps, 'onClick'>;

export const PlaySetupButton: React.FC<Props> = (props) => {
  const [playModeDialog, showPlayModeDialog] = useState(false);
  const router = useRouter();

  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);

  return (
    <>
      <Button
        {...props}
        // onClick={() => showPlayModeDialog(true)}
        onClick={() => setShowComingSoonDialog(true)}
        type="primary"
      >
        I want to Play
      </Button>
      {/* {playModeDialog && (
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
      )} */}
      {showComingSoonDialog && (
        <Dialog
          title="Coming Soon 🙊"
          hasCloseButton
          onClose={() => setShowComingSoonDialog(false)}
          content={
            <div>
              <p className="pb-4">
                We’re putting the finishing touches on this feature, but you can
                join our Discord Channel, and we'll let you know once it's
                ready!
                {/* drop us an email by clicking the button below, and we’ll notify
                you once it’s ready! */}
              </p>
              {/* <Link href="mailto:ana@chessroulette.live?subject=I want the Play Feature now 😅">
                <Button>Keep Me Posted!</Button>
              </Link> */}
              <Button
                type="primary"
                // size="medium"
                onClick={() => {
                  window.open('https://discord.gg/XT7rvgsH66');
                }}
              >
                Join Our Discord
              </Button>
            </div>
          }
        />
      )}
    </>
  );
};
