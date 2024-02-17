import { objectKeys, toDictIndexedBy } from '@xmatter/util-kit';

export type RoomLinkParams = {
  instructor?: boolean;
  edit?: boolean;
  theme?: string;
} & Record<string, string | boolean | number>;

export const links = {
  getRoomLink: (
    {
      id,
      activity,
      ...params
    }: {
      id: string;
      activity: 'learn'; // Add more
    } & RoomLinkParams,
    nav?: {
      origin: string;
    }
  ) =>
    `${nav?.origin ?? ''}/r/${activity}/${id}?${toSearchParams(
      params
    ).toString()}`,
  getOnDemandRoomCreationLink: (
    {
      id,
      ...params
    }: {
      id?: string;
      activity: 'learn'; // Add more
    } & RoomLinkParams,
    nav?: {
      origin: string;
    }
  ) => `${nav?.origin ?? ''}/r/new/${id ? id : ''}?${toSearchParams(params).toString()}`,
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

  if (edit) {
    searchParams.set('edit', '1');
  }

  if (theme) {
    searchParams.set('theme', theme);
  }

  return searchParams;
};
