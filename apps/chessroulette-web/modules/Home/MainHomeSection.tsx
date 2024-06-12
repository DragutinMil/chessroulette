import { Button } from 'apps/chessroulette-web/components/Button';
import { Session } from 'next-auth';
import React from 'react';
import { links } from '../room/links';
import Link from 'next/link';
import { PlaySetupButton } from '../Play/components/PlaySetupButton/PlaySetupButton';
// import { PlaySetupButton } from '../room/activities/Play/components/PlaySetupButton/PlaySetupButton';

type Props = {
  session?: Session;
};

export const MainHomeSection: React.FC<Props> = ({ session }) => {
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
        <PlaySetupButton />
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
    </main>
  );
};
