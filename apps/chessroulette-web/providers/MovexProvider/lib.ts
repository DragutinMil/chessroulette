import { objectKeys } from '@xmatter/util-kit';
import { MovexBoundResource } from 'movex';
import { MovexClientInfo } from './types';
import { UsersMap } from '@app/modules/User2';

export const movexSubcribersToUserMap = (
  subscribers: MovexBoundResource['subscribers']
) =>
  objectKeys(subscribers).reduce(
    (prev, nextSubscriberId) => ({
      ...prev,
      [nextSubscriberId]: {
        id: nextSubscriberId,
        displayName: (subscribers[nextSubscriberId].info as MovexClientInfo)
          .displayName,
      },
    }),
    {} as UsersMap
  );
