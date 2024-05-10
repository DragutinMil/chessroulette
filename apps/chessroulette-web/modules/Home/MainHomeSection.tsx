'use client';
import { Button } from 'apps/chessroulette-web/components/Button';
import { Session } from 'next-auth';
import React, { useState } from 'react';
import { links } from '../room/links';
import Link from 'next/link';
import { GameSelectDialog } from '../room/activities/Play/components/GameSelectDialog';
import { useRouter } from 'next/navigation';

type Props = {
  session?: Session;
};

export const MainHomeSection: React.FC<Props> = ({ session }) => {
  const [playModeDialog, showPlayModeDialog] = useState(false);
  const router = useRouter();

  return (
    <main className="flex flex-1 justify-center mt-32">
      <div className="flex gap-3 flex-col">
        <Link
          href={links.getOnDemandRoomCreationLink({
            activity: 'learn',
            instructor: true,
          })}
        >
          <Button type="custom" bgColor="blue" className="font-bold w-full">
            Start Class as Instructor
          </Button>
        </Link>
        <Link
          href={links.getOnDemandRoomCreationLink({
            activity: 'learn',
            instructor: true,
            theme: 'op',
          })}
        >
          <Button className="w-full">Start Class As Outpost Instructor</Button>
        </Link>
        <Link
          href={links.getOnDemandRoomCreationLink({
            activity: 'learn',
            instructor: true,
            theme: 'kids',
          })}
        >
          <Button bgColor="green" type="custom" className="w-full">
            Start Class as Kids Instructor
          </Button>
        </Link>
        <br />
        <Button
          onClick={() => showPlayModeDialog(true)}
          type="custom"
          bgColor="orange"
          className="font-bold w-full"
        >
          Start Play
        </Button>
        <br />
        <Link
          href={links.getOnDemandRoomCreationLink({
            activity: 'meetup',
            star: '1', // TODO: Would be better to type it
          })}
        >
          <Button type="custom" bgColor="blue" className="font-bold w-full">
            Host Meetup
          </Button>
        </Link>
      </div>
      {playModeDialog && (
        <GameSelectDialog
          onSelect={({ gameType }) => {
            router.push(
              links.getOnDemandRoomCreationLink({
                activity: 'play',
                gameType,
                host: true,
              })
            );
            showPlayModeDialog(false);
          }}
          onCancel={() => showPlayModeDialog(false)}
        />
      )}
    </main>
  );
};
