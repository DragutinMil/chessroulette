import React from 'react';
import Link from 'next/link';
import { Session } from 'next-auth';
import { Button } from '@app/components/Button';
import { links } from '../Room2/links';

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
            Class
          </Button>
        </Link>
        <Link
          href={links.getOnDemandRoomCreationLink({
            activity: 'meetup',
            star: '1', // TODO: Would be better to type it
          })}
        >
          <Button type="custom" bgColor="blue" className="font-bold w-full">
            Linkup
          </Button>
        </Link>
      </div>
    </main>
  );
};
