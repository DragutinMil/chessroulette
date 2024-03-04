import { invoke, objectKeys, toDictIndexedBy } from '@xmatter/util-kit';
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useMemo } from 'react';

export type SearchParamsRecord = Record<string, string | number | undefined>;

export const useUpdateableSearchParams = () => {
  const currentSearchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  return useMemo(
    () => ({
      get: (key: string) => {
        return currentSearchParams.get(key);
      },
      /**
       * This changes the URL
       *
       * @param nextSearchParams
       * @returns
       */
      set: (
        nextSearchParams?:
          | SearchParamsRecord
          | ((prev: SearchParamsRecord) => SearchParamsRecord)
      ) => {
        const searchParams = new URLSearchParams(
          currentSearchParams.toString()
        );

        const next = invoke(() => {
          if (typeof nextSearchParams === 'function') {
            return nextSearchParams(searchParamsToObject(currentSearchParams));
          }

          return nextSearchParams || {};
        });

        objectKeys(next).forEach((key) => {
          const nextVal = next[key];

          if (nextVal) {
            searchParams.set(key, String(next[key]));
          } else {
            searchParams.delete(key);
          }
        });

        // Change the URL
        router.push(`${pathName}?${searchParams.toString()}`);

        // return searchParams.toString();
      },

      current: () => currentSearchParams,
      toObject: () =>
        toDictIndexedBy(
          Array.from(currentSearchParams.entries()),
          ([key]) => key,
          ([, val]) => val
        ),
    }),
    [currentSearchParams]
  );
};

// const useSearchParamsAsState = () => {
// const searchParams = useUpdateableSearchParams();

// const [asObject, setAsObject] = useState(searchParams.toObject());

// // changed from outside
// useEffect(() => {
//   setAsObject(searchParams.toObject())
// }, [searchParams])

// // changed from here
// const setParams = useCallback((nextState) => {
//   searchParams.
// }, [searchParams]);

// return [asObject, setParams];
// };

const searchParamsToObject = (sp: ReadonlyURLSearchParams) =>
  toDictIndexedBy(
    Array.from(sp.entries()),
    ([key]) => key,
    ([, val]) => val
  );
