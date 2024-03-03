'use client';

import React, { useEffect, useState } from 'react';
import movexConfig from 'apps/chessroulette-web/movex.config';
import { useMovexResourceType } from 'movex-react';
import { useRouter } from 'next/navigation';
import { initialRoomState } from '../movex/reducer';
import {
  toResourceIdentifierObj,
  toResourceIdentifierStr,
} from 'movex-core-util';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { generateUserId, getRandomStr } from 'apps/chessroulette-web/util';
import { links } from '../links';
import { AsyncErr } from 'ts-async-results';
import { invoke } from '@xmatter/util-kit';
import { initialLearnActivityState } from '../activities/Learn/movex';

type Props = {
  activity: 'learn'; // To expand in the future
} & (
  | {
      mode: 'join';
      id: string;
    }
  | {
      mode: 'joinOrCreate';
      id?: string;
    }
  | {
      mode: 'create';
      id?: undefined;
    }
);

type ErrorType = 'RoomInexistent';

/**
 * This should happen on the server once Movex has an API, and all of these can be called via fetch
 *
 * @param param0
 * @returns
 */
export const JoinOrCreateRoom: React.FC<Props> = ({
  activity,
  id,
  mode,
}: Props) => {
  const roomResource = useMovexResourceType(movexConfig, 'room');
  const router = useRouter();
  const updateableSearchParams = useUpdateableSearchParams();

  const [error, setError] = useState<ErrorType>();

  useEffect(() => {
    if (!(roomResource && activity === 'learn')) {
      return;
    }

    invoke(() => {
      if (mode === 'create') {
        return roomResource.create(
          {
            ...initialRoomState,
            activity: initialLearnActivityState,
          },
          getRandomStr(7) // the new room id
        );
      }

      return (
        id
          ? roomResource.get(
              toResourceIdentifierStr({
                resourceId: id,
                resourceType: 'room',
              })
            )
          : new AsyncErr('RoomInexistent')
      ) // Fail in order to crreate a new room
        .flatMapErr((e) => {
          // if the mode is "join" continue to throw
          if (mode === 'join') {
            return new AsyncErr(e);
          }

          return roomResource.create(
            {
              ...initialRoomState,
              activity: initialLearnActivityState,
            },
            id
          );
        });
    })
      .map((r) => {
        router.replace(
          links.getRoomLink({
            ...updateableSearchParams.toObject(),
            id: toResourceIdentifierObj(r.rid).resourceId,
            activity: 'learn',
            userId: updateableSearchParams.get('userId') || generateUserId(),
          })
        );
      })
      .mapErr((e) => {
        console.log('e', e);
        // if (e === 'RoomInexistent') {
        setError('RoomInexistent');
        // }
        // else if ()
      });
  }, [roomResource, activity, id]);

  if (error === 'RoomInexistent') {
    return (
      <div className="flex flex-1 items-center justify-center h-screen w-screen text-lg  divide-x">
        {/* <div className='flex- items-center'> */}
        <h1 className="text-2xl pr-2">404</h1>
        <h1 className="pl-2">Room not found.</h1>
        {/* </div> */}
      </div>
    );
  }

  return null;
};
