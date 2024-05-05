import { objectKeys, toDictIndexedBy } from '@xmatter/util-kit';
import { ActivityState } from './activities/movex';
import { GameType } from './activities/Play/types';
// import { ActivityState } from './activity/reducer';

export type RoomActivityType = ActivityState['activityType'];

export type RoomLinkParams = {
  instructor?: boolean;
  theme?: string;
  gameType?: GameType;
} & Record<string, string | boolean | number | undefined>;

export const links = {
  getRoomLink: (
    {
      id,
      activity,
      ...params
    }: {
      id: string;
      activity: RoomActivityType;
    } & RoomLinkParams,
    nav?: {
      origin: string;
    }
  ) =>
    // TODO: this can be refaactored to /room/{id} only and leaving the activity as part of the state
    `${nav?.origin ?? ''}/room/a/${activity}/${id}?${toSearchParams(
      params
    ).toString()}`,
  getOnDemandRoomCreationLink: (
    {
      id,
      ...params
    }: {
      id?: string;
      activity: RoomActivityType;
    } & RoomLinkParams,
    nav?: {
      origin: string;
    }
  ) =>
    `${nav?.origin ?? ''}/room/new/${id ? id : ''}?${toSearchParams(
      params
    ).toString()}`,
  getJoinRoomLink: (
    {
      id,
      ...params
    }: {
      id: string;
      activity: RoomActivityType;
    } & RoomLinkParams,
    nav?: {
      origin: string;
    }
  ) =>
    `${nav?.origin ?? ''}/room/join/${id}?${toSearchParams(params).toString()}`,
};

const toSearchParams = ({
  instructor,
  edit,
  theme,
  ...params
}: RoomLinkParams) => {
  const searchParams = new URLSearchParams(
    toDictIndexedBy(
      objectKeys(params),
      (key) => String(key),
      (key) => String(params[key])
    )
  );

  if (instructor) {
    searchParams.set('instructor', '1');
  }

  if (theme) {
    searchParams.set('theme', theme);
  }

  return searchParams;
};
