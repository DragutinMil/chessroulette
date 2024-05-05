'use client';
import { Button } from 'apps/chessroulette-web/components/Button';
import { Session } from 'next-auth';
import React, { useState } from 'react';
import { links } from '../room/links';
import Link from 'next/link';
import { Menu, Item, useContextMenu } from 'react-contexify';
import { chessGameTimeLimitMsMap } from '../room/activities/Play/components/Countdown/types';
import { objectKeys } from '@xmatter/util-kit';

type Props = {
  session?: Session;
};

const GAME_TYPE = 'gameType';

export const MainHomeSection: React.FC<Props> = ({ session }) => {
  const { show, hideAll } = useContextMenu({ id: GAME_TYPE });

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
        {/* TODO 
            This can either be moved inside the PlayActivity so you choose your game after
            you already entered the room.
            Or we can make the GameType types available global so then they are synched.
        */}
        <Menu id={GAME_TYPE}>
          {objectKeys(chessGameTimeLimitMsMap).map((gameType) => (
            <Link
              href={links.getOnDemandRoomCreationLink({
                activity: 'play',
                gameType,
              })}
            >
              <Item id={gameType} className="hover:cursor-pointer">
                <div>{`${gameType} ${
                  gameType !== 'untimed'
                    ? `- ${chessGameTimeLimitMsMap[gameType]} min`
                    : ''
                }`}</div>
              </Item>
            </Link>
          ))}
        </Menu>
        <Button
          onClick={(event) => show({ event })}
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
    </main>
  );
};
