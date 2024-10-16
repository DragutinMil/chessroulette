import Link from 'next/link';
import { Session } from 'next-auth';
import React from 'react';
import { Button } from '@app/components/Button';
import { links } from '../room/links';
import { PlaySetupButton } from '../Play/components/PlaySetupButton/PlaySetupButton';

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
            Start Class as Instructor 2
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
