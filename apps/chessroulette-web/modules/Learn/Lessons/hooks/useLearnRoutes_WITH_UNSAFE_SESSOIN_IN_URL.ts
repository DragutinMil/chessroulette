'use client';

import { searchParamsToObject } from '@app/hooks/useSearchParams';
import { ReadonlyURLSearchParams, useSearchParams } from 'next/navigation';
// import { get_UNSAFE_URL_SESSION } from '@app/services/Auth/lib';
import { StringRecord } from '@xmatter/util-kit';
import { CustomSession } from '@app/services/Auth';
import { get_UNSAFE_URL_SESSION } from '@app/services/Auth/lib';
import { getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL } from '../links';
// import { get_UNSAFE_URL_SESSION_asd } from '@app/services/Auth/asd';
// import { toDictIndexedBy } from '@xmatter/util-kit';
// import {
//   getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL,
//   learnRoutes,
// } from '../links';


// export const searchParamsToObject = (sp: ReadonlyURLSearchParams) =>
//   toDictIndexedBy(
//     Array.from(sp.entries()),
//     ([key]) => key,
//     ([, val]) => val
//   );

// const get_UNSAFE_URL_SESSION = (searchParams: StringRecord) => {
//   // return searchParams;

//   if (searchParams.userId) {
//     return {
//       user: {
//         id: searchParams.userId,
//         displayName: searchParams.userDisplayName,
//       },
//       expires: '2222-11-22T22:22:22.222Z',
//     } satisfies CustomSession;
//   }

//   return undefined;

//   // return null;
// };

export const useLearnRoutes_WITH_UNSAFE_SESSOIN_IN_URL = () => {
  const searchParams = useSearchParams();

  // const x = searchParamsToObject(searchParams);
  // const y = get_UNSAFE_URL_SESSION(x);

  // console.log('searchParamsToObject(searchParams)', x);
  // console.log('get_UNSAFE_URL_SESSION(x)', x);
  const session = get_UNSAFE_URL_SESSION(searchParamsToObject(searchParams));
  // const session = get_UNSAFE_URL_SESSION({});
  // const session = undefined;

  if (!session) {
    return {};
  }

  return getLearnRoutes_WITH_UNSAFE_SESSION_IN_URL(session);
  // return {

  // }
};
