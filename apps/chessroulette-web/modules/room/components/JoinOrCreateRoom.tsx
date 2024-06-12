'use client';

import React, { useEffect, useState } from 'react';
import movexConfig from 'apps/chessroulette-web/movex.config';
import { useMovexResourceType } from 'movex-react';
import { useRouter } from 'next/navigation';
import { RoomState, initialRoomState } from '../movex/reducer';
import {
  objectKeys,
  toResourceIdentifierObj,
  toResourceIdentifierStr,
} from 'movex-core-util';
import { useUpdateableSearchParams } from 'apps/chessroulette-web/hooks/useSearchParams';
import { generateUserId, getRandomStr } from 'apps/chessroulette-web/util';
import { links } from '../links';
import { AsyncErr } from 'ts-async-results';
import { invoke, isOneOf } from '@xmatter/util-kit';
import {
  ActivityState,
  initialActivityStatesByActivityType,
} from '../activities/movex';
import { GameType, chessGameTimeLimitMsMap, gameTypeRecord } from '../../Play/types';
// import {
//   GameType,
//   chessGameTimeLimitMsMap,
//   gameTypeRecord,
// } from '../activities/Play/types';

type Props = {
  activity: ActivityState['activityType']; // To expand in the future
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
    if (
      !(
        roomResource &&
        isOneOf(activity, objectKeys(initialActivityStatesByActivityType))
      )
    ) {
      return;
    }

    invoke(() => {
      const updateableSearchParamsObject = updateableSearchParams.toObject();

      const parsedGameType = gameTypeRecord.safeParse(
        updateableSearchParamsObject.gameType
      );
      const gameType: GameType = parsedGameType.success
        ? parsedGameType.data
        : 'untimed';

      if (mode === 'create') {
        return roomResource.create(
          {
            ...initialRoomState,
            activity: {
              ...initialActivityStatesByActivityType[activity],
              ...(activity === 'play' && {
                activityState: {
                  ...initialActivityStatesByActivityType[activity]
                    .activityState,
                  gameType,
                  game: {
                    ...initialActivityStatesByActivityType[activity]
                      .activityState.game,
                    timeLeft: {
                      white: chessGameTimeLimitMsMap[gameType],
                      black: chessGameTimeLimitMsMap[gameType],
                    },
                  },
                },
              }),
            } as unknown as RoomState['activity'],
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
              activity: {
                ...initialActivityStatesByActivityType[activity],
                //TODO - this works but definitely not the prettiest & no typesafety -> find better way
                ...(activity === 'play' && {
                  activityState: {
                    ...initialActivityStatesByActivityType[activity]
                      .activityState,
                    gameType,
                    game: {
                      ...initialActivityStatesByActivityType[activity]
                        .activityState.game,
                      timeLeft: {
                        white: chessGameTimeLimitMsMap[gameType],
                        black: chessGameTimeLimitMsMap[gameType],
                      },
                    },
                  },
                }),
              } as unknown as RoomState['activity'],
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
            activity,
            userId: updateableSearchParams.get('userId') || generateUserId(),
          })
        );
      })
      .mapErr((e) => {
        // TODO: support the other reasons it might fail
        setError('RoomInexistent');
        console.error('JoinOrCreateRoom Error', e);
      });
  }, [roomResource, activity, id]);

  // TODO: Use the built in error page˝
  if (error === 'RoomInexistent') {
    return (
      <div className="flex flex-1 items-center justify-center h-screen w-screen text-lg  divide-x">
        <h1 className="text-2xl pr-2">404</h1>
        <h1 className="pl-2">Room not found.</h1>
      </div>
    );
  }

  return null;
};
